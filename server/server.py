from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Text
from werkzeug.security import generate_password_hash, check_password_hash
import traceback
import os
import datetime

import sys

def get_base_path():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.abspath(os.path.dirname(__file__))

base_path = get_base_path()
dist_path = os.path.join(base_path, 'dist') if getattr(sys, 'frozen', False) else os.path.join(base_path, '../dist')

app = Flask(__name__, static_folder=dist_path)

# Configure CORS with allowed origins from environment variable
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5001,http://127.0.0.1:5001").split(",")
CORS(app, origins=allowed_origins)  # Allow cross-origin requests

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///site.db"
db = SQLAlchemy(app)

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    themes: Mapped[list["Theme"]] = relationship(back_populates="author")

    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

class Theme(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    config_toml: Mapped[str] = mapped_column(Text, nullable=False)
    preview_image: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=True)
    downloads: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now, onupdate=datetime.datetime.now)
    author_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    author: Mapped["User"] = relationship(back_populates="themes")

    def __repr__(self):
        return f"Theme('{self.name}', '{self.author.username}')"

# Initialize database with app context
with app.app_context():
    db.create_all()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Missing username, email, or password'}), 400

    hashed_password = generate_password_hash(password)

    new_user = User(username=username, email=email, password_hash=hashed_password)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        db.session.rollback()
        if "UNIQUE constraint failed" in str(e):
            return jsonify({'error': 'Username or email already exists'}), 409
        traceback.print_exc()
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/extract-palette', methods=['POST'])
def extract_palette():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400

    image_url = data['url']
    
    try:
        extractor = ColorExtractor(image_url, output_dir='/tmp', palette_path='/tmp/dummy')
        
        extractor.prepare_image()
        extractor.extract_colors()
        
        palette = extractor.get_palette_dict()
        
        extractor.cleanup()
        
        if not palette:
            return jsonify({'error': 'Could not extract a valid palette. The image might be too small or have too few colors.'}), 500
            
        return jsonify(palette)

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password_hash, password):
        # In a real application, you would generate a JWT or session token here
        return jsonify({'message': 'Login successful', 'user_id': user.id}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/themes', methods=['POST'])
def upload_theme():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    config_toml = data.get('config_toml')
    preview_image = data.get('preview_image')
    category = data.get('category')
    author_id = data.get('author_id') # Placeholder: In real app, get from session/JWT

    if not name or not config_toml or not author_id:
        return jsonify({'error': 'Missing name, config_toml, or author_id'}), 400
    
    author = User.query.get(author_id)
    if not author:
        return jsonify({'error': 'Author not found'}), 404

    new_theme = Theme(
        name=name,
        description=description,
        config_toml=config_toml,
        preview_image=preview_image,
        category=category,
        author=author
    )
    try:
        db.session.add(new_theme)
        db.session.commit()
        return jsonify({'message': 'Theme uploaded successfully', 'theme_id': new_theme.id}), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/api/themes/<int:theme_id>', methods=['GET'])
def download_theme(theme_id):
    theme = Theme.query.get(theme_id)
    if not theme:
        return jsonify({'error': 'Theme not found'}), 404
    
    theme.downloads += 1
    db.session.commit()

    return jsonify({
        'id': theme.id,
        'name': theme.name,
        'description': theme.description,
        'config_toml': theme.config_toml,
        'preview_image': theme.preview_image,
        'category': theme.category,
        'downloads': theme.downloads,
        'author_username': theme.author.username,
        'created_at': theme.created_at.isoformat(),
        'updated_at': theme.updated_at.isoformat(),
    }), 200

@app.route('/api/themes', methods=['GET'])
def get_themes():
    category = request.args.get('category')
    query = Theme.query

    if category:
        query = query.filter_by(category=category)
    
    themes = query.all()
    return jsonify([
        {
            'id': theme.id,
            'name': theme.name,
            'description': theme.description,
            'config_toml': theme.config_toml, # Include TOML for direct download/import
            'preview_image': theme.preview_image,
            'category': theme.category,
            'downloads': theme.downloads,
            'author_username': theme.author.username,
            'created_at': theme.created_at.isoformat(),
            'updated_at': theme.updated_at.isoformat(),
        }
        for theme in themes
    ]), 200

THEME_CATEGORIES = ["Minimal", "Colorful", "Power-User", "Retro", "Official", "Devices"]

@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(THEME_CATEGORIES), 200

# Serve React App
@app.route('/', defaults={'path': ''})
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    is_packaged = getattr(sys, 'frozen', False)
    if is_packaged:
        import webbrowser
        import threading
        import time
        # Open browser slightly after server starts
        threading.Thread(target=lambda: (time.sleep(1.5), webbrowser.open('http://127.0.0.1:5001/'))).start()
    app.run(port=5001, debug=not is_packaged)

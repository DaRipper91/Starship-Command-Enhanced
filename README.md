# 🚀 Starship Theme Creator

A powerful, visual, no-code drag-and-drop editor for creating beautiful [Starship](https://starship.rs) shell prompt themes.

![Starship Theme Creator Interface](https://starship.rs/icon.png) _(Preview placeholder)_

## ✨ Features

- **Live Terminal Preview:** See your prompt update in real-time as you make changes. Powered by `xterm.js`, it renders your configuration exactly as your terminal would.
- **Drag-and-Drop Modules:** Easily reorder, enable, and disable Starship modules with an intuitive graphical interface. No more fighting with TOML syntax errors.
- **Intelligent Color Extraction:** Upload a background image or wallpaper, and our built-in Python backend will automatically extract a beautiful, matching color palette for your prompt.
- **Integrated Font Management:** Preview how your prompt looks with various popular Nerd Fonts. Download fonts directly from the app with guided installation instructions for your OS.
- **Advanced Formatting:** Full support for main formats, right-aligned formats (`right_format`), and multiline continuation prompts.
- **Robust History:** Never lose your work with full Undo/Redo capabilities and a local saved Theme Gallery complete with auto-generated visual previews.
- **Standalone Executable:** Run the entire application locally without needing to configure Node.js or Python environments.

## 🚀 Quick Start (Standalone Executable)

The easiest way to run the Starship Theme Creator is to build the standalone executable. This packages the React frontend and Flask/Python backend into a single runnable file.

### Prerequisites (For Building)

- Node.js (v18+)
- Python (v3.10+)

### Building and Running

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/DaRipper91/Starship-Command.git
    cd Starship-Command
    ```

2.  **Run the Build Script:**

    ```bash
    chmod +x build_exe.sh
    ./build_exe.sh
    ```

    _This script installs all NPM and Python dependencies, builds the Vite frontend, and uses PyInstaller to create the executable._

3.  **Run the Application:**
    ```bash
    ./server/dist/StarshipCommand
    ```
    _The application will start the local server and automatically open your default web browser to the editor._

---

## 🛠️ Development Setup

If you wish to contribute or modify the source code, you can run the frontend and backend separately in development mode.

### 1. Frontend (React + Vite)

```bash
# Install dependencies
npm install

# Start the Vite development server (usually runs on port 5173)
npm run dev
```

### 2. Backend (Python + Flask)

The backend is required for the Image Color Extraction feature.

```bash
# Navigate to the server directory
cd server

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask development server (runs on port 5001)
flask --app server.py run --port 5001 --debug
```

_(Note: The Vite development server is configured to proxy API requests to `http://localhost:5001` automatically)._

## 📚 Documentation

- [**User Guide**](USER_GUIDE.md) - Detailed instructions on how to use all features of the editor.
- [**Developer Guide**](DEVELOPER_GUIDE.md) - Architecture overview and contribution guidelines.
- [**Changelog**](CHANGELOG.md) - Version history and updates.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

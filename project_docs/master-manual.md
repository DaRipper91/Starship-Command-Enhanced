# Starship Theme Creator - Master Manual

**The definitive guide to building, using, and extending the Starship Theme Creator.**

---

## 📖 Table of Contents

1.  [**Introduction**](#-1-introduction)
2.  [**Installation & Setup**](#-2-installation--setup)
    - [Standalone Executable](#standalone-executable)
    - [Development Environment](#development-environment)
3.  [**User Guide**](#-3-user-guide)
    - [Interface Overview](#interface-overview)
    - [Module Management (Drag & Drop)](#module-management)
    - [Configuration (Style, Symbol, Format)](#configuration)
    - [Color & Font Management](#color--font-management)
    - [Theme Gallery & Presets](#theme-gallery--presets)
    - [Exporting & Importing](#exporting--importing)
4.  [**Advanced Features**](#-4-advanced-features)
    - [Comparison View](#comparison-view)
    - [Solar System (Community)](#solar-system)
    - [Command Palette](#command-palette)
    - [Undo/Redo System](#undoredo-system)
5.  [**Quick Reference**](#-5-quick-reference)
    - [Keyboard Shortcuts](#keyboard-shortcuts)
    - [Starship Format Syntax](#starship-format-syntax)
6.  [**Technical Architecture**](#-6-technical-architecture)
    - [Tech Stack](#tech-stack)
    - [State Management (Zustand)](#state-management)
    - [Core Logic (Parsers & Utils)](#core-logic)
7.  [**Troubleshooting & FAQ**](#-7-troubleshooting--faq)

---

## 🚀 1. Introduction

**Starship Theme Creator** is a powerful, visual, no-code editor for creating beautiful [Starship](https://starship.rs) shell prompt themes. It eliminates the need to manually edit TOML files by providing an intuitive interface with a live, high-fidelity terminal preview.

For more focused information, see our specialized guides:

- [**User Guide**](../USER_GUIDE.md) - For end-user instructions.
- [**Developer Guide**](../DEVELOPER_GUIDE.md) - For architecture and contribution details.
- [**Quick Reference**](quick-reference.md) - For fast lookup of shortcuts and syntax.

### Key Features

- **Live Terminal Preview**: Real-time rendering via `xterm.js`, powered by a custom Starship format parser.
- **Visual Module Builder**: Drag-and-drop to reorder modules; toggle them on/off with ease.
- **Adaptive Layout Modes**: Switch between **Mobile**, **Desktop**, or **Auto** modes to optimize for any screen size (perfect for Termux!).
- **Enhanced Glyph Support**: Integrated Nerd Font CDN ensures all symbols and icons render perfectly without local font installation.
- **Intelligent Color Extraction**: Automatically generate palettes from images using the integrated Python backend.
- **Nerd Font Management**: Browse and preview Nerd Fonts directly in the app.
- **Robust History**: Full Undo/Redo capabilities and local theme persistence.
- **Advanced Diffing**: Compare themes side-by-side before applying changes.

---

## 🛠️ 2. Installation & Setup

### Standalone Executable

The easiest way to run the application without managing separate frontend/backend processes.

1.  **Clone & Navigate**:
    ```bash
    git clone https://github.com/DaRipper91/Starship-Command.git
    cd Starship-Command
    ```
2.  **Build**:
    ```bash
    chmod +x build_exe.sh
    ./build_exe.sh
    ```
3.  **Run**:
    ```bash
    ./server/dist/StarshipCommand
    ```

### Development Environment

For contributors who want to modify the source code.

#### 1. Frontend (React + Vite)

```bash
npm install
npm run dev
```

_Runs on http://localhost:5173 by default._

#### 2. Backend (Python + Flask)

Required for image color extraction.

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

_Runs on http://localhost:5001. The frontend automatically proxies API requests._

---

## 🎨 3. User Guide

### Interface Overview

- **Left Sidebar**: Library management (Modules list with search, Image Color extraction, Font selection).
- **Center Console**: High-fidelity terminal preview with scenario cycling (Git, Python, Node, etc.).
- **Right Sidebar**: Deep configuration for the selected module (includes inline live preview) and global format controls.

### Switching Layouts

Use the **Layout Switcher** in the header to optimize your experience:

- **Mobile Mode**: Collapsible sidebars, ideal for small screens or mobile browsers.
- **Desktop Mode**: Persistent columns for maximum productivity on large displays.
- **Auto Mode**: Responds dynamically to your window width.

### Module Management

- **Add/Remove**: Toggle the checkbox next to any module in the Left Sidebar.
- **Reorder**: Drag the handle (☰) on active modules to change their position in the prompt.
- **Select**: Click a module to open its specific settings in the Right Sidebar.

### Configuration

Each module supports:

- **Style**: Edit colors (hex/named) and text modifiers (bold, italic, etc.) using the integrated **StyleEditor**.
- **Symbol**: Change the module's icon. Use the **Icon Browser** to find Nerd Font symbols.
- **Format**: Visually edit the segment order and content within a module using the **FormatEditor**.

### Color & Font Management

- **Image Palette**: Upload an image to extract its dominant colors. Apply them to your theme with one click.
- **Glyph Support**: Integrated Nerd Font CDN ensures symbols render correctly immediately.
- **Font Selector**: Choose from popular Nerd Fonts. The preview updates instantly. Note: For the actual terminal to match, you should still have the font installed locally.

### Theme Gallery & Presets

Access the **Gallery** to:

- Browse built-in presets (Nord, Dracula, Gruvbox, etc.).
- Manage your locally saved themes.
- View auto-generated previews of your saved themes.

### Exporting & Importing

- **Export**: Copy the generated TOML to your clipboard or download it as `starship.toml`.
- **Import**: Paste an existing `starship.toml` to load your current configuration into the visual editor.

---

## ⚡ 4. Advanced Features

### Comparison View

Click **Compare** to enter a split-screen mode. Compare your "Draft" theme against any saved theme or preset to see visual and configuration differences side-by-side.

### Solar System

Explore the **Community** view to see themes shared by other users (requires authentication).

### Command Palette

Press `Cmd+K` (or `Ctrl+K`) to open the Command Palette. Quickly search and execute actions like "Save Theme", "Export", or "Toggle Grid".

### Undo/Redo System

Never fear a mistake. Use the Undo/Redo buttons in the header or standard keyboard shortcuts to traverse your edit history.

---

## 📋 5. Quick Reference

### Keyboard Shortcuts

| Shortcut               | Action               |
| :--------------------- | :------------------- |
| `Cmd/Ctrl + S`         | Save current theme   |
| `Cmd/Ctrl + Z`         | Undo last change     |
| `Cmd/Ctrl + Shift + Z` | Redo last change     |
| `Cmd/Ctrl + K`         | Open Command Palette |
| `Cmd/Ctrl + O`         | Open Theme Gallery   |
| `Cmd/Ctrl + E`         | Export Config        |
| `Cmd/Ctrl + I`         | Import Config        |

### Starship Format Syntax

- `$variable`: Module output (e.g., `$directory`).
- `[text](style)`: Styled text (e.g., `[➜](bold green)`).
- `( ... )`: Conditional group (only renders if all contained variables are present).

---

## 🏗️ 6. Technical Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS.
- **State**: Zustand (with Zundo for history and Persist for storage).
- **Terminal**: `xterm.js` with Fit and Canvas addons.
- **Logic**: `@iarna/toml` for parsing, `colord` for manipulation, `html2canvas` for previews.

### State Management

The `useThemeStore` manages:

- `currentTheme`: The active configuration and metadata.
- `selectedModule`: The ID of the module currently being edited.
- `savedThemes`: Array of user-created themes.

### Core Logic

1.  **TomlParser**: Handles bidirectional conversion between TOML and JSON.
2.  **FormatParser**: Converts Starship format strings into ANSI sequences for `xterm.js`.
3.  **ColorUtils**: Resolves palette colors and handles image-to-palette logic.

---

## ❓ 7. Troubleshooting & FAQ

**Q: Why don't the icons look right in my actual terminal?**
A: Ensure you have a Nerd Font installed and active in your terminal settings. The app previews them, but your terminal needs the actual font files.

**Q: How do I backup my themes?**
A: Themes are saved in your browser's LocalStorage. To backup, use the **Export** feature to save your favorite themes as `.toml` files.

**Q: The Image Palette isn't working.**
A: Ensure the Python backend is running (port 5001). This feature requires the server-side extraction logic.

---

_Last Updated: March 2026 | Starship Theme Creator Team_

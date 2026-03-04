# Starship Theme Creator - User Guide

Welcome to the **Starship Theme Creator**! This tool is designed to make creating beautiful and highly customized [Starship](https://starship.rs/) shell prompts easy and visual. No more struggling with manual TOML editing.

## Table of Contents

1. [Interface Overview](#interface-overview)
2. [Managing Modules](#managing-modules)
3. [Global Settings](#global-settings)
4. [Color & Font Management](#color--font-management)
5. [Importing and Exporting](#importing-and-exporting)
6. [Theme Gallery](#theme-gallery)
7. [Undo and Redo](#undo-and-redo)

---

## Interface Overview

The interface is divided into three main sections:

1.  **Left Sidebar (Library & Settings):**
    - **Modules:** A list of available modules you can add to your prompt.
    - **Colors (Image Palette):** Upload an image to automatically extract a matching color palette.
    - **Font:** Browse, preview, and download Nerd Fonts for your terminal.
2.  **Center Console (Live Preview):**
    - This is an interactive `xterm.js` terminal. As you make changes to your theme, this preview updates in real-time, showing you exactly what your prompt will look like.
3.  **Right Sidebar (Configuration):**
    - **Module Config:** When you click a module in the Left Sidebar, its specific settings (symbols, colors, formatting) will appear here.
    - **Global Format Controls:** Configure the overall layout of your prompt (left format, right format, line breaks).

## Managing Modules

### Adding and Removing Modules

- **To Add:** In the Left Sidebar under "Modules", find a disabled module (grayed out) and click it. It will be added to your active prompt.
- **To Remove:** Click the "disable" or "trash" icon next to an active module, or remove its specific token (e.g., `$git_branch`) from the Global Format string.

### Reordering Modules

- You can easily reorder modules by dragging and dropping them within the Active Modules list in the Left Sidebar. This automatically updates the main format string.

### Configuring a Module

- Click on any active module to open its settings in the **Right Sidebar**.
- Here you can change its **Symbol**, text **Format**, and **Style** (colors and bold/italic flags).
- If you make a mistake, you can use the **Reset to Default** button at the top of the module configuration panel.

## Global Settings

At the bottom of the Right Sidebar, you'll find the **Global Format Settings**.

- **Left Prompt Format:** The main structure of your prompt. You can visually edit this to add raw text, spaces, or reorder modules manually.
- **Right Prompt Format:** Some terminals support right-aligned prompts. You can define modules to appear on the right side of the screen here.
- **Add Newline:** Toggle whether Starship should print a blank line before the prompt to keep your terminal clean.
- **Continuation Prompt:** The symbol used when a shell command spans multiple lines.

## Color & Font Management

### Image-to-Theme (Color Extraction)

Under the **Colors** section in the Left Sidebar, you can provide an image URL. The built-in Python backend will analyze the image and generate a matching color palette. You can then easily apply these colors to different modules.

### Font Downloader

A good prompt requires good fonts (specifically, Nerd Fonts for icons).

- Under the **Font** section in the Left Sidebar, you can select from popular Nerd Fonts (like FiraCode, JetBrains Mono, Meslo).
- The Live Preview will immediately update to show you how the font looks.
- Click **Download & Install** to get the font file and view instructions on how to install it on your specific operating system (Windows, macOS, or Linux).

## Importing and Exporting

### Exporting your Theme

Once you are happy with your creation, click the **Export** button in the top navigation bar.

- You will be provided with the raw TOML configuration.
- Click **Copy to Clipboard** and paste it into your `~/.config/starship.toml` file.

### Importing an Existing Theme

If you already have a `starship.toml` file, you can bring it into the editor to tweak it.

- Click **Import** in the top navigation bar.
- Paste your TOML code into the text area and click **Import Config**. The Live Preview and settings will update immediately.

## Theme Gallery

Click the **Gallery** button in the top navigation bar to explore preset themes and your locally saved themes.

- **Preset Themes:** A collection of popular, pre-built themes (like Dracula, Tokyo Night, etc.) to get you started quickly.
- **Saved Themes:** When you click **Save** in the top bar, your current theme is saved to your browser's local storage. It will appear here, complete with a visual preview image of the prompt.

## Undo and Redo

Made a mistake? The app features a robust history system.

- Use the **Undo** (Cmd/Ctrl + Z) and **Redo** (Cmd/Ctrl + Shift + Z) buttons in the top navigation bar to step backward or forward through your changes.

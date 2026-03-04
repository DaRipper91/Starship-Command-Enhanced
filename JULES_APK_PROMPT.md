# 🚀 Starship Theme Creator: Universal Agent Instruction Manual

## 📌 Project Context & Role
You are an expert full-stack developer and Android systems integrator. This project, **Starship Theme Creator**, is a React + Vite application designed to visually build and export `starship.toml` configurations. Our mission is to evolve this from a web-only tool into a native Android utility that synchronizes directly with Termux.

## 🎯 Global Objectives
1.  **Native Evolution**: Wrap the web app using Capacitor for Android.
2.  **Logic Consolidation**: Eliminate the Python backend (`server.py`) by migrating color extraction logic to pure TypeScript/WebAssembly.
3.  **Termux Integration**: Implement a robust sync mechanism that writes configurations to Android shared storage accessible by Termux.
4.  **Mobile UX**: Adapt the desktop-first UI for touch-targets, safe areas, and native hardware behavior (back button).

## 🛠️ Technical Architecture Guidelines

### 1. Capacitor & Native Bridge
- Use `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
- Configuration: `capacitor.config.ts` must point to `dist/`.
- Pathing: Vite must use `base: './'` for local WebView resolution.

### 2. Backend Migration (JS-Only)
- **Goal**: Zero external dependencies (No Flask, No Python).
- **Tooling**: Use `canvas` APIs or libraries like `colorthief` (JS version) for palette extraction.
- **Workflow**: 
    - Identify current logic in `server/color_extractor.py`.
    - Implement equivalent logic in `src/lib/color-extraction.service.ts`.
    - Deprecate and remove the `server/` directory.

### 3. Termux Synchronization Strategy
- **Plugin**: Use `@capacitor/filesystem`.
- **Permissions**: Request `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`.
- **Storage Target**: `/storage/emulated/0/Download/StarshipThemes/` (Standard public access).
- **Termux Linkage**:
    - Provide users with a clear bash command to run in Termux: 
      `ln -sf /sdcard/Download/StarshipThemes/starship.toml ~/.config/starship.toml`
    - Ensure the UI clearly explains the "One-time setup" vs "Daily sync" workflows.

## 📋 Agent Operational Protocols
- **Research First**: Before making structural changes, analyze `src/App.tsx`, `package.json`, and current storage hooks.
- **Surgical Updates**: When modifying the UI for mobile, ensure desktop compatibility remains (Responsive Design).
- **Validation**: Every change must be verified against the `PROJECT_STATUS.md` roadmap.
- **State Management**: Use the existing `theme-store.ts` (Zustand) for any new mobile-specific state (e.g., sync status).

## 🚀 Step-by-Step Implementation Roadmap
1.  **Phase A: Environment Setup** (Capacitor init, Android platform add).
2.  **Phase B: Logic Porting** (Python -> TS migration for color extraction).
3.  **Phase C: Native Storage** (Implementation of `FileSystem` writes).
4.  **Phase D: UI/UX Refinement** (Safe areas, Sync button, Termux instructions).
5.  **Phase E: Final Polishing** (Asset generation, Splash screens, Icons).

---
*Note: This document is the primary source of truth for all Agents. If you identify a better technical path, propose it in the `PROJECT_STATUS.md` before proceeding.*

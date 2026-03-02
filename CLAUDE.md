# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

This is a Termux environment on Android (arm64). The shell is `fish` (`/data/data/com.termux/files/usr/bin/fish`).

## Known Issues

- The Bash tool requires `/tmp` write access, which may be unavailable. Use `$TMPDIR` (Termux sets this to `/data/data/com.termux/files/usr/tmp`) if needed.
- The ripgrep binary bundled with Claude Code may not work — the Grep and Glob tools may fail as a result.
- When tools fail, prefer using `Read` directly with known file paths.

## Commands

```sh
npm run dev       # Start Vite dev server
npm run build     # Type-check (tsc -b) then production build
npm run lint      # Run ESLint
npm run lint -- --fix  # Auto-fix ESLint issues (also sorts imports)
npm run format    # Run Prettier
npm run preview   # Preview production build locally
npm test          # Run Vitest test suite
```

Run a single test file:

```sh
npx vitest run src/lib/format-parser.test.ts
```

Before committing, run `npm run format`, `npm run lint`, and `npm run build` to satisfy the Husky pre-commit hooks.

## Architecture

This is a **React 18 + Vite + TypeScript** single-page app for visually editing [Starship](https://starship.rs) shell prompt themes. The UI has a 3-column layout: left (module list + image palette), center (live xterm.js terminal preview), right (module config form).

### State: `src/stores/theme-store.ts`

All theme state lives in a single **Zustand** store with `persist` middleware (localStorage key: `starship-theme-storage`). Key state: `currentTheme`, `savedThemes`, `selectedModule`, and undo/redo stacks (`past`/`future`, max 50 entries). Only `currentTheme` and `savedThemes` are persisted. localStorage writes are debounced via `src/lib/storage-utils.ts`.

### Key Libraries

| Purpose                         | Library                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| Drag-and-drop module reordering | `@dnd-kit`                                                            |
| Terminal emulation              | `xterm.js`                                                            |
| Color manipulation              | `colord`                                                              |
| Image palette extraction        | `node-vibrant` (in a Web Worker)                                      |
| TOML parsing/stringification    | `@iarna/toml` (wrapped in `src/lib/toml-parser.ts`)                   |
| Styling                         | Tailwind CSS + `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) |

### Core Source Files

- **`src/lib/module-definitions.ts`** – Metadata for all 14+ built-in Starship modules (id, name, category, icon, `defaultEnabled`, `requiresNerdFont`, `expensive`).
- **`src/types/starship.types.ts`** – All TypeScript interfaces: `Theme`, `ThemeMetadata`, `StarshipConfig`, and per-module config types.
- **`src/lib/format-parser.ts`** – Parses Starship format strings into ANSI escape sequences for the terminal preview. Cycles through 4 mock scenarios (clean, dev, multilang, devops) from `src/lib/mock-data.ts`.
- **`src/lib/presets.ts`** – Built-in preset themes loaded in `ThemeGallery`.
- **`src/lib/color-utils.ts`** – Color harmony generation, WCAG contrast checking, and 8 built-in color presets (Nord, Dracula, Gruvbox, Catppuccin, etc.).

### Adding a New Starship Module

1. Add module metadata to `src/lib/module-definitions.ts`.
2. Add a config interface to `src/types/starship.types.ts` and include it in `StarshipConfig`.
3. Add mock values for the new module in `src/lib/mock-data.ts` (used by terminal preview).

### Build & Code Splitting

Vite splits vendor output into named chunks: `vendor-core` (React, Zustand), `vendor-ui` (Lucide, dnd-kit), `vendor-utils` (color libs, TOML, html2canvas), `vendor-terminal` (xterm). Chunk size warning limit is 400 KB.

## Code Style

- **No `any`**: TypeScript strict mode — use proper types or `unknown`.
- **No `console.log`** in production code; ESLint treats it as an error. Use `console.warn`/`console.error` sparingly.
- **Unused variables**: Prefix with `_` if intentionally unused.
- **Import order**: Automatically sorted by `eslint-plugin-simple-import-sort`; run `npm run lint -- --fix` to sort.
- **Path alias**: `@/*` maps to `src/*`.

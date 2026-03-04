# Changelog

## [1.5.0] - 2026-03-04

### Security

- **CORS Hardening:** Replaced open `CORS(app)` with an allowlist from the `ALLOWED_ORIGINS` environment variable (defaults to `localhost:5173/5001` for local dev safety). Eliminates cross-origin requests from arbitrary origins in production.

### Performance

- **useDynamicTheme Optimization:** Replaced `[...savedThemes, ...PRESET_THEMES].find()` with two sequential `.find()` calls. Eliminates unnecessary array allocation inside the `setInterval` that runs every minute.

### Changed

- **Fetch Error Handling:** Extracted duplicated `fetch`/JSON/error-handling boilerplate from `AuthModal`, `SolarSystem`, and `ThemeUploadModal` into a shared `src/lib/api.ts` helper (`fetchJson<T>`). Reduces surface area for HTTP error bugs.
- **CI Pipeline:** Added `.github/workflows/ci.yml` for automated lint + test runs on every push and pull request.
- **Claude Workflows:** Both `claude.yml` and `claude-code-review.yml` now support either `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN`, removing the hard dependency on OAuth.
- **Copilot Instructions:** Updated `.github/copilot-instructions.md` with Vitest globals note, `selectActiveModules` export, `src/components/ui/` primitives, and TypeScript compiler strictness details.



### Audited and Verified

- **Theme Import/Export Engine**: Verified full theme import/export system functionality and validations.
- **Undo/Redo Stack**: Audited immutable history stack pattern and keyboard shortcuts.
- **Theme Preset System**: Audited 8+ built-in theme presets and the preset selector component.
- **Type Safety Audit**: Checked TypeScript files for strict mode and absence of `any`.
- **State Management Refactor**: Confirmed centralized Zustand stores.
- **Vite Build Optimization**: Verified manual chunk splitting and build size targets.
- **Error Boundary & Runtime Resilience**: Checked React Error Boundaries and async error handling.
- **Code Consistency & Linting Enforcement**: Confirmed ESLint rules and zero violations.

## [1.3.0] - 2026-02-24

### Added

- **Theme Import/Export Engine**: Full theme import/export system with validation, serialization, and error handling.
- **Undo/Redo Stack**: Full undo/redo system with configurable limit of 50 steps using immutable history for all editor state.
- **Theme Preset System**: Curated set of 8 built-in theme presets with single-click application and unsaved changes prompt.

### Improved

- **Type Safety**: Audited all TypeScript files, removed all implicit and explicit uses of `any`, and fortified types across configuration parsing.
- **State Management**: Refactored logic to centralize editor/theme state through Zustand `theme-store.ts`.
- **Vite Build Optimization**: Implemented manual chunk splitting to isolate large vendor dependencies (`xterm`, `colord`, `@dnd-kit`) ensuring smaller chunk sizes under 400kb.
- **Runtime Resilience**: Wrapped major features with React Error Boundaries to prevent unexpected crashes.
- **Linting & Code Consistency**: Enforced strict rules in `.eslintrc.cjs` (no unused vars, no `any`, no production logs) and added `lint-staged` pre-commit hooks.

## [1.2.0] - 2026-02-23

### Added

- **Worker**: Offloaded image color extraction to a Web Worker for improved performance and responsiveness.
- **State Management**: Centralized active module parsing logic in `theme-store` selector.
- **Theme Preset System**: Verified and integrated robust preset loading with unsaved changes protection.

### Improved

- **Type Safety**: Enforced strict mode and eliminated `any` usage in critical paths.
- **Linting**: Enforced `no-console` rule and fixed all linting violations.
- **Error Handling**: Enhanced Error Boundaries and async error handling in Theme Gallery and Image Palette.
- **Build**: Optimized Vite build with manual chunks and verified build size.
- **Testing**: Updated tests to support Worker mocking and stricter type checks.

## [1.1.0] - 2026-02-22

### Added

- **Theme Import/Export**: Enhanced TOML validation and warning system for unknown modules.
- **Undo/Redo**: Added UI indicators and optimized history stack to prevent duplicate states.
- **Theme Presets**: Added confirmation prompt when loading presets if unsaved changes exist.
- **Type Safety**: Enforced strict TypeScript checks, eliminated `any`, and refined `StarshipConfig` types.
- **Resilience**: Added Error Boundaries to critical sections (ImagePalette, ComparisonView, ExportImport).
- **Build**: Optimized Vite build chunking (limit 400kb) and configured `tsc -b` for reliable type checking.
- **Tooling**: Added `lint-staged` and `husky` for pre-commit checks.

## [1.0.0] - 2026-02-22

### Added

- Complete UI layout.
- Terminal Preview with ANSI formatting.
- Drag and drop module builder.
- Color Picker and Image Palette extractor.
- Export/Import to TOML.
- Theme Gallery.
- Comparison View, Suggestion Panel, and Welcome Wizard.
- Accessibility configurations and Keyboard Command Palette.

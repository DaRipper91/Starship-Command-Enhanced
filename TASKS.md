# Feature Backlog

Actionable tasks for implementation. Each item lists the files to touch, the
expected behaviour, and enough context to start coding without reading the
whole codebase first.

---

## Architecture primer

| Concern                                       | File                                 |
| --------------------------------------------- | ------------------------------------ |
| Module metadata (id, icon, category)          | `src/lib/module-definitions.ts`      |
| TypeScript interfaces for every module config | `src/types/starship.types.ts`        |
| Mock values for terminal preview scenarios    | `src/lib/mock-data.ts`               |
| Format-string → ANSI renderer                 | `src/lib/format-parser.ts`           |
| All theme state + undo/redo                   | `src/stores/theme-store.ts`          |
| xterm.js live preview                         | `src/components/TerminalPreview.tsx` |
| Module config form (right sidebar)            | `src/components/ModuleConfig.tsx`    |
| Drag-and-drop module list (left sidebar)      | `src/components/ModuleList.tsx`      |
| Root layout + header                          | `src/App.tsx`                        |
| Preset themes                                 | `src/lib/presets.ts`                 |

State is managed by a single **Zustand** store (`useThemeStore`). Config is
persisted to `localStorage` via the `persist` middleware. The TOML
import/export lives in `src/lib/toml-parser.ts`. Path alias `@/*` → `src/*`.

---

## Task 1 — Expand Starship module coverage (15 → ~50 modules)

**Why:** The app currently defines 15 of Starship's 70+ modules. Users with
common modules like `username`, `golang`, `java`, or `gcloud` cannot configure
them visually.

**Files to change:**

- `src/lib/module-definitions.ts` — add entries to `MODULE_DEFINITIONS`
- `src/types/starship.types.ts` — add a config interface per module and include
  it in `StarshipConfig`
- `src/lib/mock-data.ts` — add a representative mock value to each scenario
  that exercises the module

**Modules to add (minimum viable set):**

| id             | name            | category  | icon | requiresNerdFont | expensive |
| -------------- | --------------- | --------- | ---- | ---------------- | --------- |
| `username`     | Username        | core      | `👤` | false            | false     |
| `hostname`     | Hostname        | core      | `🖥️` | false            | false     |
| `shell`        | Shell           | core      | `🐚` | false            | false     |
| `shlvl`        | Shell Level     | core      | `↕️` | false            | false     |
| `jobs`         | Background Jobs | system    | `⚙️` | false            | false     |
| `memory_usage` | Memory          | system    | `🧠` | false            | true      |
| `git_commit`   | Git Commit      | vcs       | `📌` | false            | false     |
| `git_metrics`  | Git Metrics     | vcs       | `📊` | false            | true      |
| `git_state`    | Git State       | vcs       | `🔀` | false            | false     |
| `golang`       | Go              | languages | `🐹` | false            | false     |
| `java`         | Java            | languages | `☕` | false            | false     |
| `ruby`         | Ruby            | languages | `💎` | false            | false     |
| `elixir`       | Elixir          | languages | `💧` | false            | false     |
| `php`          | PHP             | languages | `🐘` | false            | false     |
| `swift`        | Swift           | languages | `🦅` | false            | false     |
| `kotlin`       | Kotlin          | languages | `🎯` | false            | false     |
| `dotnet`       | .NET            | languages | `🔷` | false            | false     |
| `terraform`    | Terraform       | tools     | `🏗️` | false            | true      |
| `helm`         | Helm            | tools     | `⎈`  | false            | true      |
| `nix_shell`    | Nix Shell       | tools     | `❄️` | false            | false     |
| `conda`        | Conda           | tools     | `🐍` | false            | false     |
| `gcloud`       | GCloud          | cloud     | `☁️` | false            | true      |
| `azure`        | Azure           | cloud     | `☁️` | false            | true      |
| `env_var`      | Env Var         | system    | `📋` | false            | false     |
| `status`       | Exit Status     | core      | `✅` | false            | false     |

**Interface shape for each module** (add to `StarshipConfig` in
`starship.types.ts`):

```typescript
// Minimal — expand with module-specific fields as needed
interface UsernameConfig extends BaseModuleConfig {
  show_always?: boolean;
  format?: string;
}
interface HostnameConfig extends BaseModuleConfig {
  ssh_only?: boolean;
  trim_at?: string;
  format?: string;
}
// … one interface per module, keyed to match the module id
```

**Mock data hint:** Add a value in `MOCK_SCENARIOS.devops.values` for cloud
modules (`gcloud`, `azure`) and in `MOCK_SCENARIOS.dev.values` for language
modules. Value is the string the module would display (e.g.
`golang: 'v1.21.0'`).

**Acceptance criteria:**

- New modules appear in the "Disabled Modules" section of `ModuleList` and can
  be toggled into the active format string.
- Selecting a new module in the list opens `ModuleConfig` without crashing.
- `npm run build` passes (TypeScript strict mode, no implicit `any`).

---

## Task 2 — `right_format` support

**Why:** Starship supports a `right_format` string that renders on the right
side of the terminal line. Power users (Powerlevel10k converts) rely on this
heavily.

**Files to change:**

- `src/types/starship.types.ts` — add `right_format?: string` to
  `StarshipConfig` (it is likely already defined; verify)
- `src/stores/theme-store.ts` — ensure `updateConfig` and `exportToml` handle
  `right_format` correctly (they should automatically since config is a plain
  object)
- `src/components/TerminalPreview.tsx` — render `right_format` on the right
  side of the preview line
- `src/App.tsx` or a new `RightFormatEditor` component — add a secondary
  format-string input/editor alongside the existing one

**Terminal preview implementation:**
The xterm terminal is a fixed-width canvas. To simulate right-alignment:

1. Parse `right_format` through `parseFormatString` to get the rendered string.
2. Calculate its visible length (strip ANSI codes, count Unicode code points).
3. Write enough spaces so the right-format output ends at the terminal's column
   width, then write the rendered right string on the same line before the
   newline/prompt.

Helper to strip ANSI for length calculation:

```typescript
function visibleLength(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}
```

**UI:** Add a second labelled text area (or reuse `FormatEditor`) below the
existing format-string editor in the left sidebar, labelled "Right Format".
Wire it to `updateConfig({ right_format: value })`.

**Acceptance criteria:**

- Entering `$time` in the right-format field causes the current time to appear
  flush-right in the terminal preview.
- Exporting TOML includes `right_format = "..."` when set.
- Importing TOML with `right_format` populates the field.

---

## Task 3 — Screenshot / export as image

**Why:** Users want to share their theme as a PNG in READMEs, Discord, etc.
`html2canvas` is already in `package.json`.

**Files to change:**

- `src/components/TerminalPreview.tsx` — add a "Copy / Download PNG" button
- No new dependencies needed

**Implementation:**

```typescript
import html2canvas from 'html2canvas';

async function captureTerminal(containerEl: HTMLDivElement) {
  const canvas = await html2canvas(containerEl, {
    backgroundColor: '#1e1e1e',
    scale: 2, // retina
    useCORS: true,
  });
  return canvas;
}
```

Add two action buttons in the MacOS-style header bar of the terminal component
(next to the traffic-light dots):

- **Copy** — `canvas.toBlob` → `navigator.clipboard.writeImage` (with
  `ClipboardItem`); show a toast "Copied to clipboard" on success.
- **Download** — convert canvas to data URL, create a hidden `<a
download="theme-preview.png">`, click it.

The container `ref` already exists (`terminalRef`); pass its parent `<div>` to
`html2canvas` so the MacOS header bar is captured too (makes for a nicer share
image).

**Acceptance criteria:**

- Clicking "Download" saves a PNG of the current terminal preview.
- The PNG is at 2× resolution (crisp on retina displays).
- `npm run build` passes.

---

## Task 4 — Module search / filter

**Why:** Once Task 1 lands, the module list will have 50+ entries. Scrolling is
impractical.

**Files to change:**

- `src/components/ModuleList.tsx` — add a search input and filter logic

**Implementation:**
Add a controlled `<input type="search">` at the top of `ModuleList`, above the
"Active Modules" heading. Filter both the active and inactive module arrays
using a case-insensitive match against `item.name` and the corresponding
`ModuleDefinition.description` from `MODULE_DEFINITIONS`.

```typescript
const [query, setQuery] = useState('');

const filtered = useMemo(
  () =>
    inactiveModules.filter((m) => {
      const def = MODULE_DEFINITIONS.find((d) => d.id === m.id);
      const haystack = `${m.name} ${def?.description ?? ''}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    }),
  [inactiveModules, query],
);
```

Apply the same filter to `activeModules`.

Clear the query when the user enables/disables a module (reset on toggle in
`handleToggle`).

**Acceptance criteria:**

- Typing "git" shows only git-related modules.
- Clearing the input restores the full list.
- Active modules are also filtered (so users can quickly find and configure a
  specific active module).

---

## Task 5 — More preset themes

**Why:** The gallery ships only 3 presets. A richer gallery is a key marketing
surface for the app.

**Files to change:**

- `src/lib/presets.ts` — add preset objects

**Presets to add** (use the existing `ColorUtils.presets` palette values from
`src/lib/color-utils.ts` as starting points):

| Name            | Palette                          | Character symbol         | Branch symbol        |
| --------------- | -------------------------------- | ------------------------ | -------------------- |
| Dracula         | `ColorUtils.presets.Dracula`     | `[❯](bold #ff79c6)`      | `[🌱](bold #bd93f9)` |
| Tokyo Night     | `ColorUtils.presets.TokyoNight`  | `[❯](bold #7aa2f7)`      | `[](bold #bb9af7)`   |
| Nord            | `ColorUtils.presets.Nord`        | `[❯](bold #88c0d0)`      | `[](bold #81a1c1)`   |
| Gruvbox         | `ColorUtils.presets.Gruvbox`     | `[❯](bold #d79921)`      | `[](bold #98971a)`   |
| Catppuccin      | `ColorUtils.presets.Catppuccin`  | `[❯](bold #cba6f7)`      | `[](bold #89b4fa)`   |
| Minimal         | no palette — white on default bg | `$`                      | ``                   |
| Powerline Arrow | Dracula palette                  | `\ue0b0` separator style | `\ue0a0` branch      |

Each preset is a `Theme` object matching the existing shape in
`src/types/starship.types.ts`. Follow the existing preset structure in
`src/lib/presets.ts` exactly.

**Acceptance criteria:**

- New presets appear in `ThemeGallery` under the "Presets" section.
- Loading a preset populates the editor and terminal preview correctly.
- No TypeScript errors.

---

## Task 6 — Per-module live preview

**Why:** Editing a module's symbol or style requires the user to look at the
full terminal preview to see the result. A small inline preview next to the
config form is faster.

**Files to change:**

- `src/components/ModuleConfig.tsx` — add a preview strip at the top of the
  form
- `src/lib/format-parser.ts` — already exports `renderModule` and
  `parseFormatString`, reuse them

**Implementation:**
At the top of the `ModuleConfig` card (below the module name/heading), render a
small `<pre>` element styled to look like a terminal snippet. Use
`parseFormatString` with a synthetic format string `$<moduleName>` and the
first mock scenario (`MOCK_SCENARIOS.clean`) to produce ANSI output, then
convert it to React-renderable spans.

Because xterm.js is heavyweight, parse the ANSI output into styled `<span>`
elements instead:

```typescript
function ansiToSpans(ansi: string): React.ReactNode[] {
  // Split on \x1b[...m, track current style, emit <span style={...}>
  // Library option: 'ansi-to-react' (already may be available) or
  // implement a minimal parser for the codes styleToAnsi produces.
}
```

A lightweight approach: install `ansi-to-react` (MIT, tiny) or use the
existing `styleToAnsi` in reverse — since `format-parser.ts` only emits the
ANSI codes that `styleToAnsi` produces, the set is small and can be parsed with
a simple regex loop.

**Acceptance criteria:**

- Changing the `style` or `symbol` field instantly updates the preview span.
- The preview is visually consistent with the full terminal preview for the
  same module.
- The preview is hidden (returns `null`) when `selectedModule` is `null`.

---

## Task 7 — Nerd Font loader

**Why:** The terminal preview now has a Nerd Font fallback chain in its
`fontFamily`, but it only works if the user has a Nerd Font installed locally.
Many users don't. Letting them paste a font URL solves this permanently.

**Files to change:**

- `src/components/TerminalPreview.tsx` (or a new `FontLoader` component)
- `src/App.tsx` — add the font loader UI somewhere accessible (settings panel
  or terminal header)

**Implementation:**

```typescript
function loadFontFromUrl(url: string, family: string): Promise<void> {
  const face = new FontFace(family, `url(${url})`);
  return face.load().then((loaded) => {
    document.fonts.add(loaded);
  });
}
```

UI: A collapsible "Font Settings" section in the terminal's header bar. It
contains:

- A text input: "Font URL" — accepts a Google Fonts CSS2 URL or any direct
  `.woff2`/`.ttf` URL.
- A text input: "Font family name" — the `font-family` value to use (e.g.
  `"JetBrainsMono Nerd Font"`).
- An "Apply" button that calls `loadFontFromUrl` and then re-initialises the
  xterm `Terminal` instance with the new `fontFamily`.

Re-initialising xterm: dispose the existing terminal (`term.dispose()`), clear
`xtermRef.current`, and let the existing `useEffect` re-create it with the
updated `fontFamily` value stored in component state.

Persist the font URL + family name to `localStorage` under a separate key
(not the Zustand theme store — font preference is per-device, not per-theme).

**Acceptance criteria:**

- Pasting a valid woff2 URL and clicking Apply causes Nerd Font glyphs in the
  terminal preview to render correctly.
- The font setting survives a page refresh.
- Invalid URLs show an error toast (use the existing `ToastContext`).

---

## Task 8 — `continuation_prompt` editor

**Why:** Starship supports a `continuation_prompt` string shown in multiline
commands. It is a simple string field, easy to expose.

**Files to change:**

- `src/types/starship.types.ts` — verify `continuation_prompt?: string` exists
  in `StarshipConfig` (add if not)
- `src/App.tsx` or `src/components/ModuleConfig.tsx` — add an input field

**Implementation:**
The simplest approach: add `continuation_prompt` as a special "module" entry
in `MODULE_DEFINITIONS` with `id: 'continuation_prompt'` and `category:
'core'`. Because `ModuleConfig.tsx` already handles the generic `symbol` and
`format` fields, selecting this pseudo-module will let users edit the
continuation prompt string via the existing `format` input.

Alternatively, add a dedicated text input in the global config section of the
left sidebar (below the module list).

The default Starship value is `'[∙](bright-black) '`.

**Acceptance criteria:**

- The user can set a continuation prompt string.
- The value appears in the exported TOML as `continuation_prompt = "..."`.
- Importing a TOML that contains `continuation_prompt` populates the field.

---

## Task 9 — Expose `when`, `detect_files`, `detect_extensions` in custom module editor

**Why:** Custom modules are only useful when they run conditionally. The editor
currently exposes only `symbol`, `style`, `format`, and `command` — the `when`
predicate and file-detection fields are hidden, making custom modules
non-functional for most real use-cases.

**Files to change:**

- `src/types/starship.types.ts` — add `when?`, `detect_files?`,
  `detect_extensions?`, `detect_folders?` to `CustomModuleConfig`
- `src/components/ModuleConfig.tsx` — add form fields for these when
  `selectedModule` is a custom module

**New fields to expose in the form (custom modules only):**

| Field               | Input type                | Placeholder          |
| ------------------- | ------------------------- | -------------------- |
| `command`           | `<input type="text">`     | `echo hello`         |
| `when`              | `<input type="text">`     | `test -f .env`       |
| `detect_files`      | comma-separated `<input>` | `.env, .envrc`       |
| `detect_extensions` | comma-separated `<input>` | `py, js`             |
| `detect_folders`    | comma-separated `<input>` | `.git, node_modules` |
| `shell`             | `<input type="text">`     | `bash`               |

Store comma-separated values as `string[]` in the config (split on `,` with
trim on save, join on load).

**Detection:** In `ModuleConfig.tsx`, check whether the selected module is a
custom module with:

```typescript
const isCustomModule = selectedModule
  ? selectedModule in (currentTheme.config.custom ?? {})
  : false;
```

Show the extended fields only when `isCustomModule` is `true`.

**Acceptance criteria:**

- Custom modules display the extended fields in the config form.
- `when` and `detect_files` values round-trip through TOML export/import
  correctly.
- No regression on built-in module config forms.

---

## Task 10 — Fix undo/redo keyboard shortcut conflict in module config form

**Why:** Pressing `Cmd+Z` while editing a text input inside `ModuleConfig`
(e.g. the `symbol` field) triggers the _theme-level_ undo in `useThemeStore`
instead of the browser's native text-field undo. This causes jarring jumps to a
previous theme state rather than undoing the last character typed.

**Files to change:**

- `src/hooks/useKeyboardShortcuts.ts` — add a guard so theme-level shortcuts
  are suppressed when focus is inside an editable element
- `src/App.tsx` — no change needed if the hook is fixed correctly

**Fix in `useKeyboardShortcuts.ts`:**

```typescript
// Inside the keydown handler, before calling any handler:
const target = event.target as HTMLElement;
const isEditableTarget =
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA' ||
  target.isContentEditable;

if (isEditableTarget) return; // let the browser handle it natively
```

This single guard already exists as a pattern in many shortcut libraries. Apply
it to all registered shortcuts so that `Cmd+S`, `Cmd+Z`, `Cmd+Shift+Z`, and
`Cmd+K` do not fire while the user is typing in any form field.

**Exception:** `Cmd+S` (save) should still fire from text inputs if desired —
that is a UX judgement call. If so, remove `Cmd+S` from the `isEditableTarget`
suppression list.

**Acceptance criteria:**

- `Cmd+Z` inside the `symbol` input undoes text changes, not theme history.
- `Cmd+Z` in the terminal area (no focused input) still triggers theme undo.
- Existing keyboard shortcut tests (if any) continue to pass.
- `Cmd+K` no longer opens the command palette when the user is typing in the
  theme name input in the header.

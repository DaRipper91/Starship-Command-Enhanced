# Starship Theme Creator - Quick Reference

**Developer and Power User Cheat Sheet**

---

## 🎹 Keyboard Shortcuts

| Key               | Action             |
| :---------------- | :----------------- |
| `mod + s`         | Save current theme |
| `mod + z`         | Undo               |
| `mod + shift + z` | Redo               |
| `mod + k`         | Command Palette    |
| `mod + o`         | Theme Gallery      |
| `mod + e`         | Export Config      |
| `mod + i`         | Import Config      |
| `mod + /`         | Keyboard Help      |

---

## 📁 Core File Locations

- **Types**: `src/types/starship.types.ts`
- **Store**: `src/stores/theme-store.ts`
- **TOML Logic**: `src/lib/toml-parser.ts`
- **Format Parsing**: `src/lib/format-parser.ts`
- **Color Utils**: `src/lib/color-utils.ts`
- **Module Data**: `src/generated/module-definitions.json`

---

## 🛠️ Common Developer Tasks

### Accessing the Store

```typescript
const { currentTheme, updateConfig } = useThemeStore();
```

### Updating a Module

```typescript
updateConfig({
  directory: { ...currentTheme.config.directory, style: 'bold cyan' },
});
```

### Manually Parsing TOML

```typescript
import { TomlParser } from '@/lib/toml-parser';
const config = TomlParser.parse(tomlString);
```

---

## 🎨 Style Syntax Reference

Starship styles follow this pattern: `[modifiers] [foreground] [bg:background]`

**Modifiers**: `bold`, `italic`, `underline`, `dimmed`, `inverted`
**Colors**: `red`, `blue`, `#ff0000` (hex), `208` (ANSI 256)

**Examples**:

- `bold red`
- `italic bg:#282a36 #f8f8f2`
- `underline dimmed blue`

---

## 🚢 Useful Scripts

```bash
npm run dev          # Start development server
npm run build        # Build production assets
npm run start:prod   # Build and start prod server
npm test             # Run test suite
npm run sync:schema  # Update module definitions from Starship schema
```

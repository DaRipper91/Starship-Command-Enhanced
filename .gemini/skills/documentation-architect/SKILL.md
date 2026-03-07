---
name: documentation-architect
description: Automate the creation, update, and maintenance of high-quality Markdown documentation (User Guides, Developer Manuals, API docs). Use when Gemini CLI needs to document new features, update architecture guides, or extract documentation from source code (JSDoc/Types).
---

# Documentation Architect

This skill transforms Gemini CLI into a technical writer and documentation architect. It enforces consistency across the Starship Command project's manuals and guides.

## Core Workflows

### 1. Documenting New Features

When a new feature is added (e.g., a new component or hook):

- **Extract**: Analyze the source code for JSDoc comments, TypeScript interfaces, and props.
- **Synthesize**: Create a "How it Works" section for the `DEVELOPER_GUIDE.md`.
- **Tutorialize**: Create a "Using [Feature]" section for the `USER_GUIDE.md`.

### 2. Updating Architecture Guides

When core logic changes (e.g., state management refactors):

- **Trace**: Identify all affected documentation (README, Developer Guide, Master Manual).
- **Update**: Surgically replace outdated sections while maintaining the surrounding context.
- **Validate**: Ensure all internal links and references are still valid.

### 3. Extracting Documentation from Source

Use this workflow to generate technical references automatically:

- **Parse**: Use `grep_search` to find `interface`, `type`, and `export const/function` with JSDoc.
- **Format**: Convert extracted types into Markdown tables.

## Reference Materials

- **[Style Guide](references/style-guide.md)**: Tone, formatting, and project-specific terminology.
- **[Templates](references/templates.md)**: Boilerplate for different guide types.
- **[Checkpoints](references/checkpoints.md)**: Quality assurance checklist for documentation.

## Guidelines

- **Persona**: Write as a Senior Software Engineer. Be precise, technical, and concise.
- **Formatting**: Use GitHub Flavored Markdown (GFM). Ensure all code blocks have correct language identifiers.
- **Linking**: Always use relative links (e.g., `[User Guide](USER_GUIDE.md)`) instead of absolute paths.

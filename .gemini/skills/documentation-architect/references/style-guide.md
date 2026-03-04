# Documentation Style Guide

## Tone & Voice

- **Professional & Technical**: Avoid "happy path" fluff. Focus on how things work and why they are built that way.
- **Active Voice**: "The system performs..." instead of "The performance is carried out by...".
- **Concise**: If it can be said in 5 words, don't use 10.

## Markdown Conventions

- **Headers**: Use ATX-style headers (`#`, `##`, `###`).
- **Code Blocks**: Always specify the language (e.g., ` ```tsx`, ` ```bash`, ` ```toml`).
- **Lists**: Use dashes `-` for unordered lists.
- **Tables**: Use GFM tables for props, state, and API endpoints.

## Project Terminology

- **Module**: A Starship prompt component (e.g., `directory`, `git_branch`).
- **Theme**: A collection of Starship module configurations.
- **Store**: Specifically refers to the Zustand `useThemeStore`.
- **Checkpoint**: A milestone in the development roadmap (`project_docs/checkpoint-guide.md`).

## Diagramming

- Use Mermaid.js syntax for flowcharts and sequence diagrams.
- Clearly label all nodes and edges.

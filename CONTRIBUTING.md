# Contributing

We love pull requests!

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/awesome-feature`).
3. Make your changes.
4. Run tests (`npm test`).
5. Commit your changes (`git commit -m 'Add some feature'`).
6. Push to the branch (`git push origin feature/awesome-feature`).
7. Open a Pull Request.

## Code Style & Standards

We enforce strict code quality rules using ESLint and Prettier.

- **No `any`**: TypeScript strict mode is enabled. Avoid `any` at all costs.
- **Imports**: Imports are automatically sorted. Run `npm run lint -- --fix` to sort them.
- **No Console Logs**: Production code must not contain `console.log`. It will throw an error in production environments. Use `console.warn` or `console.error` sparingly.
- **Unused Variables**: Unused variables are strictly forbidden. Prefix with `_` if they are intentionally unused.
- **React Hooks**: Follow the rules of React Hooks rigorously.

Before committing, please run:

- `npm run format` (to fix formatting)
- `npm run lint` (to check for violations)
- `npm run build` (to ensure type safety - uses `tsc -b`)

We use `husky` and `lint-staged` to automatically check your code on commit.

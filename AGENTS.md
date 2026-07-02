# vscode-schemaforge

## Purpose
Bidirectional schema converter extension for VS Code — convert between SQL DDL, Prisma, Django, TypeORM, SQLAlchemy, Alembic, JSON Schema, GraphQL, EF Core, and Scala case classes.

## Build & Test Commands
- Install: `npm install`
- Test: `npm test` (runs node --test)
- Lint: `npm run lint` (eslint src --ext ts)
- Build: `npm run compile` (tsc -p ./)
- Pre-publish: `npm run vscode:prepublish`

## Architecture
Key directories:
- `src/` — Main extension source
  - `extension.ts` — Extension entry point + activation
  - `cli.ts` — SchemaForge CLI wrapper
  - `commands/` — Convert, detect, diff command handlers
  - `panels/` — Live preview WebView panel
  - `providers/` — Custom editor provider
- `.github/workflows/` — CI/CD (2 workflows)
- `syntaxes/` — TextMate grammars
- `media/` — Icons/assets

## Conventions
- Language: TypeScript
- Test framework: @vscode/test-electron (vscode-test)
- CI: GitHub Actions (2 workflows)
- Linting: eslint with @typescript-eslint
- Compilation: TypeScript 5.3+
- VS Code Engine: ^1.85.0
- Publisher: revenue-holdings

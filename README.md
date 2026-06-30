# SchemaForge VS Code Extension

[![CI](https://github.com/Coding-Dev-Tools/vscode-schemaforge/actions/workflows/ci.yml/badge.svg)](https://github.com/Coding-Dev-Tools/vscode-schemaforge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Bidirectional schema converter extension for VS Code — convert between SQL DDL, Prisma, Django, TypeORM, SQLAlchemy, Alembic, JSON Schema, GraphQL, EF Core, and Scala case classes.

Part of the [DevForge](https://devforge.revenueholdings.dev) open-source CLI tool suite by [Revenue Holdings](https://revenueholdings.dev).

## Features

- **Live Preview** — side panel showing your active schema file converted to all 11 formats
- **Quick Convert** — `Ctrl+Alt+S` to convert the active editor's schema to your target format
- **Format Detection** — `Ctrl+Alt+D` to detect schema format
- **Schema Diff** — diff two schema files in VS Code's native diff editor
- **Right-Click** — convert or detect from the file explorer context menu
- **Custom Editor** — rich conversion preview for `.schemaforge` files

## Prerequisites

Requires [SchemaForge](https://github.com/Coding-Dev-Tools/schemaforge) CLI installed:

```bash
pip install schemaforge
```

The CLI must be available on your PATH.

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `schemaforge.cliPath` | `schemaforge` | Path to the schemaforge CLI executable |
| `schemaforge.defaultTargetFormat` | `sql` | Default conversion target (`sql`, `prisma`, `django`, `sqlalchemy`, `alembic`, `json_schema`, `graphql`, `ef`, `scala`) |
| `schemaforge.livePreview.enabled` | `true` | Enable live preview when editing schema files |

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| SchemaForge: Convert Schema File... | — | Select a schema file and target format to convert |
| SchemaForge: Quick Convert (Active Editor) | `Ctrl+Alt+S` (`Cmd+Alt+S` on Mac) | Convert the active editor content to default target format |
| SchemaForge: Diff Two Schema Files | — | Select two files and view differences |
| SchemaForge: Detect Format | `Ctrl+Alt+D` (`Cmd+Alt+D` on Mac) | Detect the format of the active editor's content |

## Development

```bash
# Clone
git clone https://github.com/Coding-Dev-Tools/vscode-schemaforge.git
cd vscode-schemaforge

# Install dependencies
npm install

# Compile
npm run compile

# Lint
npm run lint

# Launch Extension Development Host
# Press F5 in VS Code
```

### Project Structure

```
src/
├── extension.ts          # Extension entry point + activation
├── cli.ts                # SchemaForge CLI wrapper
├── commands/
│   ├── convert.ts        # Convert command handler
│   ├── detect.ts         # Format detection handler
│   └── diff.ts           # Schema diff handler
├── panels/
│   └── previewPanel.ts   # Live preview WebView panel
└── providers/
    └── schemaEditorProvider.ts  # Custom editor provider
```

## License

<<<<<<< HEAD
MIT — see the [SchemaForge repository](https://github.com/Coding-Dev-Tools/schemaforge) for details.

---

<p align="center">
  <sub>Part of <a href="https://coding-dev-tools.github.io/revenueholdings.dev/">Revenue Holdings</a> — CLI tools and extensions built by autonomous AI.</sub>
</p>

## Test

```bash
npm test  # runs: vscode-test
```
=======
MIT — see [LICENSE](LICENSE) for details.
>>>>>>> 86cb06a7d5e26a330db483335957aa048f2881bb

# SchemaForge VS Code Extension

This is the VS Code extension for [SchemaForge](https://github.com/Coding-Dev-Tools/schemaforge) — the bidirectional ORM schema converter.

## Features

- **Live Preview** — side panel showing your active schema file converted to all 11 formats
- **Quick Convert** — `Ctrl+Alt+S` to convert the active editor's schema to your target format
- **Format Detection** — `Ctrl+Alt+D` to detect schema format
- **Schema Diff** — diff two schema files in VS Code's native diff editor
- **Right-Click** — convert or detect from the file explorer context menu
- **Custom Editor** — rich conversion preview for `.schemaforge` files

## Prerequisites

Requires SchemaForge CLI (`pip install schemaforge`) available on your PATH.

## Development

```bash
npm install
npm run compile
# Press F5 to launch Extension Development Host
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `schemaforge.cliPath` | `schemaforge` | Path to the schemaforge CLI |
| `schemaforge.defaultTargetFormat` | `prisma` | Default conversion target |
| `schemaforge.livePreview.enabled` | `true` | Enable live preview |

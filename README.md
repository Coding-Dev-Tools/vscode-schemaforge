# SchemaForge — VS Code Extension

[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](https://github.com/Coding-Dev-Tools/vscode-schemaforge/releases)
[![VS Code](https://img.shields.io/badge/VS%20Code-^1.85.0-007ACC.svg?logo=visualstudiocode)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/Coding-Dev-Tools/schemaforge/blob/main/LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![GitHub stars](https://img.shields.io/github/stars/Coding-Dev-Tools/vscode-schemaforge?style=social)](https://github.com/Coding-Dev-Tools/vscode-schemaforge)

> **Bidirectional schema converter right in your editor.**  
> Convert between SQL DDL, Prisma, Django, TypeORM, SQLAlchemy, Alembic, JSON Schema, GraphQL, EF Core, and Scala case classes — without leaving VS Code.

Powered by the [SchemaForge CLI](https://github.com/Coding-Dev-Tools/schemaforge).

---

## Features

### 🔄 Live Preview
Open any `.schemaforge` file and see a side panel with your schema converted to **all 11 formats** at once. Updates in real time as you edit.

### ⚡ Quick Convert (`Ctrl+Alt+S`)
Convert the active editor's schema to your target format in one keystroke. Output opens in a new tab.

### 🏷️ Format Detection (`Ctrl+Alt+D`)
Not sure what format a schema file is? One keystroke detects it — SQL, Prisma, Django models, and more.

### 📊 Schema Diff
Select two schema files in the explorer, right-click, and choose **SchemaForge: Diff** to see differences in VS Code's native diff editor.

### 📂 Right-Click Integration
- **Convert** any schema file from the file explorer context menu
- **Detect format** with a single right-click
- **Diff** two selected files

### ✏️ Custom Editor
Rich conversion preview for `.schemaforge` files — see your schema rendered in all target formats side by side.

---

## Installation

### From VS Code Marketplace _(recommended)_

1. Open VS Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for **"SchemaForge"**
4. Click **Install**

### From VSIX

Download the latest `.vsix` from the [releases page](https://github.com/Coding-Dev-Tools/vscode-schemaforge/releases) and install:

```bash
code --install-extension vscode-schemaforge-1.7.0.vsix
```

### From Source

```bash
git clone https://github.com/Coding-Dev-Tools/vscode-schemaforge.git
cd vscode-schemaforge
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

---

## Prerequisites

The extension requires the **SchemaForge CLI** to be installed and available on your PATH:

```bash
pip install schemaforge
```

Verify it's installed:

```bash
schemaforge --help
```

If the CLI is installed at a custom path, set it in VS Code settings (see [Configuration](#configuration)).

---

## Quick Start

1. **Install** SchemaForge CLI: `pip install schemaforge`
2. **Install** the extension (see above)
3. Open any schema file (`.sql`, `.prisma`, `models.py`, etc.)
4. Press `Ctrl+Alt+S` to convert it — or open a `.schemaforge` file for live preview

---

## Commands

| Command | Keyboard Shortcut | Description |
|---------|-------------------|-------------|
| `SchemaForge: Convert Schema File...` | — | Select a file and target format interactively |
| `SchemaForge: Quick Convert (Active Editor)` | `Ctrl+Alt+S` | Convert active file to default target format |
| `SchemaForge: Detect Format` | `Ctrl+Alt+D` | Detect schema format of the active file |
| `SchemaForge: Diff Two Schema Files` | — | Select two files and diff them |

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `schemaforge.cliPath` | `schemaforge` | Path to the `schemaforge` CLI executable. Set this if the CLI is not on your PATH or you use a specific version. |
| `schemaforge.defaultTargetFormat` | `sql` | Default target format for Quick Convert. Options: `sql`, `prisma`, `django`, `drizzle`, `typeorm`, `sqlalchemy`, `alembic`, `jsonschema`, `graphql`, `efcore`, `scala`. |
| `schemaforge.livePreview.enabled` | `true` | Enable/disable the live preview panel for `.schemaforge` files. |

---

## Supported Schema Formats

Convert **from** any of these formats **to** any other:

- SQL DDL (CREATE TABLE statements)
- Prisma Schema
- Django Models
- TypeORM Entities
- SQLAlchemy Models
- Alembic Migrations
- JSON Schema
- GraphQL Types
- Entity Framework Core (C#)
- Scala Case Classes

---

## Development

```bash
# Clone
git clone https://github.com/Coding-Dev-Tools/vscode-schemaforge.git
cd vscode-schemaforge

# Install dependencies
npm install

# Compile
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Launch Extension Development Host
# Press F5 in VS Code
```

### Project Structure

```
src/
├── extension.ts          # Extension entry point & activation
├── cli.ts                # SchemaForge CLI wrapper
├── commands/             # Command handlers
│   ├── convert.ts
│   ├── diff.ts
│   └── detect.ts
├── providers/            # VS Code providers
│   └── ...               # Tree views, code lenses, etc.
└── panels/               # Webview panels
    └── ...               # Live preview, custom editor
```

---

## License

MIT — see the [SchemaForge repository](https://github.com/Coding-Dev-Tools/schemaforge) for details.

---

<p align="center">
  <sub>Part of <a href="https://coding-dev-tools.github.io/revenueholdings.dev/">Revenue Holdings</a> — CLI tools and extensions built by autonomous AI.</sub>
</p>

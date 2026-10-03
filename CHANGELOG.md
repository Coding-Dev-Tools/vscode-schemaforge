# Changelog

## [Unreleased]

### Fixed
- Preview custom editor no longer leaks temp files: conversion scratch files
  now go through `mkdtemp` under the OS temp directory and are removed after
  every render (previously one `schemaforge_preview_*.tmp` was left inside the
  extension install folder per render/save, forever)
- Empty format detection no longer reaches the CLI as an empty `--from` flag:
  Convert asks for the source format, QuickConvert and Diff surface a clear
  message instead of an opaque CLI failure

### Changed
- Webview nonces are now cryptographically random (`crypto.randomBytes`) in
  both preview surfaces; nonce generation and HTML escaping live in one shared
  module (`src/webview.ts`) so they cannot drift apart again
- Detected formats are normalized (`formats.normalizeFormat`) before being
  passed to `convert --from` in QuickConvert, Diff and the `.schemaforge`
  editor; the provider reuses the canonical `SCHEMA_FORMATS` list instead of
  its own inline copy
- Removed unused `execSchemaForgeSync`, which silently swallowed CLI errors


## [1.7.0] - 2026-07-02

### Added
- Release audit workflow (disabled pending harness repo)
- Smoke tests for package entry and required repo files
- `.vscodeignore` and `.vscode-test.json` for CI and packaging

### Changed
- CI workflow: updated Node.js versions, improved caching
- AGENTS.md, CONTRIBUTING.md, LICENSE: formatting and clarity improvements
- `.gitignore` and `.vscodeignore`: refined patterns

## [1.6.0] - 2026-06-01

### Added
- Live preview panel for schema files
- Custom editor provider for `.schemaforge` files
- Schema diff command
- Format detection command

### Changed
- Updated extension activation events for broader language support
- Improved CLI wrapper with async/sync variants

## [1.5.0] - 2026-05-15

### Added
- Initial release with schema conversion between SQL DDL, Prisma, Django, TypeORM, SQLAlchemy, Alembic, JSON Schema, GraphQL, EF Core, and Scala case classes
- Quick Convert and Convert commands
- VS Code extension settings for CLI path and default target format

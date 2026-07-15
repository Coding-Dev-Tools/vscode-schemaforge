const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");

// Load the compiled module (the `pretest` script compiles src -> out).
const formats = require(path.join(__dirname, "..", "out", "formats.js"));

test("normalizeFormat lowercases and trims detected labels", () => {
  assert.strictEqual(formats.normalizeFormat("SQL"), "sql");
  assert.strictEqual(formats.normalizeFormat(" Prisma "), "prisma");
  assert.strictEqual(formats.normalizeFormat("JSON_SCHEMA"), "json_schema");
});

test("normalizeFormat maps to the canonical token for known formats", () => {
  for (const f of formats.SCHEMA_FORMATS) {
    assert.strictEqual(formats.normalizeFormat(f.toUpperCase()), f);
  }
});

test("normalizeFormat passes unknown formats through (so the CLI errors clearly)", () => {
  assert.strictEqual(formats.normalizeFormat("mongodb"), "mongodb");
});

test("normalizeFormat handles empty / undefined / null input", () => {
  assert.strictEqual(formats.normalizeFormat(""), undefined);
  assert.strictEqual(formats.normalizeFormat("   "), undefined);
  assert.strictEqual(formats.normalizeFormat(undefined), undefined);
  assert.strictEqual(formats.normalizeFormat(null), undefined);
});

test("SCHEMA_FORMATS matches the package.json defaultTargetFormat enum", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
  const enumVals = pkg.contributes.configuration.properties["schemaforge.defaultTargetFormat"].enum;
  assert.deepStrictEqual(formats.SCHEMA_FORMATS.slice().sort(), enumVals.slice().sort());
});

test("source call sites import SCHEMA_FORMATS instead of inlining the list", () => {
  const root = path.join(__dirname, "..");
  const files = ["src/commands/convert.ts", "src/panels/previewPanel.ts", "src/cli.ts"];
  for (const rel of files) {
    const src = fs.readFileSync(path.join(root, rel), "utf-8");
    assert.doesNotMatch(
      src,
      /\['sql', 'prisma', 'drizzle', 'typeorm', 'django', 'sqlalchemy', 'alembic', 'json_schema', 'graphql', 'ef', 'scala'\]/,
      `${rel} should import SCHEMA_FORMATS instead of inlining the list`
    );
  }
});

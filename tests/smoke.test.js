const test = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

test("smoke: package main entry exists and parses", () => {
  const pkg = require(path.join(__dirname, "..", "package.json"));
  assert.ok(pkg.name, "package.json has a name");
  const main = pkg.main || "index.js";
  const cli = pkg.bin ? Object.values(pkg.bin)[0] : null;
  const entry = cli || main;
  if (fs.existsSync(path.join(__dirname, "..", entry))) {
    assert.doesNotThrow(
      () => execFileSync("node", ["--check", entry], { stdio: "ignore" }),
      `${entry} must be valid JavaScript`
    );
  }
});

test("smoke: required repo files present", () => {
  const root = path.join(__dirname, "..");
  for (const f of ["package.json", "README.md", "LICENSE"]) {
    assert.ok(fs.existsSync(path.join(root, f)), `${f} must exist`);
  }
});

// --- Webview hardening regression guards (network-free, source-level) --------
// These lock in the CSP + escaping + newline fixes made to the two schema
// preview webviews so a future edit cannot silently reopen the injection hole
// or reintroduce the split('\\n') truncation no-op.
const WEBVIEW_FILES = [
  "src/panels/previewPanel.ts",
  "src/providers/schemaEditorProvider.ts",
];

test("security: script-enabled webviews declare a CSP + nonce", () => {
  const root = path.join(__dirname, "..");
  for (const rel of WEBVIEW_FILES) {
    const src = fs.readFileSync(path.join(root, rel), "utf-8");
    if (!/enableScripts:\s*true/.test(src)) continue;
    assert.match(src, /Content-Security-Policy/, `${rel} must set a CSP`);
    assert.match(src, /getNonce\(\)/, `${rel} must generate a script nonce`);
    assert.match(
      src,
      /<script nonce="\$\{nonce\}"/,
      `${rel} inline script must carry the nonce`
    );
  }
});

test("security: detected source format is escaped in webviews", () => {
  const root = path.join(__dirname, "..");
  for (const rel of WEBVIEW_FILES) {
    const src = fs.readFileSync(path.join(root, rel), "utf-8");
    assert.doesNotMatch(
      src,
      /badge[^>]*>\$\{sourceFormat\}</,
      `${rel} must escape sourceFormat before interpolating it`
    );
  }
});

test("correctness: preview detail truncation splits on real newlines", () => {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "src/panels/previewPanel.ts"),
    "utf-8"
  );
  assert.ok(
    !src.includes("split('\\\\n')"),
    "detectDetails must split on a real newline, not the literal '\\\\n'"
  );
});

// --- Temp-file lifecycle + nonce randomness + shared-helper guards ----------

test("security: webview nonces come from crypto, not Math.random", () => {
  const root = path.join(__dirname, "..");
  for (const rel of WEBVIEW_FILES) {
    const src = fs.readFileSync(path.join(root, rel), "utf-8");
    assert.doesNotMatch(
      src,
      /Math\.floor\(Math\.random/,
      `${rel} must not derive CSP nonces from Math.random (predictable)`
    );
    assert.match(
      src,
      /from ["']\.\.\/webview["']/,
      `${rel} must use the shared hardened helpers in src/webview.ts`
    );
  }
});

test("correctness: preview temp files use the OS temp dir and are cleaned up", () => {
  const src = fs.readFileSync(
    path.join(__dirname, "..", "src/providers/schemaEditorProvider.ts"),
    "utf-8"
  );
  assert.doesNotMatch(
    src,
    /["']\.temp["']/,
    "temp files must never be written into the extension install folder"
  );
  assert.match(src, /mkdtemp/, "must create a unique per-render temp dir");
  assert.match(src, /os\.tmpdir\(\)/, "temp dir must live under the OS temp dir");
  assert.match(
    src,
    /finally\s*\{[\s\S]*?rmSync/,
    "the temp dir must be removed in a finally block"
  );
});

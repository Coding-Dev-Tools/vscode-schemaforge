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

// --- CLI shell-mode injection guards (Windows .cmd/.bat wrappers) ------------
// When schemaforge.cliPath points at a .cmd/.bat on Windows, execFile must run
// with shell:true — and Node then flattens argv into one `cmd.exe /c` line with
// NO quoting of its own. These guards lock in the fix that quotes every
// argument and rejects metacharacter-bearing ones instead of letting cmd.exe
// interpret them as control syntax.

test("security: shell-mode args are quoted and metacharacters rejected", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "src/cli.ts"), "utf-8");
  assert.match(src, /CMD_METACHARS/, "cli.ts must define a cmd.exe metacharacter set");
  assert.match(src, /quoteShellArg/, "cli.ts must export a quoting helper for shell mode");
  assert.match(
    src,
    /useShell\s*\?\s*args\.map\(quoteShellArg\)\s*:\s*args/,
    "shell-mode invocations must pass every argument through quoteShellArg"
  );
});

test("security: metacharacter rejection fires BEFORE any process spawn", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "src/cli.ts"), "utf-8");
  const mapIdx = src.indexOf("args.map(quoteShellArg)");
  const spawnIdx = src.indexOf("execFile(cli");
  assert.ok(mapIdx !== -1 && spawnIdx !== -1, "both markers present");
  assert.ok(mapIdx < spawnIdx, "quoting/rejection must happen before execFile is called");
});

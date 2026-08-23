const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

// Compiled by `pretest` (src -> out). Pure Node helpers only — no vscode dep.
const webview = require(path.join(__dirname, "..", "out", "webview.js"));

test("security: nonces are hex, fixed length, and never repeat", () => {
  assert.match(webview.getNonce(), /^[0-9a-f]{32}$/);
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    seen.add(webview.getNonce());
  }
  assert.strictEqual(seen.size, 200, "nonce space must be effectively unique");
});

test("escapeHtml neutralizes markup-sensitive characters", () => {
  assert.strictEqual(
    webview.escapeHtml('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
  );
  assert.strictEqual(webview.escapeHtml("&<>'\""), "&amp;&lt;&gt;&#39;&quot;");
  assert.strictEqual(webview.escapeHtml(""), "");
});

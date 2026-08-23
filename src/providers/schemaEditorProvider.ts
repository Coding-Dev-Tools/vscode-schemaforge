import * as vscode from 'vscode';
import { execSchemaForge } from '../cli';
import { SCHEMA_FORMATS, normalizeFormat } from '../formats';
import { escapeHtml, getNonce } from '../webview';

/**
 * Custom editor provider for .schemaforge files.
 * Shows a rich preview of the schema and its conversions.
 */
export class SchemaPreviewProvider implements vscode.CustomTextEditorProvider {
    constructor(private readonly extensionUri: vscode.Uri) {}

    async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri],
        };

        webviewPanel.webview.html = this.getLoadingHtml(webviewPanel.webview);

        const render = async () => {
            const content = document.getText();
            if (!content.trim()) {
                webviewPanel.webview.html = this.getEmptyHtml(webviewPanel.webview);
                return;
            }

            // The conversion runs against a temp copy of the document. It must
            // live under the OS temp dir (never inside the extension install
            // folder) and be deleted afterwards - the previous implementation
            // leaked one schemaforge_preview_*.tmp per render/save forever.
            const fs = await import('fs');
            const path = await import('path');
            let tmpFile: string | undefined;
            try {
                const tmp = await this.writeTempFile(content, document.fileName);
                tmpFile = tmp.file;

                const detectResult = await execSchemaForge(['detect', tmp.file]);
                const sourceFormat = normalizeFormat(detectResult) ?? '';

                const targetFormats = SCHEMA_FORMATS.filter(f => f !== sourceFormat).slice(0, 6);

                const conversions: Array<{ format: string; result: string; error?: string }> = [];
                for (const fmt of targetFormats) {
                    try {
                        const result = await execSchemaForge(['convert', tmp.file, '--from', sourceFormat, '--to', fmt]);
                        conversions.push({ format: fmt, result: result || '(empty)' });
                    } catch (e) {
                        conversions.push({ format: fmt, result: '', error: e instanceof Error ? e.message : String(e) });
                    }
                }

                webviewPanel.webview.html = this.getPreviewHtml(sourceFormat, conversions, document.fileName, webviewPanel.webview);
            } catch (e) {
                webviewPanel.webview.html = this.getErrorHtml(e instanceof Error ? e.message : String(e), webviewPanel.webview);
            } finally {
                if (tmpFile) {
                    try {
                        fs.rmSync(path.dirname(tmpFile), { recursive: true, force: true }); // best-effort cleanup
                    } catch { /* OS temp dir is swept periodically anyway */ }
                }
            }
        };

        // Initial render
        await render();

        // Re-render on save
        const changeSubscription = vscode.workspace.onDidSaveTextDocument(e => {
            if (e.uri.toString() === document.uri.toString()) {
                render();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeSubscription.dispose();
        });
    }

    private async writeTempFile(content: string, originalName: string): Promise<{ file: string; dir: string }> {
        const fs = await import('fs');
        const os = await import('os');
        const path = await import('path');
        // mkdtemp under the OS temp dir: collision-proof, outside the install
        // folder, and removable as a whole directory afterwards.
        const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'schemaforge-preview-'));
        const base = path.basename(originalName).replace(/[^\w.-]+/g, '_') || 'schema';
        const file = path.join(dir, `${base}.tmp`);
        await fs.promises.writeFile(file, content, 'utf-8');
        return { file, dir };
    }

    /** Build a strict Content-Security-Policy <meta> for a preview webview. */
    private cspMeta(webview: vscode.Webview, nonce?: string): string {
        const script = nonce ? ` script-src 'nonce-${nonce}';` : '';
        return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline';${script}">`;
    }

    private getLoadingHtml(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html><head>${this.cspMeta(webview)}</head><body style="padding: 32px; text-align: center;"><p>Loading SchemaForge preview...</p></body></html>`;
    }

    private getEmptyHtml(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html><head>${this.cspMeta(webview)}</head><body style="padding: 32px; text-align: center; color: var(--vscode-descriptionForeground);">
    <p>Empty schema file. Add content to see format conversions.</p>
</body></html>`;
    }

    private getErrorHtml(message: string, webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html><head>${this.cspMeta(webview)}</head><body style="padding: 16px;">
    <div style="color: var(--vscode-errorForeground);"><strong>Error:</strong><pre>${escapeHtml(message)}</pre></div>
</body></html>`;
    }

    private getPreviewHtml(
        sourceFormat: string,
        conversions: Array<{ format: string; result: string; error?: string }>,
        fileName: string,
        webview: vscode.Webview
    ): string {
        const nonce = getNonce();
        const tabButtons = conversions.map((c, i) => {
            const active = i === 0 ? 'active' : '';
            return `<button class="tab-btn ${active}" data-tab="fmt-${c.format}">${c.format}</button>`;
        }).join('\n');

        const tabPanes = conversions.map((c, i) => {
            const active = i === 0 ? 'active' : '';
            const content = c.error
                ? `<div class="err-block">${escapeHtml(c.error)}</div>`
                : `<pre><code>${escapeHtml(c.result)}</code></pre>`;
            return `<div class="tab-pane ${active}" id="fmt-${c.format}">${content}</div>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
${this.cspMeta(webview, nonce)}
<style>
body { font-family: -apple-system, sans-serif; margin: 0; padding: 0; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
.header { padding: 8px 16px; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; gap: 12px; }
.header h2 { margin: 0; font-size: 14px; }
.badge { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.fname { font-size: 11px; color: var(--vscode-descriptionForeground); margin-left: auto; }
.tabs { display: flex; gap: 2px; padding: 8px 16px 0; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-panel-border); }
.tab-btn { background: none; border: none; padding: 4px 12px; cursor: pointer; font-size: 12px; color: var(--vscode-textLink-foreground); border-bottom: 2px solid transparent; }
.tab-btn.active { border-bottom-color: var(--vscode-focusBorder); font-weight: 600; }
.tab-pane { display: none; padding: 8px 16px; }
.tab-pane.active { display: block; }
pre { background: var(--vscode-textCodeBlock-background); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.5; max-height: 65vh; }
code { font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace; }
.err-block { color: var(--vscode-errorForeground); padding: 8px; background: var(--vscode-inputValidation-errorBackground); border-radius: 4px; }
</style>
</head>
<body>
<div class="header">
    <h2>SchemaForge</h2>
    <span class="badge">${escapeHtml(sourceFormat)}</span>
    <span class="fname">${escapeHtml(fileName)}</span>
</div>
<div class="tabs">${tabButtons}</div>
<div class="content">${tabPanes}</div>
<script nonce="${nonce}">
(function() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });
})();
</script>
</body>
</html>`;
    }
}

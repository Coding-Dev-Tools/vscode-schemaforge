import * as vscode from 'vscode';
import { execSchemaForge } from '../cli';

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

        webviewPanel.webview.html = this.getLoadingHtml();

        const render = async () => {
            const content = document.getText();
            if (!content.trim()) {
                webviewPanel.webview.html = this.getEmptyHtml();
                return;
            }

            try {
                // Write content to a temp file for CLI processing
                const tmpFile = await this.writeTempFile(content);

                const detectResult = await execSchemaForge(['detect', tmpFile]);
                const sourceFormat = detectResult.trim();

                const allFormats = ['sql', 'prisma', 'drizzle', 'typeorm', 'django', 'sqlalchemy', 'alembic', 'json_schema', 'graphql', 'ef', 'scala'];
                const targetFormats = allFormats.filter(f => f !== sourceFormat).slice(0, 6);

                const conversions: Array<{ format: string; result: string; error?: string }> = [];
                for (const fmt of targetFormats) {
                    try {
                        const result = await execSchemaForge(['convert', tmpFile, '--from', sourceFormat, '--to', fmt]);
                        conversions.push({ format: fmt, result: result || '(empty)' });
                    } catch (e: any) {
                        conversions.push({ format: fmt, result: '', error: e.message });
                    }
                }

                webviewPanel.webview.html = this.getPreviewHtml(sourceFormat, conversions, document.fileName);
            } catch (e: any) {
                webviewPanel.webview.html = this.getErrorHtml(e.message);
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

    private async writeTempFile(content: string): Promise<string> {
        const fs = require('fs');
        const path = require('path');
        const tmpDir = path.join(__dirname, '..', '..', '.temp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        const tmpFile = path.join(tmpDir, `schemaforge_preview_${Date.now()}.tmp`);
        fs.writeFileSync(tmpFile, content, 'utf-8');
        return tmpFile;
    }

    private getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html><body style="padding: 32px; text-align: center;"><p>Loading SchemaForge preview...</p></body></html>`;
    }

    private getEmptyHtml(): string {
        return `<!DOCTYPE html>
<html><body style="padding: 32px; text-align: center; color: var(--vscode-descriptionForeground);">
    <p>Empty schema file. Add content to see format conversions.</p>
</body></html>`;
    }

    private getErrorHtml(message: string): string {
        const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<!DOCTYPE html>
<html><body style="padding: 16px;">
    <div style="color: var(--vscode-errorForeground);"><strong>Error:</strong><pre>${escaped}</pre></div>
</body></html>`;
    }

    private getPreviewHtml(
        sourceFormat: string,
        conversions: Array<{ format: string; result: string; error?: string }>,
        fileName: string
    ): string {
        const tabButtons = conversions.map((c, i) => {
            const active = i === 0 ? 'active' : '';
            return `<button class="tab-btn ${active}" data-tab="fmt-${c.format}">${c.format}</button>`;
        }).join('\n');

        const tabPanes = conversions.map((c, i) => {
            const active = i === 0 ? 'active' : '';
            const content = c.error
                ? `<div class="err-block">${c.error.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
                : `<pre><code>${c.result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
            return `<div class="tab-pane ${active}" id="fmt-${c.format}">${content}</div>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
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
    <span class="badge">${sourceFormat}</span>
    <span class="fname">${fileName.replace(/&/g, '&amp;')}</span>
</div>
<div class="tabs">${tabButtons}</div>
<div class="content">${tabPanes}</div>
<script>
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

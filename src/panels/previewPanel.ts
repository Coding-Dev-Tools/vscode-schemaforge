import * as vscode from 'vscode';
import { execSchemaForge } from '../cli';

/**
 * WebView panel for live schema preview.
 * Shows conversions of the active schema file to all other formats.
 */
export class SchemaPreviewPanel {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private currentFile: string = '';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'schemaforgePreview',
            'SchemaForge Live Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Initialize with current editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.currentFile = editor.document.fileName;
        }

        this.render();

        // Listen for configuration changes
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('schemaforge')) {
                    this.render();
                }
            })
        );
    }

    refresh(filePath?: string) {
        if (!this.panel) return;

        if (filePath) {
            this.currentFile = filePath;
        }

        this.render();
    }

    private async render() {
        if (!this.panel || !this.currentFile) {
            return;
        }

        this.panel.title = `SchemaForge: ${this.currentFile.split(/[/\\]/).pop()}`;
        this.panel.webview.html = '<html><body><p>Loading...</p></body></html>';

        try {
            // Detect format
            const detectResult = await execSchemaForge(['detect', this.currentFile]);
            const sourceFormat = detectResult.trim();

            // Get all formats
            const allFormats = ['sql', 'prisma', 'drizzle', 'typeorm', 'django', 'sqlalchemy', 'alembic', 'json_schema', 'graphql', 'ef', 'scala'];
            const targetFormats = allFormats.filter(f => f !== sourceFormat);

            // Convert to all other formats (limit to 5 most relevant to keep it fast)
            const previewFormats = targetFormats.slice(0, 5);
            const conversions: Array<{ format: string; result: string; error?: string }> = [];

            for (const fmt of previewFormats) {
                try {
                    const result = await execSchemaForge(['convert', this.currentFile, '--from', sourceFormat, '--to', fmt]);
                    conversions.push({ format: fmt, result: result || '(empty result)' });
                } catch (e: any) {
                    conversions.push({ format: fmt, result: '', error: e.message });
                }
            }

            // Also run detect --verbose for details
            let detectDetails = '';
            try {
                detectDetails = await execSchemaForge(['detect', '--verbose', this.currentFile]);
            } catch { /* detect --verbose is best-effort */ }

            this.panel.webview.html = this.getPreviewHtml(
                this.currentFile,
                sourceFormat,
                conversions,
                detectDetails
            );

        } catch (e: any) {
            this.panel.webview.html = this.getErrorHtml(e.message);
        }
    }

    private getPreviewHtml(
        filePath: string,
        sourceFormat: string,
        conversions: Array<{ format: string; result: string; error?: string }>,
        detectDetails: string
    ): string {
        const fileName = filePath.split(/[/\\]/).pop();

        const conversionTabs = conversions.map((c, i) => {
            const active = i === 0 ? 'active' : '';
            const content = c.error
                ? `<div class="error">${this.escapeHtml(c.error)}</div>`
                : `<pre><code>${this.escapeHtml(c.result)}</code></pre>`;
            return `
                <div class="tab-pane ${active}" id="tab-${c.format}">
                    <div class="format-badge">${c.format}</div>
                    ${content}
                </div>
            `;
        }).join('\n');

        const tabButtons = conversions.map((c, i) => {
            const active = i === 0 ? 'active' : '';
            return `<button class="tab-button ${active}" data-tab="tab-${c.format}">${c.format}</button>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 0; margin: 0; color: var(--vscode-editor-foreground); background: var(--vscode-editor-background); }
        .header { padding: 8px 16px; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-panel-border); display: flex; align-items: center; gap: 12px; }
        .header h3 { margin: 0; font-size: 13px; font-weight: 600; }
        .source-badge { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        .tabs { display: flex; gap: 2px; padding: 8px 16px 0; background: var(--vscode-sideBar-background); border-bottom: 1px solid var(--vscode-panel-border); }
        .tab-button { background: none; border: none; padding: 4px 12px; cursor: pointer; font-size: 12px; color: var(--vscode-textLink-foreground); border-bottom: 2px solid transparent; }
        .tab-button.active { border-bottom-color: var(--vscode-textLink-activeForeground); font-weight: 600; }
        .tab-button:hover { opacity: 0.8; }
        .tab-content { padding: 8px 16px; }
        .tab-pane { display: none; }
        .tab-pane.active { display: block; }
        .format-badge { display: inline-block; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 1px 8px; border-radius: 3px; font-size: 10px; margin-bottom: 8px; }
        pre { background: var(--vscode-textCodeBlock-background); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.5; max-height: 60vh; }
        code { font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace; }
        .error { color: var(--vscode-errorForeground); padding: 8px; background: var(--vscode-inputValidation-errorBackground); border-radius: 4px; }
        .file-path { font-size: 11px; color: var(--vscode-descriptionForeground); margin-left: auto; }
        .details { padding: 8px 16px; font-size: 11px; color: var(--vscode-descriptionForeground); border-top: 1px solid var(--vscode-panel-border); }
    </style>
</head>
<body>
    <div class="header">
        <h3>Schema Preview</h3>
        <span class="source-badge">${this.escapeHtml(sourceFormat)}</span>
        <span class="file-path">${this.escapeHtml(fileName || '')}</span>
    </div>
    <div class="tabs">${tabButtons}</div>
    <div class="tab-content">${conversionTabs}</div>
    <div class="details">${this.escapeHtml(detectDetails.split('\\n').slice(0, 3).join('\\n'))}</div>
    <script>
        (function() {
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById(btn.dataset.tab).classList.add('active');
                });
            });
        })();
    </script>
</body>
</html>`;
    }

    private getEmptyHtml(): string {
        return `<!DOCTYPE html>
<html><body style="padding: 32px; text-align: center; color: var(--vscode-descriptionForeground);">
    <p>Open a schema file to see live conversion previews</p>
</body></html>`;
    }

    private getErrorHtml(message: string): string {
        return `<!DOCTYPE html>
<html><body style="padding: 16px;">
    <div class="error" style="color: var(--vscode-errorForeground);">
        <p><strong>Error:</strong></p>
        <pre>${this.escapeHtml(message)}</pre>
    </div>
</body></html>`;
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    dispose() {
        this.panel?.dispose();
    }
}

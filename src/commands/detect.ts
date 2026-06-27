import * as vscode from 'vscode';
import { execSchemaForge } from '../cli';
import { getOutputChannel } from '../output';

export class DetectCommand {
    static async run(uri?: vscode.Uri) {
        if (!uri) {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }
            uri = editor.document.uri;
        }

        const sourcePath = uri.fsPath;
        const result = await execSchemaForge(['detect', sourcePath]);
        const detectedFormat = result.trim();

        // Show in status bar
        vscode.window.setStatusBarMessage(`$(symbol-structure) SchemaForge: ${detectedFormat}`, 5000);

        // Show detailed info in a message
        const detailedInfo = await execSchemaForge(['detect', '--verbose', sourcePath]);
        const output = getOutputChannel('SchemaForge: Format Detection');
        output.clear();
        output.appendLine(`File: ${sourcePath}`);
        output.appendLine(`Detected Format: ${detectedFormat}`);
        output.appendLine('-'.repeat(40));
        output.append(detailedInfo);
        output.show();
    }
}

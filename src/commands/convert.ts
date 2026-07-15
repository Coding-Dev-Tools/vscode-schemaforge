import * as vscode from 'vscode';
import { execSchemaForge } from '../cli';
import { getOutputChannel } from '../output';
import { SCHEMA_FORMATS, normalizeFormat } from '../formats';

export class ConvertCommand {
    static async run(uri?: vscode.Uri) {
        // If invoked from context menu, use the clicked file
        if (!uri) {
            if (vscode.window.activeTextEditor) {
                uri = vscode.window.activeTextEditor.document.uri;
            } else {
                const files = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectMany: false,
                    filters: { 'Schema files': ['sql', 'prisma', 'graphql', 'cs', 'scala', 'json', 'yaml', 'yml'] }
                });
                if (!files || files.length === 0) return;
                uri = files[0];
            }
        }

        const sourcePath = uri.fsPath;

        // Detect format first
        const detectResult = await execSchemaForge(['detect', sourcePath]);
        const detectedFormat = normalizeFormat(detectResult) ?? '';

        // Let user pick target format
        const formats = SCHEMA_FORMATS;
        const target = await vscode.window.showQuickPick(
            formats.filter(f => f !== detectedFormat),
            { placeHolder: `Source: ${detectedFormat}. Pick target format:`, canPickMany: false }
        );
        if (!target) return;

        // Run conversion
        const result = await execSchemaForge(['convert', sourcePath, '--from', detectedFormat, '--to', target]);

        // Show result in output channel
        const output = getOutputChannel(`SchemaForge: ${detectedFormat} → ${target}`);
        output.clear();
        output.appendLine(`Converted: ${sourcePath}`);
        output.appendLine(`Format: ${detectedFormat} → ${target}`);
        output.appendLine('-'.repeat(40));
        output.append(result);
        output.show();

        return result;
    }

    static async quickConvert() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const sourcePath = editor.document.uri.fsPath;
        const defaultTarget = vscode.workspace.getConfiguration('schemaforge').get('defaultTargetFormat', 'sql');

        const detectResult = await execSchemaForge(['detect', sourcePath]);
        const detectedFormat = detectResult.trim();

        const result = await execSchemaForge(['convert', sourcePath, '--from', detectedFormat, '--to', defaultTarget as string]);

        const output = getOutputChannel(`SchemaForge: ${detectedFormat} → ${defaultTarget}`);
        output.clear();
        output.appendLine(`Converted: ${sourcePath}`);
        output.appendLine(`Format: ${detectedFormat} → ${defaultTarget}`);
        output.appendLine('-'.repeat(40));
        output.append(result);
        output.show();
    }
}

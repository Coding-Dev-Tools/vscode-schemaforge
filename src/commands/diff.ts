import * as vscode from 'vscode';
import { execSchemaForge } from '../cli';

export class DiffCommand {
    static async run() {
        const files = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: true,
            canSelectFolders: false,
            openLabel: 'Select two schema files to diff',
            filters: { 'Schema files': ['sql', 'prisma', 'graphql', 'cs', 'scala', 'json', 'yaml', 'yml'] }
        });

        if (!files || files.length < 2) {
            vscode.window.showWarningMessage('Please select exactly two files to diff');
            return;
        }

        const [fileA, fileB] = [files[0].fsPath, files[1].fsPath];

        // Detect formats
        const detectA = (await execSchemaForge(['detect', fileA])).trim();
        const detectB = (await execSchemaForge(['detect', fileB])).trim();

        // Convert both to canonical format (SQL) for comparison
        const canonicalA = await execSchemaForge(['convert', fileA, '--from', detectA, '--to', 'sql']);
        const canonicalB = await execSchemaForge(['convert', fileB, '--from', detectB, '--to', 'sql']);

        // Show diff in VS Code diff editor
        const uriA = vscode.Uri.parse(`untitled:SchemaDiff_A (${detectA})`);
        const uriB = vscode.Uri.parse(`untitled:SchemaDiff_B (${detectB})`);

        const docA = await vscode.workspace.openTextDocument(uriA);

        const editA = new vscode.WorkspaceEdit();
        editA.insert(uriA, new vscode.Position(0, 0), canonicalA);
        await vscode.workspace.applyEdit(editA);

        const editB = new vscode.WorkspaceEdit();
        editB.insert(uriB, new vscode.Position(0, 0), canonicalB);
        await vscode.workspace.applyEdit(editB);

        await vscode.window.showTextDocument(docA, { preview: false });
        await vscode.commands.executeCommand('vscode.diff', uriA, uriB, `Schema Diff: ${detectA} vs ${detectB}`);

        // Also show the raw schemaforge diff output
        const forgeDiff = await execSchemaForge(['diff', fileA, fileB]);
        if (forgeDiff) {
            const output = vscode.window.createOutputChannel('SchemaForge: Diff Result');
            output.clear();
            output.appendLine(`Schema Diff: ${fileA}`);
            output.appendLine(`          vs: ${fileB}`);
            output.appendLine('-'.repeat(40));
            output.append(forgeDiff);
            output.show();
        }
    }
}

import * as vscode from 'vscode';
import { ConvertCommand } from './commands/convert';
import { DiffCommand } from './commands/diff';
import { DetectCommand } from './commands/detect';
import { SchemaPreviewPanel } from './panels/previewPanel';
import { SchemaPreviewProvider } from './providers/schemaEditorProvider';
import { runCommand } from './runCommand';
import { disposeOutputChannels } from './output';

let previewPanel: SchemaPreviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('SchemaForge extension activating...');

    // --- Commands ---
    const convertCmd = vscode.commands.registerCommand('schemaforge.convert',
        runCommand((uri?: vscode.Uri) => ConvertCommand.run(uri))
    );

    const quickConvertCmd = vscode.commands.registerCommand('schemaforge.quickConvert',
        runCommand(() => ConvertCommand.quickConvert())
    );

    const diffCmd = vscode.commands.registerCommand('schemaforge.diff',
        runCommand(() => DiffCommand.run())
    );

    const detectCmd = vscode.commands.registerCommand('schemaforge.detect',
        runCommand((uri?: vscode.Uri) => DetectCommand.run(uri))
    );

    // --- Live Preview Panel (WebView) ---
    previewPanel = new SchemaPreviewPanel(context);
    const previewCmd = vscode.commands.registerCommand('schemaforge.showPreview',
        runCommand(() => previewPanel?.show())
    );

    // --- Register on-save listener for live preview ---
    const saveListener = vscode.workspace.onDidSaveTextDocument((doc) => {
        if (previewPanel && isSchemaFile(doc.fileName)) {
            previewPanel.refresh(doc.fileName);
        }
    });

    // --- Auto-refresh on active editor change ---
    const editorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (previewPanel && editor && isSchemaFile(editor.document.fileName)) {
            previewPanel.refresh(editor.document.fileName);
        }
    });

    // --- Register custom editor provider ---
    const provider = new SchemaPreviewProvider(context.extensionUri);
    const providerReg = vscode.window.registerCustomEditorProvider(
        'schemaforge.previewEditor',
        provider
    );

    context.subscriptions.push(
        convertCmd,
        quickConvertCmd,
        diffCmd,
        detectCmd,
        previewCmd,
        saveListener,
        editorChangeListener,
        providerReg
    );

    console.log('SchemaForge extension activated.');
}

export function deactivate() {
    previewPanel?.dispose();
    disposeOutputChannels();
}

function isSchemaFile(filePath: string): boolean {
    const ext = filePath.toLowerCase();
    return /\.(sql|prisma|graphql|cs|scala|schemaforge)$/.test(ext);
}

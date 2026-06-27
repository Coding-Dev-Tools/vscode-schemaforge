import * as vscode from 'vscode';

/**
 * Wrap a command handler so any error it throws is surfaced to the user as an
 * error notification instead of becoming a silent unhandled promise rejection.
 *
 * The CLI layer already crafts helpful messages (e.g. the "install schemaforge"
 * hint on ENOENT); without this wrapper those messages were thrown and never
 * shown, so a failed conversion appeared to do nothing. Arguments are forwarded
 * verbatim so context-menu invocations still receive their resource `Uri`.
 */
export function runCommand<A extends unknown[]>(
    action: (...args: A) => unknown | Promise<unknown>,
): (...args: A) => Promise<void> {
    return async (...args: A) => {
        try {
            await action(...args);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error('SchemaForge command failed:', err);
            vscode.window.showErrorMessage(`SchemaForge: ${message}`);
        }
    };
}

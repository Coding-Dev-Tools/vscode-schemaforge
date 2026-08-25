import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { SCHEMA_FORMATS } from './formats';

/**
 * Get the schemaforge CLI path from settings or default to 'schemaforge'.
 */
function getCliPath(): string {
    return vscode.workspace.getConfiguration('schemaforge').get('cliPath', 'schemaforge');
}

/**
 * Whether we need shell:true for this CLI path.
 *
 * On Windows, ``execFile`` with ``shell: false`` can only run .exe/.com files.
 * A pip-installed entry point is a .exe, but users may configure
 * ``schemaforge.cliPath`` to point at a .cmd or .bat wrapper (e.g. from a dev
 * install or an alternative package manager). In that case we must switch to
 * ``shell: true`` so that Node.js invokes ``cmd.exe /c`` under the hood.
 */
function needsShell(cli: string): boolean {
    return process.platform === 'win32' && /\.(?:cmd|bat)$/i.test(cli);
}

/**
 * Characters that cmd.exe treats as command separators / substitutions.
 *
 * When ``execFile`` runs with ``shell: true``, Node joins the CLI path and all
 * arguments into one string handed to ``cmd.exe /c`` WITHOUT quoting them.
 * Any of these characters arriving inside a file path or argument would then
 * be interpreted by cmd.exe as control syntax — e.g. a schema file named
 * ``foo&calc.bat`` or a workspace path containing ``%VAR%`` would execute an
 * attacker-chosen command instead of being passed to the CLI verbatim.
 */
const CMD_METACHARS = /[&|<>()^%!";\r\n]/;

/**
 * Quote a single argument for safe passage through ``cmd.exe /c``.
 *
 * Exported for unit testing. Doubles embedded quotes is intentionally NOT
 * supported: because CMD_METACHARS rejects arguments containing quotes, this
 * function only ever has to wrap plain, metacharacter-free text in double
 * quotes so that spaces in paths survive the shell join.
 */
export function quoteShellArg(arg: string): string {
    if (arg.length > 0 && CMD_METACHARS.test(arg)) {
        throw new Error(
            `SchemaForge: refusing to pass argument containing shell metacharacters ` +
            `while running the CLI via a Windows .cmd/.bat wrapper: ${JSON.stringify(arg.slice(0, 120))}`
        );
    }
    return `"${arg}"`;
}

/**
 * Execute schemaforge CLI and return stdout.
 * Throws with stderr details on failure.
 *
 * Uses execFile with an argument array and no shell by default, so file paths
 * and the user/workspace-settable ``schemaforge.cliPath`` cannot inject shell
 * commands (&, |, ;, `, $(), quotes, etc. are passed through as literal argv
 * entries).  The only exception is when ``cliPath`` points at a .cmd or .bat
 * file on Windows — see ``needsShell`` — where every argument is quoted and
 * metacharacter-bearing arguments are rejected outright, because Node does no
 * quoting of its own when it flattens argv into a ``cmd.exe /c`` line.
 */
export async function execSchemaForge(args: string[]): Promise<string> {
    const cli = getCliPath();
    const useShell = needsShell(cli);
    const finalArgs = useShell ? args.map(quoteShellArg) : args;

    console.log(`SchemaForge exec: ${cli} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
        execFile(cli, finalArgs, {
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024, // 10MB
            shell: useShell,
        }, (error, stdout, stderr) => {
            if (error) {
                // Try to provide helpful error
                let msg = `SchemaForge CLI error: ${error.message}`;
                if (stderr) msg += `\nstderr: ${stderr}`;

                // If the CLI wasn't found, suggest installing
                const code = (error as unknown as { code?: string | number }).code;
                if (code === 'ENOENT') {
                    msg = `SchemaForge CLI not found. Make sure 'schemaforge' is installed:\n` +
                          `  pip install schemaforge\n` +
                          `Or set the path in settings: schemaforge.cliPath`;
                }

                reject(new Error(msg));
                return;
            }

            if (stderr) {
                console.warn(`SchemaForge stderr: ${stderr}`);
            }

            resolve(stdout || '');
        });
    });
}

/**
 * Get available formats from the CLI.
 */
export async function getAvailableFormats(): Promise<string[]> {
    try {
        const result = await execSchemaForge(['formats', '--json']);
        return JSON.parse(result);
    } catch {
        // Fallback
        return SCHEMA_FORMATS;
    }
}

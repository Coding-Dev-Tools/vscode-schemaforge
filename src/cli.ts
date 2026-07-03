import * as vscode from 'vscode';
import { execFile, execFileSync } from 'child_process';

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
 * Execute schemaforge CLI and return stdout.
 * Throws with stderr details on failure.
 *
 * Uses execFile with an argument array and no shell by default, so file paths
 * and the user/workspace-settable ``schemaforge.cliPath`` cannot inject shell
 * commands (&, |, ;, `, $(), quotes, etc. are passed through as literal argv
 * entries).  The only exception is when ``cliPath`` points at a .cmd or .bat
 * file on Windows — see ``needsShell``.
 */
export async function execSchemaForge(args: string[]): Promise<string> {
    const cli = getCliPath();

    console.log(`SchemaForge exec: ${cli} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
        execFile(cli, args, {
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024, // 10MB
            shell: needsShell(cli),
        }, (error, stdout, stderr) => {
            if (error) {
                // Try to provide helpful error
                let msg = `SchemaForge CLI error: ${error.message}`;
                if (stderr) msg += `\nstderr: ${stderr}`;

                // If the CLI wasn't found, suggest installing
                if ((error as any).code === 'ENOENT') {
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
 * Synchronous version for simple quick checks.
 *
 * Same execution semantics as execSchemaForge — argument-array by default,
 * with the same .cmd-on-Windows exception (see ``needsShell``).
 */
export function execSchemaForgeSync(args: string[]): string {
    const cli = getCliPath();

    try {
        return execFileSync(cli, args, {
            timeout: 10000,
            maxBuffer: 10 * 1024 * 1024,
            encoding: 'utf-8',
            shell: needsShell(cli),
        });
    } catch (e: any) {
        console.error(`SchemaForge sync exec failed: ${e.message}`);
        return '';
    }
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
        return ['sql', 'prisma', 'drizzle', 'typeorm', 'django', 'sqlalchemy', 'alembic', 'json_schema', 'graphql', 'ef', 'scala'];
    }
}

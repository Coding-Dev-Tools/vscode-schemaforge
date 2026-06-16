import * as vscode from 'vscode';
import { execFileSync, execFile } from 'child_process';

/**
 * Get the schemaforge CLI path from settings or default to 'schemaforge'.
 */
function getCliPath(): string {
    return vscode.workspace.getConfiguration('schemaforge').get('cliPath', 'schemaforge');
}

/**
 * Execute schemaforge CLI and return stdout.
 * Throws with stderr details on failure.
 */
export async function execSchemaForge(args: string[]): Promise<string> {
    const cli = getCliPath();

    console.log(`SchemaForge exec: ${cli} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
        execFile(cli, args, {
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024, // 10MB
            shell: false, // never invoke a shell — args are passed verbatim
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
 */
export function execSchemaForgeSync(args: string[]): string {
    const cli = getCliPath();

    try {
        const out = execFileSync(cli, args, {
            timeout: 10000,
            maxBuffer: 10 * 1024 * 1024,
            encoding: 'utf-8',
            shell: false,
        });
        return out;
    } catch (e: any) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') {
            console.error(`SchemaForge CLI not found at "${cli}". Set schemaforge.cliPath or install the CLI.`);
        } else {
            console.error(`SchemaForge sync exec failed: ${e.message}`);
        }
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

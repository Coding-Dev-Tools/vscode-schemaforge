import * as vscode from 'vscode';
import { execSync, exec } from 'child_process';

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
    const cmd = `"${cli}" ${args.map(a => `"${a}"`).join(' ')}`;

    console.log(`SchemaForge exec: ${cmd}`);

    return new Promise((resolve, reject) => {
        exec(cmd, {
            timeout: 30000,
            maxBuffer: 10 * 1024 * 1024, // 10MB
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
    const cmd = `"${cli}" ${args.map(a => `"${a}"`).join(' ')}`;

    try {
        return execSync(cmd, {
            timeout: 10000,
            maxBuffer: 10 * 1024 * 1024,
            encoding: 'utf-8',
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

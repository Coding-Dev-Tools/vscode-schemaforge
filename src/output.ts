import * as vscode from 'vscode';

/**
 * Cache of output channels keyed by name.
 *
 * `vscode.window.createOutputChannel` returns a brand-new channel object on
 * every call, so invoking it on each command run (as the commands previously
 * did) leaked a channel per invocation — they pile up in the Output dropdown
 * and are never disposed. Reusing one channel per name fixes the leak while
 * preserving the existing named-channel UX.
 */
const channels = new Map<string, vscode.OutputChannel>();

/** Return the shared OutputChannel for `name`, creating it once on first use. */
export function getOutputChannel(name: string): vscode.OutputChannel {
    let channel = channels.get(name);
    if (!channel) {
        channel = vscode.window.createOutputChannel(name);
        channels.set(name, channel);
    }
    return channel;
}

/** Dispose every cached channel. Call from the extension's `deactivate`. */
export function disposeOutputChannels(): void {
    for (const channel of channels.values()) {
        channel.dispose();
    }
    channels.clear();
}

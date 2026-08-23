import { randomBytes } from 'crypto';

/**
 * Shared webview helpers for both preview surfaces (panels/previewPanel.ts and
 * providers/schemaEditorProvider.ts).
 *
 * Nonce generation and HTML escaping were previously duplicated per file and
 * had already drifted once (the CSP hardening had to be applied twice); one
 * module keeps them consistent everywhere.
 */

/**
 * Cryptographically random nonce for the webview Content-Security-Policy.
 *
 * The previous implementation drew characters from Math.random(), which is
 * predictable — a predictable nonce lets injected script guess the token and
 * bypass the CSP `script-src 'nonce-...'` allowlist. randomBytes removes the
 * predictability.
 */
export function getNonce(): string {
    return randomBytes(16).toString('hex');
}

/** Escape text for safe interpolation into webview HTML. */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

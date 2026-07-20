/**
 * Canonical list of schema formats SchemaForge converts between.
 *
 * Previously this list was inlined in three places (convert.ts,
 * previewPanel.ts, and cli.ts's getAvailableFormats fallback). Keeping a
 * single source of truth prevents the list from silently drifting between
 * call sites — a recurring failure class in this extension (see PR #9, where
 * the quickConvert default fallback had already diverged from package.json).
 */
export const SCHEMA_FORMATS: string[] = [
    'sql',
    'prisma',
    'drizzle',
    'typeorm',
    'django',
    'sqlalchemy',
    'alembic',
    'json_schema',
    'graphql',
    'ef',
    'scala',
];

const FORMAT_SET = new Set(SCHEMA_FORMATS);

/**
 * Normalize a format identifier produced by the schemaforge CLI (e.g. from
 * `detect`) into the canonical token the `convert --from/--to` flags expect.
 *
 * The CLI sometimes emits mixed-case or padded labels (e.g. "SQL", " Prisma ").
 * Passing those verbatim to `convert` fails with an opaque CLI error while the
 * command appears to "do nothing" — the classic silent-failure trap. Here we
 * trim + lowercase and, when the value matches a known format, return its
 * canonical spelling so the conversion actually runs. Unknown values are passed
 * through unchanged so the CLI still produces a clear, actionable error.
 */
export function normalizeFormat(fmt: string | undefined | null): string | undefined {
    if (fmt === undefined || fmt === null) {
        return undefined;
    }
    const trimmed = fmt.trim();
    if (trimmed.length === 0) {
        return undefined;
    }
    const lower = trimmed.toLowerCase();
    if (FORMAT_SET.has(lower)) {
        return lower;
    }
    return trimmed;
}

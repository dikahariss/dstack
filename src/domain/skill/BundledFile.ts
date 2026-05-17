/**
 * A file shipped inside a skill folder, alongside `SKILL.md`.
 *
 * Bundled files include:
 *   - `scripts/*` — executable code (`.py`, `.sh`, `.js`, ...).
 *   - `references/*` — documentation the agent reads on demand.
 *   - `assets/*` — templates, fonts, data files.
 *   - Any free-form subdirectory (`themes/`, `examples/`, etc.).
 *   - `LICENSE.txt` at skill root.
 *
 * The installer copies these verbatim into the host's output root. They are
 * NOT counted against the body token budget (ADR-0016).
 *
 * `content` is a Buffer to support binary assets (fonts, PDFs, images).
 * `relativePath` is rooted at the skill folder, uses forward slashes, and
 * never contains `..` or absolute paths (the repository's path policy
 * rejects those before construction).
 */
export interface BundledFile {
  readonly relativePath: string;
  readonly content: Buffer;
  readonly executable: boolean;
}

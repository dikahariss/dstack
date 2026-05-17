/**
 * RenderResult is the immutable output of a renderer.
 *
 * `path` is relative to the host's output root. The Installer joins them
 * to compute absolute paths. This keeps RenderResult free of any
 * filesystem-rooted knowledge.
 */
export interface RenderResult {
  readonly path: string;
  readonly content: string;
  readonly tokenCount: number;
  readonly warnings: readonly Warning[];
}

export interface Warning {
  readonly kind: WarningKind;
  readonly message: string;
}

export type WarningKind =
  | 'long-description'
  | 'overlapping-trigger'
  | 'include-cycle-broken'
  | 'token-near-budget'
  | 'comprehensive-skill'
  | 'type-structure-mismatch';

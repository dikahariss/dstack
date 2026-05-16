/**
 * Telemetry is the port through which domain and application code emit
 * structured events. The default implementation discards them; opt-in
 * implementations persist locally. See ADR-0006.
 *
 * The event union is closed by design — adding a new event type requires
 * a code change, which surfaces in code review. This is more friction than
 * a free-form `emit(kind, payload)` API, and that friction is the point.
 */

export type TelemetryEvent =
  | SkillRenderedEvent
  | CatalogBuiltEvent
  | SkillsInstalledEvent
  | BuildFailedEvent;

export interface SkillRenderedEvent {
  readonly kind: 'skill_rendered';
  readonly skillId: string;
  readonly host: string;
  readonly tokenCount: number;
  readonly tokenBudget: number;
}

export interface CatalogBuiltEvent {
  readonly kind: 'catalog_built';
  readonly host: string;
  readonly skillCount: number;
}

export interface SkillsInstalledEvent {
  readonly kind: 'skills_installed';
  readonly outputRoot: string;
  readonly written: number;
  readonly skipped: number;
  readonly removed: number;
}

export interface BuildFailedEvent {
  readonly kind: 'build_failed';
  readonly errorName: string;
  readonly skillId?: string;
}

export interface Telemetry {
  emit(event: TelemetryEvent): void;
}

import { Telemetry, TelemetryEvent } from './Telemetry';

/**
 * Default Telemetry binding. Discards every event.
 *
 * This is the wire-time default — see ADR-0006. Users opt in to a
 * persistent sink via `DSTACK_TELEMETRY=local`.
 */
export class NoopTelemetry implements Telemetry {
  emit(_event: TelemetryEvent): void {
    // intentionally empty
  }
}

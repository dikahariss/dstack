import { Telemetry, TelemetryEvent } from './Telemetry';

/**
 * Telemetry sink that writes a single line per event to stderr.
 *
 * Opt-in via `DSTACK_LOG=debug`. The format is
 * `[<ISO timestamp>] <kind> <JSON details>`. Lives in stderr to keep
 * stdout free for the command's actual output (e.g. `dstack render`).
 */
export class ConsoleTelemetry implements Telemetry {
  emit(event: TelemetryEvent): void {
    const ts = new Date().toISOString();
    const { kind, ...details } = event;
    process.stderr.write(`[${ts}] ${kind} ${JSON.stringify(details)}\n`);
  }
}

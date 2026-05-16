import { appendFileSync, mkdirSync, statSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { Telemetry, TelemetryEvent } from './Telemetry';

/**
 * Append-only JSONL telemetry sink. Local file only — never network.
 * See ADR-0006.
 *
 * Rotation: at 10MB, the file is renamed to `<name>.1` and a new file
 * starts. One generation is kept; older generations are not preserved.
 * This is sufficient for "what happened recently" debugging without
 * unbounded disk use.
 */
const ROTATE_BYTES = 10 * 1024 * 1024;

export class FileTelemetry implements Telemetry {
  constructor(private readonly path: string) {
    mkdirSync(dirname(this.path), { recursive: true });
  }

  emit(event: TelemetryEvent): void {
    this.rotateIfNeeded();
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...event,
    });
    appendFileSync(this.path, line + '\n');
  }

  private rotateIfNeeded(): void {
    try {
      const stat = statSync(this.path);
      if (stat.size >= ROTATE_BYTES) {
        renameSync(this.path, this.path + '.1');
      }
    } catch {
      // file does not exist yet; first emit will create it
    }
  }
}

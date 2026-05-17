import { Installer, InstallReport, RenderedSkill } from '@domain/host/ports';
import { Telemetry } from '@obs/Telemetry';

/**
 * Write rendered output to disk via an Installer.
 *
 * This use case is intentionally thin — it exists so the CLI does not call
 * the Installer port directly. Future installers (e.g., one that mints a
 * manifest for an MCP server) plug in here without changes elsewhere.
 */
export class InstallSkills {
  constructor(
    private readonly installer: Installer,
    private readonly telemetry: Telemetry,
  ) {}

  async execute(input: {
    outputRoot: string;
    results: readonly RenderedSkill[];
  }): Promise<InstallReport> {
    const report = await this.installer.install(input.outputRoot, input.results);

    this.telemetry.emit({
      kind: 'skills_installed',
      outputRoot: input.outputRoot,
      written: report.written,
      skipped: report.skipped,
      removed: report.removed,
    });

    return report;
  }
}

#!/usr/bin/env bun
/**
 * dstack CLI entrypoint.
 *
 * This file is the wiring seam: concrete adapters get constructed here,
 * passed into use cases as ports. Adding a new adapter (host, telemetry
 * sink, etc.) means changing this file and nothing else.
 *
 * Commands:
 *   dstack build                  — render all skills, install to default root
 *   dstack render <skill-id>      — render one skill, write to stdout
 *   dstack install [--local|--global]  — install previously rendered output
 *
 * See src/adapters/cli/README.md.
 */

import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { BuildCatalog } from '../../application/BuildCatalog';
import { BuildSkill } from '../../application/BuildSkill';
import { InstallSkills } from '../../application/InstallSkills';
import { Host } from '../../domain/host/Host';
import { SkillId } from '../../domain/skill/SkillId';
import { FileSkillRepository } from '../fs/FileSkillRepository';
import { FsInstaller } from '../fs/FsInstaller';
import { ClaudeCodeRenderer } from '../claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '../claude-code/tools';
import { Telemetry } from '../../observability/Telemetry';
import { NoopTelemetry } from '../../observability/NoopTelemetry';
import { FileTelemetry } from '../../observability/FileTelemetry';

const PROJECT_ROOT = resolve(import.meta.dir, '../../..');
const SKILLS_ROOT = join(PROJECT_ROOT, 'skills');

function telemetryFromEnv(): Telemetry {
  if (process.env['DSTACK_TELEMETRY'] === 'local') {
    return new FileTelemetry(join(homedir(), '.dstack/telemetry/events.jsonl'));
  }
  return new NoopTelemetry();
}

function defaultOutputRoot(scope: 'local' | 'global'): string {
  return scope === 'local'
    ? resolve(process.cwd(), '.claude/skills')
    : join(homedir(), '.claude/skills/dstack');
}

function claudeHost(outputRoot: string): Host {
  return new Host('claude-code', outputRoot, { knownTools: CLAUDE_CODE_TOOLS });
}

async function main(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv;
  const telemetry = telemetryFromEnv();
  const skills = new FileSkillRepository(SKILLS_ROOT);
  const renderer = new ClaudeCodeRenderer();
  const installer = new FsInstaller();

  switch (command) {
    case 'build': {
      const scope: 'local' | 'global' = rest.includes('--global') ? 'global' : 'local';
      const outputRoot = defaultOutputRoot(scope);
      const host = claudeHost(outputRoot);
      const results = await new BuildCatalog(skills, renderer, telemetry).execute({
        host,
        now: new Date(),
      });
      const report = await new InstallSkills(installer, telemetry).execute({
        outputRoot,
        results,
      });
      console.log(
        `built ${results.length} skills, wrote ${report.written}, skipped ${report.skipped}, removed ${report.removed}`,
      );
      console.log(`output: ${report.outputRoot}`);
      return 0;
    }

    case 'render': {
      const idRaw = rest[0];
      if (!idRaw) {
        console.error('usage: dstack render <skill-id>');
        return 2;
      }
      const outputRoot = defaultOutputRoot('local');
      const host = claudeHost(outputRoot);
      const result = await new BuildSkill(skills, renderer, telemetry).execute({
        skillId: SkillId.parse(idRaw),
        host,
        now: new Date(),
      });
      process.stdout.write(result.content);
      return 0;
    }

    case 'install': {
      console.error('install requires running `dstack build` first. (planned, not yet implemented)');
      return 2;
    }

    case undefined:
    case '--help':
    case '-h': {
      console.log('dstack — skill catalog for Claude Code');
      console.log('');
      console.log('Usage:');
      console.log('  dstack build [--global]   render all skills and install');
      console.log('  dstack render <skill-id>  render one skill to stdout');
      console.log('');
      console.log('Env:');
      console.log('  DSTACK_TELEMETRY=local    enable local JSONL telemetry');
      return 0;
    }

    default:
      console.error(`unknown command: ${command}`);
      return 2;
  }
}

if (import.meta.main) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(`dstack: ${err.name}: ${err.message}`);
      process.exit(1);
    });
}

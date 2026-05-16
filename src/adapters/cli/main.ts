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
import { scaffoldSkill, ScaffoldError } from './scaffold';
import { formatWarnings, countWarnings } from './warning-formatter';

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
      const warningCount = countWarnings(results);
      const summary = `built ${results.length} skills, wrote ${report.written}, skipped ${report.skipped}, removed ${report.removed}`;
      console.log(warningCount > 0 ? `${summary} (${warningCount} warnings)` : summary);
      console.log(`output: ${report.outputRoot}`);
      const warningOutput = formatWarnings(results);
      if (warningOutput) {
        console.log('');
        console.log(warningOutput);
      }
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

    case 'new': {
      const idRaw = rest[0];
      if (!idRaw) {
        console.error('usage: dstack new <skill-id>');
        console.error('  skill-id: lowercase letters, digits, hyphens; must start with a letter');
        return 2;
      }
      try {
        const result = scaffoldSkill(SKILLS_ROOT, idRaw);
        console.log(`created skill: ${result.skillId}`);
        for (const file of result.filesWritten) {
          console.log(`  ${file}`);
        }
        console.log('');
        console.log('next steps:');
        console.log(`  1. edit ${result.skillDir}/skill.yaml — set description, tools, triggers`);
        console.log(`  2. edit ${result.skillDir}/prompt.md — write the instruction body`);
        console.log(`  3. run \`bun run build\` to render and install`);
        return 0;
      } catch (err) {
        if (err instanceof ScaffoldError) {
          console.error(`dstack new: ${err.message}`);
          return 1;
        }
        throw err;
      }
    }

    case undefined:
    case '--help':
    case '-h': {
      console.log('dstack — skill catalog for Claude Code');
      console.log('');
      console.log('Usage:');
      console.log('  dstack build [--global]   render all skills and install');
      console.log('  dstack render <skill-id>  render one skill to stdout');
      console.log('  dstack new <skill-id>     scaffold a new skill from template');
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

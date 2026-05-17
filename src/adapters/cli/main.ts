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
import { BuildCatalog } from '@app/BuildCatalog';
import { BuildSkill } from '@app/BuildSkill';
import { InstallSkills } from '@app/InstallSkills';
import { ListCatalog } from '@app/ListCatalog';
import { ValidateCatalog } from '@app/ValidateCatalog';
import { Host } from '@domain/host/Host';
import { SkillId } from '@domain/skill/SkillId';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { FsInstaller } from '@adapters/fs/FsInstaller';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';
import { Telemetry } from '@obs/Telemetry';
import { NoopTelemetry } from '@obs/NoopTelemetry';
import { FileTelemetry } from '@obs/FileTelemetry';
import { ConsoleTelemetry } from '@obs/ConsoleTelemetry';
import { scaffoldSkill, ScaffoldError } from './scaffold';
import { formatWarnings, countWarnings } from './warning-formatter';
import { formatValidationResults } from './validate-formatter';
import { formatRowsTable, formatRowsJson } from './list-formatter';
import { diagnose, formatDoctorReport } from './doctor';
import { migrateLegacySkills, formatMigrationReport } from './migrate';
import { isSkillType, SkillType } from '@domain/skill/SkillType';

const PROJECT_ROOT = resolve(import.meta.dir, '../../..');
const SKILLS_ROOT = join(PROJECT_ROOT, 'skills');

function telemetryFromEnv(): Telemetry {
  if (process.env['DSTACK_LOG'] === 'debug') {
    return new ConsoleTelemetry();
  }
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
      const strict = rest.includes('--strict');
      const outputRoot = defaultOutputRoot(scope);
      const host = claudeHost(outputRoot);
      const items = await new BuildCatalog(skills, renderer, telemetry).execute({
        host,
        now: new Date(),
      });
      const report = await new InstallSkills(installer, telemetry).execute({
        outputRoot,
        results: items,
      });
      const renderResults = items.map((i) => i.rendered);
      const warningCount = countWarnings(renderResults);
      const summary = `built ${items.length} skills, wrote ${report.written}, skipped ${report.skipped}, removed ${report.removed}`;
      console.log(warningCount > 0 ? `${summary} (${warningCount} warnings)` : summary);
      console.log(`output: ${report.outputRoot}`);
      const warningOutput = formatWarnings(renderResults);
      if (warningOutput) {
        console.log('');
        console.log(warningOutput);
      }
      return strict && warningCount > 0 ? 1 : 0;
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
      process.stdout.write(result.rendered.content);
      return 0;
    }

    case 'install': {
      console.error('install requires running `dstack build` first. (planned, not yet implemented)');
      return 2;
    }

    case 'list': {
      const asJson = rest.includes('--json');
      const outputRoot = defaultOutputRoot('local');
      const host = claudeHost(outputRoot);
      const skillIds = skills.listIds();
      const rows = await new ListCatalog(skills, renderer, telemetry).execute({
        skillIds,
        host,
        now: new Date(),
      });
      if (asJson) {
        console.log(formatRowsJson(rows));
      } else {
        for (const line of formatRowsTable(rows)) console.log(line);
      }
      return 0;
    }

    case 'validate': {
      const outputRoot = defaultOutputRoot('local');
      const host = claudeHost(outputRoot);
      const skillIds = skills.listIds();
      const results = await new ValidateCatalog(skills, renderer, telemetry).execute({
        skillIds,
        host,
        now: new Date(),
      });
      const { lines, exitCode } = formatValidationResults(results);
      for (const line of lines) console.log(line);
      return exitCode;
    }

    case 'doctor': {
      const outputRoot = defaultOutputRoot('local');
      const host = claudeHost(outputRoot);
      const report = await diagnose({
        repo: skills,
        renderer,
        telemetry,
        host,
        installRoot: outputRoot,
      });
      for (const line of formatDoctorReport(report)) console.log(line);
      return report.exitCode;
    }

    case 'new': {
      const idRaw = rest.find((arg) => !arg.startsWith('--'));
      if (!idRaw) {
        console.error('usage: dstack new <skill-id> [--type=<deterministic|semantic|hybrid|schema-semantic>]');
        console.error('  skill-id: lowercase letters, digits, hyphens; must start with a letter');
        return 2;
      }
      const typeArg = rest.find((arg) => arg.startsWith('--type='));
      let type: SkillType = 'semantic';
      if (typeArg) {
        const value = typeArg.slice('--type='.length);
        if (!isSkillType(value)) {
          console.error(`dstack new: unknown type "${value}". Expected one of: deterministic, semantic, hybrid, schema-semantic.`);
          return 2;
        }
        type = value;
      }
      try {
        const result = scaffoldSkill(SKILLS_ROOT, idRaw, type);
        console.log(`created skill: ${result.skillId} (type=${type})`);
        for (const file of result.filesWritten) {
          console.log(`  ${file}`);
        }
        console.log('');
        console.log('next steps:');
        console.log(`  1. edit ${result.skillDir}/SKILL.md — set description, tools, triggers, body`);
        if (type === 'hybrid' || type === 'deterministic') {
          console.log(`  2. add helpers under ${result.skillDir}/scripts/`);
          console.log(`  3. run \`bun run build\` to render and install`);
        } else {
          console.log(`  2. run \`bun run build\` to render and install`);
        }
        return 0;
      } catch (err) {
        if (err instanceof ScaffoldError) {
          console.error(`dstack new: ${err.message}`);
          return 1;
        }
        throw err;
      }
    }

    case 'migrate-v2': {
      const report = migrateLegacySkills(SKILLS_ROOT);
      for (const line of formatMigrationReport(report)) console.log(line);
      const anyFailed = report.outcomes.some((o) => o.status === 'failed');
      return anyFailed ? 1 : 0;
    }

    case undefined:
    case '--help':
    case '-h': {
      console.log('dstack — skill catalog for Claude Code');
      console.log('');
      console.log('Usage:');
      console.log('  dstack build [--global] [--strict]  render all skills and install');
      console.log('                            --strict exits 1 if any warning was emitted');
      console.log('  dstack render <skill-id>  render one skill to stdout');
      console.log('  dstack new <skill-id> [--type=<t>]  scaffold a new SKILL.md');
      console.log('  dstack list [--json]      list every skill with version, type, tokens');
      console.log('  dstack validate           check every skill; exit 1 if any fails');
      console.log('  dstack doctor             diagnose source/install consistency');
      console.log('  dstack migrate-v2         convert legacy skill.yaml + prompt.md to SKILL.md');
      console.log('');
      console.log('Env:');
      console.log('  DSTACK_LOG=debug          print structured events to stderr');
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

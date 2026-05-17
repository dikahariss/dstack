/**
 * Integration test for the build-and-install pipeline.
 *
 * Wires the real adapters (`FileSkillRepository`, `ClaudeCodeRenderer`,
 * `FsInstaller`, `NoopTelemetry`) and runs the same use cases the CLI
 * runs. A regression in any of the adapters or use cases shows up here.
 *
 * Skills are written to a fresh mkdtemp directory; output goes to an
 * mkdtemp directory under `~/.dstack/skills/` (an allowed output root —
 * see `src/adapters/fs/paths.ts`).
 *
 * Benchmark case asserts that 100 skills render in under 1 second.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { Host } from '@domain/host/Host';
import { BuildCatalog } from '@app/BuildCatalog';
import { InstallSkills } from '@app/InstallSkills';
import { FileSkillRepository } from '@adapters/fs/FileSkillRepository';
import { FsInstaller } from '@adapters/fs/FsInstaller';
import { ClaudeCodeRenderer } from '@adapters/claude-code/ClaudeCodeRenderer';
import { CLAUDE_CODE_TOOLS } from '@adapters/claude-code/tools';
import { NoopTelemetry } from '@obs/NoopTelemetry';

const ALLOWED_OUTPUT_PARENT = join(homedir(), '.dstack/skills');

function writeFixtureSkill(skillsRoot: string, id: string, body: string): void {
  const dir = join(skillsRoot, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    `---\nname: ${id}\ndescription: test skill ${id}\nallowed-tools: Read\nmetadata:\n  dstack:\n    version: 0.1.0\n    context_budget_tokens: 4000\n---\n${body}\n`,
  );
}

describe('integration: build and install', () => {
  let skillsRoot: string;
  let outputRoot: string;

  beforeEach(() => {
    skillsRoot = mkdtempSync(join(tmpdir(), 'dstack-skills-'));
    mkdirSync(ALLOWED_OUTPUT_PARENT, { recursive: true });
    outputRoot = mkdtempSync(join(ALLOWED_OUTPUT_PARENT, '__integration-'));
  });

  afterEach(() => {
    rmSync(skillsRoot, { recursive: true, force: true });
    rmSync(outputRoot, { recursive: true, force: true });
  });

  test('renders and installs two skills end-to-end', async () => {
    writeFixtureSkill(skillsRoot, 'alpha', 'alpha prompt body');
    writeFixtureSkill(skillsRoot, 'beta', 'beta prompt body');

    const repo = new FileSkillRepository(skillsRoot);
    const renderer = new ClaudeCodeRenderer();
    const installer = new FsInstaller();
    const telemetry = new NoopTelemetry();
    const host = new Host('claude-code', outputRoot, { knownTools: CLAUDE_CODE_TOOLS });

    const results = await new BuildCatalog(repo, renderer, telemetry).execute({
      host,
      now: new Date(0),
    });
    const report = await new InstallSkills(installer, telemetry).execute({ outputRoot, results });

    expect(results.length).toBe(2);
    expect(report.written).toBe(2);
    expect(existsSync(join(outputRoot, 'alpha/SKILL.md'))).toBe(true);
    expect(existsSync(join(outputRoot, 'beta/SKILL.md'))).toBe(true);
    expect(readFileSync(join(outputRoot, 'alpha/SKILL.md'), 'utf-8')).toContain('name: alpha');
    expect(readFileSync(join(outputRoot, 'beta/SKILL.md'), 'utf-8')).toContain('beta prompt body');
  });

  test('renders and installs 100 minimal skills under 1 second', async () => {
    for (let i = 0; i < 100; i++) {
      writeFixtureSkill(skillsRoot, `skill-${i.toString().padStart(3, '0')}`, `body ${i}`);
    }

    const repo = new FileSkillRepository(skillsRoot);
    const renderer = new ClaudeCodeRenderer();
    const installer = new FsInstaller();
    const telemetry = new NoopTelemetry();
    const host = new Host('claude-code', outputRoot, { knownTools: CLAUDE_CODE_TOOLS });

    const start = performance.now();
    const results = await new BuildCatalog(repo, renderer, telemetry).execute({
      host,
      now: new Date(0),
    });
    await new InstallSkills(installer, telemetry).execute({ outputRoot, results });
    const elapsed = performance.now() - start;

    expect(results.length).toBe(100);
    expect(elapsed).toBeLessThan(1000);
  });
});

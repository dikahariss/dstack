# Fixture: a skill directory with no SKILL.md

Deliberately contains no `SKILL.md`. `FileSkillRepository.loadOne` must throw
`SkillSpecError` when it meets this directory, which is what the
`loadAll throws SkillSpecError when prompt.md missing` contract test asserts.

**This file exists so git tracks the directory.** Git cannot track an empty
directory. Before this file was added, the v1→v2 migration (`6c7ebba`,
2026-05-17) removed the directory's only content, so `orphan/` survived only as
an untracked leftover on machines that predated the migration. On those the
suite read 102/102; on CI and every fresh clone it read 101/1, because
`loadAll` returned `[]` from a root that did not exist rather than throwing.

Do not delete this file, and do not add a `SKILL.md` here.

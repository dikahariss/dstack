import { describe, test, expect } from 'bun:test';
import { formatDoctorReport, type DoctorReport } from '@adapters/cli/doctor';

describe('formatDoctorReport', () => {
  test('returns sentinel line when no rows', () => {
    const report: DoctorReport = { rows: [], exitCode: 0 };
    expect(formatDoctorReport(report)).toEqual(['(no skills found in source or install root)']);
  });

  test('formats OK row without issues', () => {
    const report: DoctorReport = {
      rows: [{ id: 'alpha', status: 'OK', issues: [] }],
      exitCode: 0,
    };
    const lines = formatDoctorReport(report);
    expect(lines[0]).toBe('alpha: OK');
    expect(lines[lines.length - 1]).toBe('1 entries checked: 1 OK, 0 ERR');
  });

  test('formats ERR row with all issues joined', () => {
    const report: DoctorReport = {
      rows: [
        { id: 'broken', status: 'ERR', issues: ['version drift: source 0.2, installed 0.1', 'second issue'] },
      ],
      exitCode: 1,
    };
    const lines = formatDoctorReport(report);
    expect(lines[0]).toContain('broken: ERR');
    expect(lines[0]).toContain('version drift');
    expect(lines[0]).toContain('second issue');
    expect(lines[lines.length - 1]).toBe('1 entries checked: 0 OK, 1 ERR');
  });

  test('mixed rows are counted correctly in the summary', () => {
    const report: DoctorReport = {
      rows: [
        { id: 'a', status: 'OK', issues: [] },
        { id: 'b', status: 'ERR', issues: ['orphan'] },
        { id: 'c', status: 'OK', issues: [] },
      ],
      exitCode: 1,
    };
    const lines = formatDoctorReport(report);
    expect(lines[lines.length - 1]).toBe('3 entries checked: 2 OK, 1 ERR');
  });
});

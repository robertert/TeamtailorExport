import { describe, it, expect } from 'vitest';
import { getCsvHeaderRow, candidatesToCsvRows } from '../csvWriter';
import { Candidate } from '../../schemas/candidate.schema';

describe('getCsvHeaderRow', () => {
  it('returns a header row with 6 columns', () => {
    const header = getCsvHeaderRow();
    const columns = header.trimEnd().split(',');
    expect(columns).toHaveLength(6);
    expect(columns).toEqual([
      'candidate_id',
      'first_name',
      'last_name',
      'email',
      'job_application_id',
      'job_application_created_at',
    ]);
  });

  it('ends with a newline', () => {
    expect(getCsvHeaderRow()).toMatch(/\n$/);
  });
});

describe('candidatesToCsvRows', () => {
  it('formats a normal candidate correctly', () => {
    const candidates: Candidate[] = [
      {
        candidate_id: '1',
        first_name: 'Jan',
        last_name: 'Kowalski',
        email: 'jan@example.com',
        job_application_id: 'app-1',
        job_application_created_at: '2024-01-15',
      },
    ];
    const result = candidatesToCsvRows(candidates);
    expect(result).toBe('1,Jan,Kowalski,jan@example.com,app-1,2024-01-15\n');
  });

  it('escapes a field containing a comma', () => {
    const candidates: Candidate[] = [
      {
        candidate_id: '1',
        first_name: 'Jan,Jr',
        last_name: 'Kowalski',
        email: 'jan@example.com',
        job_application_id: null,
        job_application_created_at: null,
      },
    ];
    const result = candidatesToCsvRows(candidates);
    expect(result).toContain('"Jan,Jr"');
  });

  it('escapes a field containing a double quote', () => {
    const candidates: Candidate[] = [
      {
        candidate_id: '1',
        first_name: 'Jan "Johnny"',
        last_name: 'Kowalski',
        email: 'jan@example.com',
        job_application_id: null,
        job_application_created_at: null,
      },
    ];
    const result = candidatesToCsvRows(candidates);
    expect(result).toContain('"Jan ""Johnny"""');
  });

  it('escapes a field containing a newline', () => {
    const candidates: Candidate[] = [
      {
        candidate_id: '1',
        first_name: 'Jan\nKowalski',
        last_name: 'Kowalski',
        email: 'jan@example.com',
        job_application_id: null,
        job_application_created_at: null,
      },
    ];
    const result = candidatesToCsvRows(candidates);
    expect(result).toContain('"Jan\nKowalski"');
  });

  it('outputs empty string for null/undefined fields', () => {
    const candidates: Candidate[] = [
      {
        candidate_id: '1',
        first_name: null,
        last_name: undefined,
        email: null,
        job_application_id: null,
        job_application_created_at: null,
      },
    ];
    const result = candidatesToCsvRows(candidates);
    expect(result).toBe('1,,,,,\n');
  });

  it('returns just a newline for an empty array', () => {
    const result = candidatesToCsvRows([]);
    expect(result).toBe('\n');
  });
});

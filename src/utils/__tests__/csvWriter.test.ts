import { describe, it, expect } from 'vitest';
import { createCsvStringifier } from '../csvWriter';

function collect(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
    stream.on('error', reject);
  });
}

describe('createCsvStringifier', () => {
  it('returns a Transform stream', () => {
    const csv = createCsvStringifier();
    expect(csv.writable).toBe(true);
    expect(csv.readable).toBe(true);
    csv.destroy();
  });

  it('produces correct CSV with header for a single record', async () => {
    const csv = createCsvStringifier();
    const output = collect(csv);

    csv.write({
      candidate_id: '1',
      first_name: 'Jan',
      last_name: 'Kowalski',
      email: 'jan@example.com',
      job_application_id: 'app-1',
      job_application_created_at: '2024-01-15',
    });
    csv.end();

    const result = await output;
    const lines = result.trimEnd().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('candidate_id,first_name,last_name,email,job_application_id,job_application_created_at');
    expect(lines[1]).toBe('1,Jan,Kowalski,jan@example.com,app-1,2024-01-15');
  });

  it('handles null and undefined fields as empty strings', async () => {
    const csv = createCsvStringifier();
    const output = collect(csv);

    csv.write({
      candidate_id: '1',
      first_name: null,
      last_name: undefined,
      email: null,
      job_application_id: null,
      job_application_created_at: null,
    });
    csv.end();

    const result = await output;
    const lines = result.trimEnd().split('\n');
    expect(lines[1]).toBe('1,,,,,');
  });

  it('escapes fields containing commas', async () => {
    const csv = createCsvStringifier();
    const output = collect(csv);

    csv.write({
      candidate_id: '1',
      first_name: 'Jan,Jr',
      last_name: 'Kowalski',
      email: 'jan@example.com',
      job_application_id: null,
      job_application_created_at: null,
    });
    csv.end();

    const result = await output;
    expect(result).toContain('"Jan,Jr"');
  });

  it('escapes fields containing double quotes', async () => {
    const csv = createCsvStringifier();
    const output = collect(csv);

    csv.write({
      candidate_id: '1',
      first_name: 'Jan "Johnny"',
      last_name: 'Kowalski',
      email: 'jan@example.com',
      job_application_id: null,
      job_application_created_at: null,
    });
    csv.end();

    const result = await output;
    expect(result).toContain('"Jan ""Johnny"""');
  });

  it('escapes fields containing newlines', async () => {
    const csv = createCsvStringifier();
    const output = collect(csv);

    csv.write({
      candidate_id: '1',
      first_name: 'Jan\nKowalski',
      last_name: 'Kowalski',
      email: 'jan@example.com',
      job_application_id: null,
      job_application_created_at: null,
    });
    csv.end();

    const result = await output;
    expect(result).toContain('"Jan\nKowalski"');
  });

  it('produces multiple rows for multiple records', async () => {
    const csv = createCsvStringifier();
    const output = collect(csv);

    csv.write({
      candidate_id: '1',
      first_name: 'Jan',
      last_name: 'Kowalski',
      email: 'jan@example.com',
      job_application_id: 'app-1',
      job_application_created_at: '2024-01-15',
    });
    csv.write({
      candidate_id: '2',
      first_name: 'Anna',
      last_name: 'Nowak',
      email: 'anna@example.com',
      job_application_id: 'app-2',
      job_application_created_at: '2024-02-20',
    });
    csv.end();

    const result = await output;
    const lines = result.trimEnd().split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('candidate_id,first_name,last_name,email,job_application_id,job_application_created_at');
    expect(lines[1]).toBe('1,Jan,Kowalski,jan@example.com,app-1,2024-01-15');
    expect(lines[2]).toBe('2,Anna,Nowak,anna@example.com,app-2,2024-02-20');
  });

  it('produces only the header row when no records are written', async () => {
    const csv = createCsvStringifier();
    const output = collect(csv);

    csv.end();

    const result = await output;
    const lines = result.trimEnd().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('candidate_id,first_name,last_name,email,job_application_id,job_application_created_at');
  });
});

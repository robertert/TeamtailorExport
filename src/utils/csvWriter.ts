import { Candidate } from '../schemas/candidate.schema';

const CSV_HEADERS = [
  'candidate_id',
  'first_name',
  'last_name',
  'email',
  'job_application_id',
  'job_application_created_at',
] as const;

export function getCsvHeaderRow(): string {
  return CSV_HEADERS.join(',') + '\n';
}

export function candidatesToCsvRows(candidates: Candidate[]): string {
  return candidates
    .map(c => CSV_HEADERS.map(h => escapeCsvField(c[h])).join(','))
    .join('\n') + '\n';
}

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

import { stringify, Stringifier } from 'csv-stringify';

const CSV_COLUMNS = [
  'candidate_id',
  'first_name',
  'last_name',
  'email',
  'job_application_id',
  'job_application_created_at',
] as const;

export function createCsvStringifier(): Stringifier {
  return stringify({ header: true, columns: [...CSV_COLUMNS] });
}

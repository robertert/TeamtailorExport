import { z } from 'zod';

export const CandidateSchema = z.object({
  candidate_id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  job_application_id: z.string().nullable().optional(),
  job_application_created_at: z.string().nullable().optional(), 
});

export type Candidate = z.infer<typeof CandidateSchema>;
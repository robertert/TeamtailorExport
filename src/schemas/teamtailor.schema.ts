import { z } from 'zod';

export const RawJobApplicationSchema = z.object({
  id: z.string(),
  type: z.literal('job-applications'),
  attributes: z.object({
    'created-at': z.string().nullable().optional(),
  }),
});

export type RawJobApplication = z.infer<typeof RawJobApplicationSchema>;

export const RawJobApplicationArraySchema = z.array(RawJobApplicationSchema);
export type RawJobApplicationArray = z.infer<typeof RawJobApplicationArraySchema>;

export const RawCandidateSchema = z.object({
  id: z.string(),
  type: z.literal('candidates'),
  attributes: z.object({
    'first-name': z.string().nullable().optional(),
    'last-name': z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  }),
  relationships: z.object({
    'job-applications': z.object({
      data: z.array(
        z.object({
          id: z.string(),
          type: z.literal('job-applications'),
        })
      ).optional(),
    }).optional(),
  }).optional(),
});

export type RawCandidate = z.infer<typeof RawCandidateSchema>;

const KnownIncludedSchema = z.discriminatedUnion('type', [
  RawCandidateSchema,
  RawJobApplicationSchema,
]);

const UnknownIncludedSchema = z.object({ id: z.string(), type: z.string() }).loose();

const IncludedResourceSchema = z.union([KnownIncludedSchema, UnknownIncludedSchema]);

export const TeamtailorResponseSchema = z.object({
  data: z.array(RawCandidateSchema),
  included: z.array(IncludedResourceSchema).optional().default([]),
  links: z
    .object({
      next: z.string().nullable().optional(),
    })
    .optional(),
});

export type TeamtailorResponse = z.infer<typeof TeamtailorResponseSchema>;

export const DeserializedJobApplicationSchema = z.object({
  id: z.string(),
  created_at: z.string().nullable().default(null),
});

export const DeserializedCandidateSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable().default(null),
  last_name: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  job_applications: z.array(DeserializedJobApplicationSchema).default([]),
});

export const DeserializedCandidateArraySchema = z.array(DeserializedCandidateSchema);

export type DeserializedCandidate = z.infer<typeof DeserializedCandidateSchema>;
export type DeserializedJobApplication = z.infer<typeof DeserializedJobApplicationSchema>;

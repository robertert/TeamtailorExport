import { z } from 'zod';

export const RawJobApplicationSchema = z.object({
  id: z.string(),
  type: z.literal('job-applications'),
  attributes: z.object({
    'created-at': z.string().nullable().optional(),
  }),
});

export type RawJobApplication = z.infer<typeof RawJobApplicationSchema>;


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

export const TeamtailorResponseSchema = z.object({
  data: z.array(RawCandidateSchema),
  included: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      attributes: z.unknown(),
    }).loose()
  ).optional().default([]),
  links: z.object({
    next: z.string().nullable().optional(),
  }).optional(),
});

export type TeamtailorResponse = z.infer<typeof TeamtailorResponseSchema>;
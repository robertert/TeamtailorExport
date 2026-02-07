import { Deserializer } from 'jsonapi-serializer';
import { apiClient as axiosInstance } from '../utils/apiClient';
import { Candidate } from '../schemas/candidate.schema';
import AppError from '../utils/AppError';
import axios, { AxiosResponse } from 'axios';
import { logger } from '../lib/logger';
import {
  TeamtailorResponseSchema,
  DeserializedCandidateArraySchema,
} from '../schemas/teamtailor.schema';
import { ZodError } from 'zod';

const candidateDeserializer = new Deserializer({
  keyForAttribute: 'underscore_case',
  'job-applications': {
    valueForRelationship: (_relationship: unknown, included: unknown) => included,
  },
});

class TeamtailorService {
  constructor(private readonly apiClient: typeof axiosInstance = axiosInstance) {
  }

  async *getCandidatesPaginated(signal?: AbortSignal): AsyncGenerator<Candidate[]> {
    logger.info('starting candidate export');
    let url: string | null = '/candidates';
    let page = 0;

    while (url) {
      if (signal?.aborted) {
        return;
      }

      try {
        const response: AxiosResponse<unknown> = await this.apiClient.get(url, {
          params: url === '/candidates' ? { include: 'job-applications', 'page[size]': 30 } : undefined,
          signal,
        });

        const parsed = TeamtailorResponseSchema.parse(response.data);

        const rawDeserialized = await candidateDeserializer.deserialize(parsed);
        const deserialized = DeserializedCandidateArraySchema.parse(rawDeserialized);

        const candidates: Candidate[] = [];
        for (const item of deserialized) {
          const jobApps = item.job_applications ?? [];

          if (jobApps.length === 0) {
            candidates.push({
              candidate_id: item.id,
              first_name: item.first_name ?? null,
              last_name: item.last_name ?? null,
              email: item.email ?? null,
              job_application_id: null,
              job_application_created_at: null,
            });
          } else {
            for (const app of jobApps) {
              candidates.push({
                candidate_id: item.id,
                first_name: item.first_name ?? null,
                last_name: item.last_name ?? null,
                email: item.email ?? null,
                job_application_id: app.id,
                job_application_created_at: app.created_at ?? null,
              });
            }
          }
        }

        page++;
        logger.debug({ page, candidatesCount: candidates.length }, 'page fetched');

        yield candidates;

        url = parsed.links?.next ?? null;
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        if (axios.isAxiosError(error)) {
          const status = error.response?.status ?? 500;
          throw new AppError(`Teamtailor API error: ${error.message}`, status);
        }
        if (error instanceof ZodError) {
          throw new AppError('Validation Error', 400, error.issues);
        }
        throw new AppError('Failed to get candidates', 500);
      }
    }
  }
}

export default TeamtailorService;

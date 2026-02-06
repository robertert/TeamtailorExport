import { Deserializer } from 'jsonapi-serializer';
import { apiClient as axiosInstance } from '../utils/apiClient';
import { TeamtailorResponseSchema } from '../schemas/teamtailor.schema';
import { Candidate } from '../schemas/candidate.schema';
import AppError from '../utils/AppError';

const candidateDeserializer = new Deserializer({
  keyForAttribute: 'underscore_case',
  'job-applications': {
    valueForRelationship: (_relationship: unknown, included: unknown) => included,
  },
});

class TeamtailorService {
  constructor(private readonly apiClient: typeof axiosInstance = axiosInstance) {}

  async getCandidates(): Promise<Candidate[]> {
    try {
      const response = await this.apiClient.get('/candidates', {
        params: { include: 'job-applications' },
      });

      TeamtailorResponseSchema.parse(response.data);

      const deserialized = await candidateDeserializer.deserialize(response.data);

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

      return candidates;
    } catch (error) {
      throw new AppError('Failed to get candidates', 500);
    }
  }
}

export default TeamtailorService;
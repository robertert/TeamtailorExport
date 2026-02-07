import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/apiClient', () => ({ apiClient: {} }));
vi.mock('../../utils/fetchWithRetry', () => ({
  fetchWithRetry: vi.fn(),
}));

import TeamtailorService from '../teamtailor.service';
import axios, { AxiosError } from 'axios';
import { ZodError } from 'zod';
import { fetchWithRetry } from '../../utils/fetchWithRetry';

function makeJsonApiResponse(
  candidates: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    jobAppIds?: string[];
  }>,
  included: Array<{ id: string; createdAt?: string | null }> = [],
  nextLink?: string,
) {
  return {
    data: candidates.map(c => ({
      id: c.id,
      type: 'candidates',
      attributes: {
        'first-name': c.firstName ?? null,
        'last-name': c.lastName ?? null,
        email: c.email ?? null,
      },
      relationships: c.jobAppIds
        ? {
          'job-applications': {
            data: c.jobAppIds.map(id => ({ id, type: 'job-applications' as const })),
          },
        }
        : undefined,
    })),
    included: included.map(app => ({
      id: app.id,
      type: 'job-applications' as const,
      attributes: { 'created-at': app.createdAt ?? null },
    })),
    links: { next: nextLink ?? null },
  };
}

async function collectAll<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of gen) {
    results.push(item);
  }
  return results;
}

describe('TeamtailorService', () => {
  const mockApiClient = {};
  let service: TeamtailorService;
  let mockFetchWithRetry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetchWithRetry = vi.mocked(fetchWithRetry);
    mockFetchWithRetry.mockReset();
    service = new TeamtailorService(mockApiClient as never);
  });

  it('yields a single batch when there is no next link', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      data: makeJsonApiResponse(
        [{ id: '1', firstName: 'Jan', lastName: 'Kowalski', email: 'jan@example.com' }],
        [],
      ),
    });

    const batches = await collectAll(service.getCandidatesPaginated());

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(1);
    expect(batches[0][0].candidate_id).toBe('1');
    expect(batches[0][0].first_name).toBe('Jan');
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(1);
  });

  it('follows pagination across multiple pages', async () => {
    mockFetchWithRetry
      .mockResolvedValueOnce({
        data: makeJsonApiResponse(
          [{ id: '1', firstName: 'Jan' }],
          [],
          'https://api.teamtailor.com/v1/candidates?page=2',
        ),
      })
      .mockResolvedValueOnce({
        data: makeJsonApiResponse([{ id: '2', firstName: 'Anna' }], []),
      });

    const batches = await collectAll(service.getCandidatesPaginated());

    expect(batches).toHaveLength(2);
    expect(batches[0][0].candidate_id).toBe('1');
    expect(batches[1][0].candidate_id).toBe('2');
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(2);
  });

  it('produces one row with null app fields when candidate has no job applications', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      data: makeJsonApiResponse([{ id: '1', firstName: 'Jan' }], []),
    });

    const batches = await collectAll(service.getCandidatesPaginated());

    expect(batches[0]).toHaveLength(1);
    expect(batches[0][0].job_application_id).toBeNull();
    expect(batches[0][0].job_application_created_at).toBeNull();
  });

  it('produces multiple rows when candidate has multiple job applications', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      data: makeJsonApiResponse(
        [{ id: '1', firstName: 'Jan', jobAppIds: ['app-1', 'app-2'] }],
        [
          { id: 'app-1', createdAt: '2024-01-15' },
          { id: 'app-2', createdAt: '2024-02-20' },
        ],
      ),
    });

    const batches = await collectAll(service.getCandidatesPaginated());

    expect(batches[0]).toHaveLength(2);
    expect(batches[0][0].job_application_id).toBe('app-1');
    expect(batches[0][0].job_application_created_at).toBe('2024-01-15');
    expect(batches[0][1].job_application_id).toBe('app-2');
    expect(batches[0][1].job_application_created_at).toBe('2024-02-20');
  });

  it('calls fetchWithRetry with apiClient, url, params and signal', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      data: makeJsonApiResponse([{ id: '1', firstName: 'Jan' }], []),
    });

    await collectAll(service.getCandidatesPaginated());

    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      mockApiClient,
      '/candidates',
      { include: 'job-applications', 'page[size]': 30 },
      undefined,
    );
  });

  it('stops without yielding when AbortSignal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const batches = await collectAll(
      service.getCandidatesPaginated(controller.signal),
    );

    expect(batches).toHaveLength(0);
    expect(mockFetchWithRetry).not.toHaveBeenCalled();
  });

  it('throws AxiosError when fetchWithRetry throws AxiosError', async () => {
    const axiosErr = new AxiosError(
      'Too Many Requests',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      { status: 429, data: {}, statusText: 'Too Many Requests', headers: {}, config: {} } as never,
    );
    mockFetchWithRetry.mockRejectedValueOnce(axiosErr);

    try {
      await collectAll(service.getCandidatesPaginated());
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(axios.isAxiosError(err)).toBe(true);
      expect((err as AxiosError).response?.status).toBe(429);
    }
  });

  it('throws ZodError on malformed response (Zod validation failure)', async () => {
    mockFetchWithRetry.mockResolvedValueOnce({
      data: { invalid: 'not a valid response' },
    });

    try {
      await collectAll(service.getCandidatesPaginated());
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ZodError);
    }
  });
});

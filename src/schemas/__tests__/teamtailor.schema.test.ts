import { describe, it, expect } from 'vitest';
import {
  TeamtailorResponseSchema,
  DeserializedCandidateSchema,
} from '../teamtailor.schema';

describe('TeamtailorResponseSchema', () => {
  it('parses a valid JSON:API response', () => {
    const raw = {
      data: [
        {
          id: '1',
          type: 'candidates',
          attributes: {
            'first-name': 'Jan',
            'last-name': 'Kowalski',
            email: 'jan@example.com',
          },
        },
      ],
      included: [
        {
          id: 'app-1',
          type: 'job-applications',
          attributes: { 'created-at': '2024-01-15' },
        },
      ],
      links: { next: 'https://api.teamtailor.com/v1/candidates?page=2' },
    };

    const result = TeamtailorResponseSchema.parse(raw);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('1');
    expect(result.included).toHaveLength(1);
    expect(result.links?.next).toBe('https://api.teamtailor.com/v1/candidates?page=2');
  });

  it('rejects a response without data', () => {
    expect(() => TeamtailorResponseSchema.parse({ included: [] })).toThrow();
  });

  it('defaults included to an empty array when omitted', () => {
    const raw = {
      data: [
        {
          id: '1',
          type: 'candidates',
          attributes: {
            'first-name': 'Jan',
            'last-name': 'Kowalski',
            email: 'jan@example.com',
          },
        },
      ],
    };

    const result = TeamtailorResponseSchema.parse(raw);
    expect(result.included).toEqual([]);
  });
});

describe('DeserializedCandidateSchema', () => {
  it('defaults missing fields to null', () => {
    const result = DeserializedCandidateSchema.parse({ id: '1' });
    expect(result.first_name).toBeNull();
    expect(result.last_name).toBeNull();
    expect(result.email).toBeNull();
  });

  it('defaults job_applications to an empty array', () => {
    const result = DeserializedCandidateSchema.parse({ id: '1' });
    expect(result.job_applications).toEqual([]);
  });

  it('parses a full candidate with job applications', () => {
    const raw = {
      id: '42',
      first_name: 'Anna',
      last_name: 'Nowak',
      email: 'anna@example.com',
      job_applications: [
        { id: 'app-1', created_at: '2024-03-01' },
        { id: 'app-2', created_at: null },
      ],
    };

    const result = DeserializedCandidateSchema.parse(raw);
    expect(result.id).toBe('42');
    expect(result.job_applications).toHaveLength(2);
    expect(result.job_applications[1].created_at).toBeNull();
  });
});

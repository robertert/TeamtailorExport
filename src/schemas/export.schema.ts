import { z } from 'zod';

export const ExportRequestSchema = z.object({
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;

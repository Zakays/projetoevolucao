import { z } from 'zod';

export const UploadedFileSchema = z.object({
  id: z.string().optional(),
  filename: z.string(),
  originalName: z.string(),
  size: z.number().optional(),
  type: z.string().optional(),
  uploadDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  previewUrl: z.string().optional(),
});

export const RecordsDataSchema = z.object({
  uploadedFiles: z.array(UploadedFileSchema).optional(),
  galleries: z.array(z.any()).optional(),
  progressComparisons: z.array(z.any()).optional(),
  communityPosts: z.array(z.any()).optional(),
}).partial();

export const ExtendedAppDataSchema = z.object({
  habits: z.array(z.any()).optional(),
  habitCompletions: z.array(z.any()).optional(),
  monthlyCharts: z.array(z.any()).optional(),
  workouts: z.array(z.any()).optional(),
  bodyMeasurements: z.array(z.any()).optional(),
  journalEntries: z.array(z.any()).optional(),
  goals: z.array(z.any()).optional(),
  settings: z.any().optional(),
  lastUpdated: z.string().optional(),
  version: z.string().optional(),
  study: z.object({
    vocabulary: z.array(z.any()).optional(),
  }).optional(),
  finances: z.array(z.any()).optional(),
  records: RecordsDataSchema.optional(),
}).partial();

export type ExtendedAppDataParsed = z.infer<typeof ExtendedAppDataSchema>;
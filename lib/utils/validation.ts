import { z } from 'zod';

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export function validatePagination(params: URLSearchParams) {
  return paginationSchema.safeParse({
    page: params.get('page') || 1,
    limit: params.get('limit') || 20,
  });
}

// Settings validation schema - customize for your app
export const settingsSchema = z.object({
  // Add your app-specific settings validation here
  // Example:
  // featureEnabled: z.boolean().optional(),
  // customConfig: z.record(z.string(), z.unknown()).optional(),
});

export type SettingsSchemaType = z.infer<typeof settingsSchema>;

export function validateSettings(data: unknown) {
  return settingsSchema.safeParse(data);
}

// Color validation helper (useful for many apps)
export const colorRegex = /^#[0-9A-Fa-f]{6}$/;

export const colorSchema = z.string().regex(colorRegex, 'Invalid color format');

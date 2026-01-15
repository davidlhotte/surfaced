import { Plan } from '@prisma/client';

// Re-export Prisma enums for convenience
export { Plan };

// API Response types
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
};

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

// Pagination
export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Shopify session
export type ShopifySession = {
  shop: string;
  accessToken: string;
  state?: string;
};

// Settings types for Surfaced app
export type SettingsInput = {
  emailAlerts?: boolean;
  weeklyReport?: boolean;
  autoAuditEnabled?: boolean;
  auditFrequency?: 'daily' | 'weekly' | 'monthly';
};

import { Plan } from '@prisma/client';

/**
 * Plan prices in USD per month
 * Matches the PRODUCT_SPEC.md pricing:
 * - BASIC (Starter): $49/month
 * - PLUS (Growth): $99/month
 * - PREMIUM (Scale): $199/month
 */
export const PLAN_PRICES: Record<Exclude<Plan, 'FREE'>, number> = {
  [Plan.BASIC]: 49,
  [Plan.PLUS]: 99,
  [Plan.PREMIUM]: 199,
};

/**
 * Plan features and limits
 */
export const PLAN_LIMITS = {
  [Plan.FREE]: {
    productsAudited: 10,
    visibilityChecksPerMonth: 3,
    platformsTracked: 1,
    competitorsTracked: 0,
    historyDays: 7,
    exportCsv: false,
    apiAccess: false,
    prioritySupport: false,
  },
  [Plan.BASIC]: {
    productsAudited: 100,
    visibilityChecksPerMonth: 10,
    platformsTracked: 2,
    competitorsTracked: 1,
    historyDays: 30,
    exportCsv: false,
    apiAccess: false,
    prioritySupport: false,
  },
  [Plan.PLUS]: {
    productsAudited: 500,
    visibilityChecksPerMonth: 50,
    platformsTracked: 4,
    competitorsTracked: 3,
    historyDays: 90,
    exportCsv: true,
    apiAccess: false,
    prioritySupport: false,
  },
  [Plan.PREMIUM]: {
    productsAudited: Infinity,
    visibilityChecksPerMonth: 200,
    platformsTracked: 5,
    competitorsTracked: 10,
    historyDays: 365,
    exportCsv: true,
    apiAccess: true,
    prioritySupport: true,
  },
} as const;

/**
 * Plan display names for UI
 */
export const PLAN_NAMES: Record<Plan, string> = {
  [Plan.FREE]: 'Free Trial',
  [Plan.BASIC]: 'Starter',
  [Plan.PLUS]: 'Growth',
  [Plan.PREMIUM]: 'Scale',
};

/**
 * Trial duration in days
 */
export const TRIAL_DAYS = 14;

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
    aiOptimizationsPerMonth: 3,
    platformsTracked: 1,
    competitorsTracked: 0,
    historyDays: 7,
    exportCsv: false,
    apiAccess: false,
    prioritySupport: false,
    // Legacy features (from template)
    customMarkerColor: false,
    customMarkerIcon: false,
    hideBranding: false,
    designCustomization: false,
  },
  [Plan.BASIC]: {
    productsAudited: 100,
    visibilityChecksPerMonth: 10,
    aiOptimizationsPerMonth: 20,
    platformsTracked: 2,
    competitorsTracked: 1,
    historyDays: 30,
    exportCsv: false,
    apiAccess: false,
    prioritySupport: false,
    // Legacy features
    customMarkerColor: true,
    customMarkerIcon: false,
    hideBranding: false,
    designCustomization: true,
  },
  [Plan.PLUS]: {
    productsAudited: 500,
    visibilityChecksPerMonth: 50,
    aiOptimizationsPerMonth: 100,
    platformsTracked: 4,
    competitorsTracked: 3,
    historyDays: 90,
    exportCsv: true,
    apiAccess: false,
    prioritySupport: false,
    // Legacy features
    customMarkerColor: true,
    customMarkerIcon: true,
    hideBranding: false,
    designCustomization: true,
  },
  [Plan.PREMIUM]: {
    productsAudited: Infinity,
    visibilityChecksPerMonth: 200,
    aiOptimizationsPerMonth: 500,
    platformsTracked: 5,
    competitorsTracked: 10,
    historyDays: 365,
    exportCsv: true,
    apiAccess: true,
    prioritySupport: true,
    // Legacy features
    customMarkerColor: true,
    customMarkerIcon: true,
    hideBranding: true,
    designCustomization: true,
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

/**
 * Get features for a specific plan
 */
export function getPlanFeatures(plan: Plan) {
  return PLAN_LIMITS[plan];
}

/**
 * Feature keys type
 */
type PlanFeatureKey = keyof typeof PLAN_LIMITS['FREE'];

/**
 * Check if a plan has a specific feature
 */
export function hasFeature(plan: Plan, feature: PlanFeatureKey): boolean {
  const features = PLAN_LIMITS[plan];
  const value = features[feature];

  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value > 0;
  }
  return false;
}

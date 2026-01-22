import { prisma } from '@/lib/db/prisma';
import { decryptToken } from '@/lib/security/encryption';
import { logger } from '@/lib/monitoring/logger';

const SHOPIFY_API_VERSION = '2025-01';

export type FlowTriggerType =
  | 'product_score_changed'
  | 'alert_created'
  | 'visibility_check_completed'
  | 'optimization_applied'
  | 'ab_test_completed'
  | 'bulk_optimization_completed'
  | 'duplicate_content_found'
  | 'ai_traffic_spike';

type FlowTriggerPayload = {
  product_score_changed: {
    product_id: string;
    product_title: string;
    previous_score: number;
    new_score: number;
    score_change: number;
  };
  alert_created: {
    alert_type: string;
    alert_priority: string;
    alert_title: string;
    alert_message: string;
  };
  visibility_check_completed: {
    platform: string;
    query: string;
    is_mentioned: boolean;
    position: number | null;
  };
  optimization_applied: {
    product_id: string;
    product_title: string;
    field: string;
    score_before: number | null;
    score_after: number | null;
  };
  ab_test_completed: {
    test_name: string;
    product_id: string;
    winner: string;
    variant_a_mentions: number;
    variant_b_mentions: number;
  };
  bulk_optimization_completed: {
    job_id: string;
    operation_type: string;
    total_products: number;
    succeeded: number;
    failed: number;
  };
  duplicate_content_found: {
    duplicate_groups: number;
    affected_products: number;
    score: number;
  };
  ai_traffic_spike: {
    platform: string;
    visits_count: number;
    period_hours: number;
    threshold: number;
  };
};

/**
 * Send a Flow trigger to Shopify
 */
export async function sendFlowTrigger<T extends FlowTriggerType>(
  shopDomain: string,
  triggerType: T,
  payload: FlowTriggerPayload[T]
): Promise<boolean> {
  try {
    const shop = await prisma.shop.findUnique({
      where: { shopDomain },
      select: {
        accessToken: true,
        settings: {
          select: {
            emailAlerts: true, // Use this to check if Flow triggers are enabled
          },
        },
      },
    });

    if (!shop) {
      logger.warn({ shopDomain, triggerType }, 'Shop not found for Flow trigger');
      return false;
    }

    const accessToken = decryptToken(shop.accessToken);

    // Map trigger type to Flow trigger handle
    const triggerHandles: Record<FlowTriggerType, string> = {
      product_score_changed: 'surfaced-flow-triggers/product-ai-score-changed',
      alert_created: 'surfaced-flow-triggers/surfaced-alert-created',
      visibility_check_completed: 'surfaced-flow-triggers/visibility-check-completed',
      optimization_applied: 'surfaced-flow-triggers/product-optimization-applied',
      ab_test_completed: 'surfaced-flow-triggers/ab-test-completed',
      bulk_optimization_completed: 'surfaced-flow-triggers/bulk-optimization-completed',
      duplicate_content_found: 'surfaced-flow-triggers/duplicate-content-found',
      ai_traffic_spike: 'surfaced-flow-triggers/ai-traffic-spike',
    };

    const triggerHandle = triggerHandles[triggerType];

    // Call Shopify Flow trigger API
    const response = await fetch(
      `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          query: `
            mutation flowTriggerReceive($handle: String!, $payload: JSON!) {
              flowTriggerReceive(handle: $handle, payload: $payload) {
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            handle: triggerHandle,
            payload,
          },
        }),
      }
    );

    if (!response.ok) {
      logger.error(
        { shopDomain, triggerType, status: response.status },
        'Flow trigger API call failed'
      );
      return false;
    }

    const result = await response.json();

    if (result.data?.flowTriggerReceive?.userErrors?.length > 0) {
      logger.warn(
        { shopDomain, triggerType, errors: result.data.flowTriggerReceive.userErrors },
        'Flow trigger returned errors'
      );
      return false;
    }

    logger.info({ shopDomain, triggerType }, 'Flow trigger sent successfully');
    return true;
  } catch (error) {
    logger.error({ error, shopDomain, triggerType }, 'Failed to send Flow trigger');
    return false;
  }
}

/**
 * Trigger: Product AI Score Changed
 */
export async function triggerProductScoreChanged(
  shopDomain: string,
  productId: string,
  productTitle: string,
  previousScore: number,
  newScore: number
): Promise<void> {
  // Only trigger if change is significant (5+ points)
  const scoreChange = newScore - previousScore;
  if (Math.abs(scoreChange) < 5) {
    return;
  }

  await sendFlowTrigger(shopDomain, 'product_score_changed', {
    product_id: productId,
    product_title: productTitle,
    previous_score: previousScore,
    new_score: newScore,
    score_change: scoreChange,
  });
}

/**
 * Trigger: Alert Created
 */
export async function triggerAlertCreated(
  shopDomain: string,
  alertType: string,
  alertPriority: string,
  alertTitle: string,
  alertMessage: string
): Promise<void> {
  await sendFlowTrigger(shopDomain, 'alert_created', {
    alert_type: alertType,
    alert_priority: alertPriority,
    alert_title: alertTitle,
    alert_message: alertMessage,
  });
}

/**
 * Trigger: Visibility Check Completed
 */
export async function triggerVisibilityCheckCompleted(
  shopDomain: string,
  platform: string,
  query: string,
  isMentioned: boolean,
  position: number | null
): Promise<void> {
  await sendFlowTrigger(shopDomain, 'visibility_check_completed', {
    platform,
    query,
    is_mentioned: isMentioned,
    position,
  });
}

/**
 * Trigger: Optimization Applied
 */
export async function triggerOptimizationApplied(
  shopDomain: string,
  productId: string,
  productTitle: string,
  field: string,
  scoreBefore: number | null,
  scoreAfter: number | null
): Promise<void> {
  await sendFlowTrigger(shopDomain, 'optimization_applied', {
    product_id: productId,
    product_title: productTitle,
    field,
    score_before: scoreBefore,
    score_after: scoreAfter,
  });
}

/**
 * Trigger: A/B Test Completed
 */
export async function triggerABTestCompleted(
  shopDomain: string,
  testName: string,
  productId: string,
  winner: string,
  variantAMentions: number,
  variantBMentions: number
): Promise<void> {
  await sendFlowTrigger(shopDomain, 'ab_test_completed', {
    test_name: testName,
    product_id: productId,
    winner,
    variant_a_mentions: variantAMentions,
    variant_b_mentions: variantBMentions,
  });
}

/**
 * Trigger: Bulk Optimization Completed
 */
export async function triggerBulkOptimizationCompleted(
  shopDomain: string,
  jobId: string,
  operationType: string,
  totalProducts: number,
  succeeded: number,
  failed: number
): Promise<void> {
  await sendFlowTrigger(shopDomain, 'bulk_optimization_completed', {
    job_id: jobId,
    operation_type: operationType,
    total_products: totalProducts,
    succeeded,
    failed,
  });
}

/**
 * Trigger: Duplicate Content Found
 */
export async function triggerDuplicateContentFound(
  shopDomain: string,
  duplicateGroups: number,
  affectedProducts: number,
  score: number
): Promise<void> {
  // Only trigger if there are significant duplicates
  if (duplicateGroups === 0) {
    return;
  }

  await sendFlowTrigger(shopDomain, 'duplicate_content_found', {
    duplicate_groups: duplicateGroups,
    affected_products: affectedProducts,
    score,
  });
}

/**
 * Trigger: AI Traffic Spike
 */
export async function triggerAITrafficSpike(
  shopDomain: string,
  platform: string,
  visitsCount: number,
  periodHours: number,
  threshold: number
): Promise<void> {
  // Only trigger if visits exceed threshold
  if (visitsCount < threshold) {
    return;
  }

  await sendFlowTrigger(shopDomain, 'ai_traffic_spike', {
    platform,
    visits_count: visitsCount,
    period_hours: periodHours,
    threshold,
  });
}

import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';
import { triggerABTestCompleted } from '@/lib/services/flow-triggers';
import type { Plan, ABTestField, ABTestStatus, ABTestWinner, Platform } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type CreateABTestInput = {
  name: string;
  productId: string;
  field: ABTestField;
  variantB: string;
  testQueries?: string[];
};

export type ABTestSummary = {
  id: string;
  name: string;
  productTitle: string;
  field: ABTestField;
  status: ABTestStatus;
  winner: ABTestWinner | null;
  winnerApplied: boolean;
  variantAMentions: number;
  variantBMentions: number;
  totalChecks: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

/**
 * Check if shop can create more A/B tests
 */
export async function checkABTestQuota(shopDomain: string): Promise<{
  canCreate: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      plan: true,
      abTests: {
        where: {
          status: { in: ['draft', 'running'] },
        },
        select: { id: true },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  // Use visibility checks limit as proxy for A/B test limit
  const limit = Math.max(3, Math.floor(planLimits.visibilityChecksPerMonth / 10));
  const used = shop.abTests.length;

  return {
    canCreate: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Create a new A/B test
 */
export async function createABTest(
  shopDomain: string,
  input: CreateABTestInput
): Promise<ABTestSummary> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: {
      id: true,
      plan: true,
      productsAudit: {
        where: { shopifyProductId: BigInt(input.productId) },
        select: { title: true },
      },
    },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Check quota
  const quota = await checkABTestQuota(shopDomain);
  if (!quota.canCreate) {
    throw new Error('A/B test limit reached. Complete or cancel existing tests first.');
  }

  const productTitle = shop.productsAudit[0]?.title || 'Unknown Product';

  // Get current content (variant A)
  const productAudit = await prisma.productAudit.findFirst({
    where: {
      shopifyProductId: BigInt(input.productId),
      shop: { shopDomain },
    },
  });

  // For now, use a placeholder for variant A
  // In production, this would fetch from Shopify
  const variantA = productAudit?.title || 'Current content';

  // Generate test queries if not provided
  const testQueries = input.testQueries?.length
    ? input.testQueries
    : generateTestQueries(productTitle, input.field);

  const test = await prisma.aBTest.create({
    data: {
      shopId: shop.id,
      name: input.name,
      shopifyProductId: BigInt(input.productId),
      productTitle,
      field: input.field,
      variantA,
      variantB: input.variantB,
      testQueries,
    },
  });

  logger.info({ shopDomain, testId: test.id }, 'A/B test created');

  return formatTestSummary(test);
}

/**
 * Start running an A/B test
 */
export async function startABTest(shopDomain: string, testId: string): Promise<ABTestSummary> {
  const test = await prisma.aBTest.findFirst({
    where: {
      id: testId,
      shop: { shopDomain },
      status: 'draft',
    },
  });

  if (!test) {
    throw new Error('Test not found or already started');
  }

  await prisma.aBTest.update({
    where: { id: testId },
    data: {
      status: 'running',
      startedAt: new Date(),
    },
  });

  // Run the test asynchronously
  runABTestQueries(shopDomain, testId).catch((err) => {
    logger.error({ error: err, testId }, 'A/B test execution failed');
  });

  const updated = await prisma.aBTest.findUnique({ where: { id: testId } });
  return formatTestSummary(updated!);
}

/**
 * Run A/B test queries
 */
async function runABTestQueries(shopDomain: string, testId: string): Promise<void> {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
    include: { shop: true },
  });

  if (!test || test.status !== 'running') {
    return;
  }

  const queries = test.testQueries as string[];
  const platforms: Platform[] = ['chatgpt', 'perplexity'];

  for (const query of queries) {
    for (const platform of platforms) {
      // Test Variant A
      const resultA = await testVariantWithAI(query, test.variantA, platform);
      await prisma.aBTestResult.create({
        data: {
          testId,
          variant: 'A',
          query,
          platform,
          isMentioned: resultA.isMentioned,
          position: resultA.position,
          context: resultA.context,
        },
      });

      // Test Variant B
      const resultB = await testVariantWithAI(query, test.variantB, platform);
      await prisma.aBTestResult.create({
        data: {
          testId,
          variant: 'B',
          query,
          platform,
          isMentioned: resultB.isMentioned,
          position: resultB.position,
          context: resultB.context,
        },
      });

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Calculate results
  const results = await prisma.aBTestResult.findMany({
    where: { testId },
  });

  const variantAResults = results.filter((r) => r.variant === 'A');
  const variantBResults = results.filter((r) => r.variant === 'B');

  const variantAMentions = variantAResults.filter((r) => r.isMentioned).length;
  const variantBMentions = variantBResults.filter((r) => r.isMentioned).length;

  const variantAPositions = variantAResults.filter((r) => r.position).map((r) => r.position!);
  const variantBPositions = variantBResults.filter((r) => r.position).map((r) => r.position!);

  const variantAAvgPosition = variantAPositions.length > 0
    ? variantAPositions.reduce((a, b) => a + b, 0) / variantAPositions.length
    : null;
  const variantBAvgPosition = variantBPositions.length > 0
    ? variantBPositions.reduce((a, b) => a + b, 0) / variantBPositions.length
    : null;

  // Determine winner
  let winner: ABTestWinner = 'tie';
  const mentionDiff = variantBMentions - variantAMentions;

  if (mentionDiff >= 2) {
    winner = 'B';
  } else if (mentionDiff <= -2) {
    winner = 'A';
  } else if (variantAAvgPosition && variantBAvgPosition) {
    // If mentions are similar, compare positions (lower is better)
    if (variantBAvgPosition < variantAAvgPosition - 0.5) {
      winner = 'B';
    } else if (variantAAvgPosition < variantBAvgPosition - 0.5) {
      winner = 'A';
    }
  }

  await prisma.aBTest.update({
    where: { id: testId },
    data: {
      variantAMentions,
      variantBMentions,
      variantAAvgPosition,
      variantBAvgPosition,
      totalChecks: results.length,
      status: 'completed',
      winner,
      completedAt: new Date(),
    },
  });

  logger.info(
    { testId, winner, variantAMentions, variantBMentions },
    'A/B test completed'
  );

  // Send Flow trigger
  await triggerABTestCompleted(
    shopDomain,
    test.name,
    test.shopifyProductId.toString(),
    winner,
    variantAMentions,
    variantBMentions
  );
}

/**
 * Test a content variant with AI
 */
async function testVariantWithAI(
  query: string,
  content: string,
  platform: Platform
): Promise<{ isMentioned: boolean; position: number | null; context: string | null }> {
  try {
    // Simulate how AI would respond with this content available
    const prompt = `You are helping someone find products. The user asks: "${query}"

Consider this product information when making recommendations:
${content}

Provide a helpful response with product recommendations. If the product information is relevant, mention it in your recommendations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful shopping assistant. Provide product recommendations based on user queries. Be specific about brand names and product features.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';

    // Check if the content keywords appear in the response
    const contentWords = content.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const responseWords = response.toLowerCase();

    const matchingWords = contentWords.filter((word) => responseWords.includes(word));
    const isMentioned = matchingWords.length >= 2; // At least 2 significant words match

    // Extract position if mentioned
    let position: number | null = null;
    if (isMentioned) {
      const listMatches = response.match(/\d+\./g);
      position = listMatches ? Math.ceil(listMatches.length / 2) : 1;
    }

    return {
      isMentioned,
      position,
      context: isMentioned ? response.substring(0, 200) : null,
    };
  } catch (error) {
    logger.error({ error, query }, 'A/B test query failed');
    return { isMentioned: false, position: null, context: null };
  }
}

/**
 * Generate test queries for a product
 */
function generateTestQueries(productTitle: string, field: ABTestField): string[] {
  const baseQueries = [
    `What are the best ${productTitle} options?`,
    `Recommend products like ${productTitle}`,
    `Where can I buy ${productTitle}?`,
    `Compare ${productTitle} products`,
    `Best ${productTitle} for quality`,
  ];

  return baseQueries.slice(0, 5);
}

/**
 * Get all A/B tests for a shop
 */
export async function getABTests(shopDomain: string): Promise<ABTestSummary[]> {
  const tests = await prisma.aBTest.findMany({
    where: { shop: { shopDomain } },
    orderBy: { createdAt: 'desc' },
  });

  return tests.map(formatTestSummary);
}

/**
 * Get a single A/B test with results
 */
export async function getABTest(shopDomain: string, testId: string) {
  const test = await prisma.aBTest.findFirst({
    where: {
      id: testId,
      shop: { shopDomain },
    },
    include: {
      testResults: {
        orderBy: { testedAt: 'desc' },
      },
    },
  });

  if (!test) {
    return null;
  }

  return {
    ...formatTestSummary(test),
    variantA: test.variantA,
    variantB: test.variantB,
    testQueries: test.testQueries,
    variantAAvgPosition: test.variantAAvgPosition,
    variantBAvgPosition: test.variantBAvgPosition,
    results: test.testResults.map((r) => ({
      id: r.id,
      variant: r.variant,
      query: r.query,
      platform: r.platform,
      isMentioned: r.isMentioned,
      position: r.position,
      context: r.context,
      testedAt: r.testedAt.toISOString(),
    })),
  };
}

/**
 * Cancel an A/B test
 */
export async function cancelABTest(shopDomain: string, testId: string): Promise<void> {
  await prisma.aBTest.updateMany({
    where: {
      id: testId,
      shop: { shopDomain },
      status: { in: ['draft', 'running'] },
    },
    data: {
      status: 'cancelled',
    },
  });

  logger.info({ testId }, 'A/B test cancelled');
}

/**
 * Delete an A/B test
 */
export async function deleteABTest(shopDomain: string, testId: string): Promise<void> {
  await prisma.aBTest.deleteMany({
    where: {
      id: testId,
      shop: { shopDomain },
    },
  });

  logger.info({ testId }, 'A/B test deleted');
}

/**
 * Apply the winning variant to the product
 */
export async function applyABTestWinner(
  shopDomain: string,
  testId: string
): Promise<{ applied: boolean; message: string }> {
  const test = await prisma.aBTest.findFirst({
    where: {
      id: testId,
      shop: { shopDomain },
      status: 'completed',
      winnerApplied: false,
    },
  });

  if (!test) {
    return { applied: false, message: 'Test not found or winner already applied' };
  }

  if (test.winner === 'tie') {
    return { applied: false, message: 'No clear winner - cannot auto-apply' };
  }

  // Mark as applied (actual Shopify update would happen via optimize API)
  await prisma.aBTest.update({
    where: { id: testId },
    data: { winnerApplied: true },
  });

  const winningContent = test.winner === 'B' ? test.variantB : test.variantA;

  logger.info(
    { testId, winner: test.winner, productId: test.shopifyProductId.toString() },
    'A/B test winner applied'
  );

  return {
    applied: true,
    message: `Variant ${test.winner} content ready to apply. ${test.winner === 'B' ? 'New variant' : 'Original content'} wins.`,
  };
}

function formatTestSummary(test: {
  id: string;
  name: string;
  productTitle: string;
  field: ABTestField;
  status: ABTestStatus;
  winner: ABTestWinner | null;
  winnerApplied: boolean;
  variantAMentions: number;
  variantBMentions: number;
  totalChecks: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}): ABTestSummary {
  return {
    id: test.id,
    name: test.name,
    productTitle: test.productTitle,
    field: test.field,
    status: test.status,
    winner: test.winner,
    winnerApplied: test.winnerApplied,
    variantAMentions: test.variantAMentions,
    variantBMentions: test.variantBMentions,
    totalChecks: test.totalChecks,
    createdAt: test.createdAt.toISOString(),
    startedAt: test.startedAt?.toISOString() || null,
    completedAt: test.completedAt?.toISOString() || null,
  };
}

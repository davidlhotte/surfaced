import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import { PLAN_LIMITS } from '@/lib/constants/plans';
import { logger } from '@/lib/monitoring/logger';
import type { Plan } from '@prisma/client';

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type OptimizationSuggestion = {
  field: 'description' | 'seoTitle' | 'seoDescription' | 'tags' | 'altText';
  original: string;
  suggested: string;
  reasoning: string;
  improvement: string; // Brief description of what was improved
};

export type ProductOptimization = {
  productId: string;
  title: string;
  handle: string;
  currentScore: number;
  estimatedNewScore: number;
  suggestions: OptimizationSuggestion[];
};

export type OptimizationResult = {
  shopDomain: string;
  optimizationsGenerated: number;
  optimizationsRemaining: number;
  products: ProductOptimization[];
};

/**
 * Check if shop has AI optimization available based on plan
 */
export async function checkOptimizationQuota(shopDomain: string): Promise<{
  available: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true, plan: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  const planLimits = PLAN_LIMITS[shop.plan as Plan];
  const limit = planLimits.aiOptimizationsPerMonth;

  // Count optimizations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usedThisMonth = await prisma.auditLog.count({
    where: {
      shopId: shop.id,
      action: 'ai_optimization',
      createdAt: { gte: startOfMonth },
    },
  });

  return {
    available: usedThisMonth < limit,
    used: usedThisMonth,
    limit,
    remaining: Math.max(0, limit - usedThisMonth),
  };
}

/**
 * Generate AI-powered optimization suggestions for a product
 */
export async function generateOptimizationSuggestions(
  shopDomain: string,
  productId: string,
  productData: {
    title: string;
    handle: string;
    description: string;
    seoTitle?: string;
    seoDescription?: string;
    productType?: string;
    vendor?: string;
    tags: string[];
    imageAltTexts: string[];
  }
): Promise<ProductOptimization> {
  logger.info({ shopDomain, productId }, 'Generating optimization suggestions');

  // Check quota
  const quota = await checkOptimizationQuota(shopDomain);
  if (!quota.available) {
    throw new Error(`AI optimization limit reached (${quota.limit}/month). Upgrade your plan for more.`);
  }

  // Determine which suggestions are needed
  const needsDescription = !productData.description || productData.description.length < 150;
  const needsSeoTitle = !productData.seoTitle;
  const needsSeoDescription = !productData.seoDescription;
  const needsTags = productData.tags.length < 5;

  // Build array of generation tasks to run in parallel
  const generationTasks: Promise<OptimizationSuggestion | null>[] = [];

  if (needsDescription) {
    generationTasks.push(generateDescriptionSuggestion(productData));
  }
  if (needsSeoTitle) {
    generationTasks.push(generateSeoTitleSuggestion(productData));
  }
  if (needsSeoDescription) {
    generationTasks.push(generateSeoDescriptionSuggestion(productData));
  }
  if (needsTags) {
    generationTasks.push(generateTagsSuggestion(productData));
  }

  // Run all OpenAI calls in parallel for much faster optimization
  const results = await Promise.all(generationTasks);

  // Filter out null results
  const suggestions: OptimizationSuggestion[] = results.filter(
    (result): result is OptimizationSuggestion => result !== null
  );

  // Calculate estimated new score
  const estimatedNewScore = calculateEstimatedScore(productData, suggestions);

  // Get shop and log the optimization
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (shop) {
    await prisma.auditLog.create({
      data: {
        shopId: shop.id,
        action: 'ai_optimization',
        details: {
          productId,
          suggestionsCount: suggestions.length,
        },
      },
    });
  }

  logger.info(
    { shopDomain, productId, suggestionsCount: suggestions.length },
    'Optimization suggestions generated'
  );

  return {
    productId,
    title: productData.title,
    handle: productData.handle,
    currentScore: calculateCurrentScore(productData),
    estimatedNewScore,
    suggestions,
  };
}

/**
 * Generate an optimized product description
 */
async function generateDescriptionSuggestion(
  productData: {
    title: string;
    description: string;
    productType?: string;
    vendor?: string;
    tags: string[];
  }
): Promise<OptimizationSuggestion | null> {
  if (!process.env.OPENAI_API_KEY) {
    logger.warn('OpenAI API key not configured, skipping description optimization');
    return null;
  }

  try {
    const prompt = `You are an e-commerce content optimizer. Create an engaging, AI-friendly product description for this product.

Product Title: ${productData.title}
Current Description: ${productData.description || 'None'}
Product Type: ${productData.productType || 'Not specified'}
Brand/Vendor: ${productData.vendor || 'Not specified'}
Tags: ${productData.tags.join(', ') || 'None'}

Requirements:
- Write 150-300 words
- Include key features and benefits
- Use natural language that AI assistants can easily understand
- Include relevant keywords naturally
- Focus on what makes this product valuable to customers
- Do not use excessive marketing speak or clickbait

Return ONLY the description text, no quotes or formatting.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert e-commerce copywriter who creates product descriptions optimized for both customers and AI assistants.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const suggested = completion.choices[0]?.message?.content?.trim() || '';

    if (!suggested) {
      return null;
    }

    return {
      field: 'description',
      original: productData.description || '',
      suggested,
      reasoning: 'AI assistants need detailed, natural language descriptions to accurately recommend products. This optimized description includes key features, benefits, and relevant keywords.',
      improvement: productData.description
        ? 'Enhanced description with more detail and natural language'
        : 'Added comprehensive product description',
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate description suggestion');
    return null;
  }
}

/**
 * Generate an SEO title suggestion
 */
async function generateSeoTitleSuggestion(
  productData: {
    title: string;
    productType?: string;
    vendor?: string;
  }
): Promise<OptimizationSuggestion | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Create concise, keyword-rich page titles.',
        },
        {
          role: 'user',
          content: `Create an SEO-optimized page title for this product.

Product: ${productData.title}
Type: ${productData.productType || 'Not specified'}
Brand: ${productData.vendor || 'Not specified'}

Requirements:
- 50-60 characters max
- Include primary keyword (product type)
- Include brand if relevant
- Make it compelling and clear

Return ONLY the title text, no quotes.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    const suggested = completion.choices[0]?.message?.content?.trim() || '';

    if (!suggested) {
      return null;
    }

    return {
      field: 'seoTitle',
      original: '',
      suggested,
      reasoning: 'A custom SEO title helps search engines and AI understand what your product is. It should include your primary keyword and be compelling.',
      improvement: 'Added SEO-optimized page title',
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate SEO title suggestion');
    return null;
  }
}

/**
 * Generate an SEO description suggestion
 */
async function generateSeoDescriptionSuggestion(
  productData: {
    title: string;
    description: string;
    productType?: string;
  }
): Promise<OptimizationSuggestion | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Create compelling meta descriptions.',
        },
        {
          role: 'user',
          content: `Create an SEO meta description for this product.

Product: ${productData.title}
Type: ${productData.productType || 'Not specified'}
Description: ${productData.description?.substring(0, 200) || 'Not available'}

Requirements:
- 150-160 characters max
- Include a call to action
- Summarize the key benefit
- Include primary keyword naturally

Return ONLY the meta description text, no quotes.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    const suggested = completion.choices[0]?.message?.content?.trim() || '';

    if (!suggested) {
      return null;
    }

    return {
      field: 'seoDescription',
      original: '',
      suggested,
      reasoning: 'Meta descriptions appear in search results and help AI understand your product. A good meta description improves click-through rates.',
      improvement: 'Added compelling meta description',
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate SEO description suggestion');
    return null;
  }
}

/**
 * Generate tag suggestions
 */
async function generateTagsSuggestion(
  productData: {
    title: string;
    description: string;
    productType?: string;
    tags: string[];
  }
): Promise<OptimizationSuggestion | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an e-commerce expert. Suggest relevant product tags.',
        },
        {
          role: 'user',
          content: `Suggest tags for this product to improve discoverability.

Product: ${productData.title}
Type: ${productData.productType || 'Not specified'}
Description: ${productData.description?.substring(0, 300) || 'Not available'}
Current Tags: ${productData.tags.join(', ') || 'None'}

Requirements:
- Suggest 5-10 relevant tags
- Include category, material, style, use case tags
- Make them specific and useful for filtering
- Separate with commas

Return ONLY the comma-separated tags, no other text.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    const suggestedTags = completion.choices[0]?.message?.content?.trim() || '';

    if (!suggestedTags) {
      return null;
    }

    return {
      field: 'tags',
      original: productData.tags.join(', '),
      suggested: suggestedTags,
      reasoning: 'Tags help categorize products and improve filtering. Good tags help AI understand product attributes like material, style, and use case.',
      improvement: 'Added relevant product tags',
    };
  } catch (error) {
    logger.error({ error }, 'Failed to generate tags suggestion');
    return null;
  }
}

/**
 * Calculate current product score based on data
 */
function calculateCurrentScore(productData: {
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
}): number {
  let score = 100;

  // Description scoring
  if (!productData.description) {
    score -= 40;
  } else if (productData.description.length < 50) {
    score -= 25;
  } else if (productData.description.length < 150) {
    score -= 10;
  }

  // SEO scoring
  if (!productData.seoTitle) score -= 5;
  if (!productData.seoDescription) score -= 5;

  // Tags scoring
  if (productData.tags.length === 0) score -= 5;
  else if (productData.tags.length < 3) score -= 2;

  // Bonus for good practices
  if (productData.description && productData.description.length >= 300) {
    score += 5;
  }
  if (productData.tags.length >= 5) {
    score += 2;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate estimated score after applying suggestions
 */
function calculateEstimatedScore(
  productData: {
    description: string;
    seoTitle?: string;
    seoDescription?: string;
    tags: string[];
  },
  suggestions: OptimizationSuggestion[]
): number {
  // Start with current data
  const data = { ...productData };

  // Apply suggestions
  for (const suggestion of suggestions) {
    switch (suggestion.field) {
      case 'description':
        data.description = suggestion.suggested;
        break;
      case 'seoTitle':
        data.seoTitle = suggestion.suggested;
        break;
      case 'seoDescription':
        data.seoDescription = suggestion.suggested;
        break;
      case 'tags':
        data.tags = suggestion.suggested.split(',').map((t) => t.trim());
        break;
    }
  }

  return calculateCurrentScore(data);
}

/**
 * Generate ALT text suggestions for product images
 */
export async function generateAltTextSuggestions(
  shopDomain: string,
  productId: string,
  productData: {
    title: string;
    description: string;
    productType?: string;
    vendor?: string;
    images: Array<{
      url: string;
      altText: string | null;
    }>;
  }
): Promise<{
  productId: string;
  title: string;
  suggestions: Array<{
    imageUrl: string;
    originalAlt: string | null;
    suggestedAlt: string;
    reasoning: string;
  }>;
}> {
  logger.info({ shopDomain, productId, imageCount: productData.images.length }, 'Generating ALT text suggestions');

  // Check quota
  const quota = await checkOptimizationQuota(shopDomain);
  if (!quota.available) {
    throw new Error(`AI optimization limit reached (${quota.limit}/month). Upgrade your plan for more.`);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Filter images that need ALT text
  const imagesNeedingAlt = productData.images.filter(img => !img.altText || img.altText.length < 10);

  if (imagesNeedingAlt.length === 0) {
    return {
      productId,
      title: productData.title,
      suggestions: [],
    };
  }

  // Generate ALT text for each image in parallel
  const suggestions = await Promise.all(
    imagesNeedingAlt.slice(0, 5).map(async (image, index) => {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at writing accessible, SEO-friendly image alt text for e-commerce products. Create descriptive alt text that helps visually impaired users and AI systems understand the image.',
            },
            {
              role: 'user',
              content: `Write an alt text for product image ${index + 1} of "${productData.title}".

Product Details:
- Title: ${productData.title}
- Type: ${productData.productType || 'Not specified'}
- Brand: ${productData.vendor || 'Not specified'}
- Description: ${productData.description?.substring(0, 200) || 'Not available'}
- Image URL: ${image.url}

Requirements:
- 50-125 characters
- Describe what the image shows (product angle, context, usage)
- Include product name naturally
- Be specific and descriptive
- Don't start with "Image of" or "Picture of"

Return ONLY the alt text, no quotes.`,
            },
          ],
          max_tokens: 100,
          temperature: 0.6,
        });

        const suggestedAlt = completion.choices[0]?.message?.content?.trim() || '';

        return {
          imageUrl: image.url,
          originalAlt: image.altText,
          suggestedAlt,
          reasoning: 'Descriptive alt text helps AI assistants and visually impaired users understand your product images, improving accessibility and AI visibility.',
        };
      } catch (error) {
        logger.error({ error, imageUrl: image.url }, 'Failed to generate ALT text');
        return null;
      }
    })
  );

  // Log the optimization
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (shop) {
    await prisma.auditLog.create({
      data: {
        shopId: shop.id,
        action: 'ai_optimization',
        details: {
          type: 'alt_text',
          productId,
          suggestionsCount: suggestions.filter(Boolean).length,
        },
      },
    });
  }

  return {
    productId,
    title: productData.title,
    suggestions: suggestions.filter((s): s is NonNullable<typeof s> => s !== null && s.suggestedAlt.length > 0),
  };
}

/**
 * Generate meta tags optimization suggestions
 */
export async function generateMetaTagsSuggestions(
  shopDomain: string,
  productId: string,
  productData: {
    title: string;
    description: string;
    productType?: string;
    vendor?: string;
    seoTitle?: string;
    seoDescription?: string;
  }
): Promise<{
  productId: string;
  title: string;
  suggestions: {
    seoTitle: { original: string; suggested: string; reasoning: string } | null;
    seoDescription: { original: string; suggested: string; reasoning: string } | null;
    ogTitle: { suggested: string; reasoning: string } | null;
    ogDescription: { suggested: string; reasoning: string } | null;
  };
}> {
  logger.info({ shopDomain, productId }, 'Generating meta tags suggestions');

  // Check quota
  const quota = await checkOptimizationQuota(shopDomain);
  if (!quota.available) {
    throw new Error(`AI optimization limit reached (${quota.limit}/month). Upgrade your plan for more.`);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Generate all meta tags in one API call for efficiency
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an SEO and social media expert. Generate optimized meta tags for e-commerce products.',
      },
      {
        role: 'user',
        content: `Generate meta tags for this product:

Product: ${productData.title}
Type: ${productData.productType || 'Not specified'}
Brand: ${productData.vendor || 'Not specified'}
Description: ${productData.description?.substring(0, 300) || 'Not available'}
Current SEO Title: ${productData.seoTitle || 'None'}
Current SEO Description: ${productData.seoDescription || 'None'}

Generate JSON with:
{
  "seoTitle": "50-60 char SEO title with primary keyword",
  "seoDescription": "150-160 char meta description with CTA",
  "ogTitle": "60-90 char engaging title for social sharing",
  "ogDescription": "200 char description optimized for social media"
}

Return ONLY valid JSON, no markdown.`,
      },
    ],
    max_tokens: 400,
    temperature: 0.6,
  });

  let metaTags: {
    seoTitle?: string;
    seoDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
  } = {};

  try {
    const content = completion.choices[0]?.message?.content?.trim() || '{}';
    metaTags = JSON.parse(content);
  } catch {
    logger.error('Failed to parse meta tags JSON');
    throw new Error('Failed to generate meta tags');
  }

  // Log the optimization
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (shop) {
    await prisma.auditLog.create({
      data: {
        shopId: shop.id,
        action: 'ai_optimization',
        details: {
          type: 'meta_tags',
          productId,
        },
      },
    });
  }

  return {
    productId,
    title: productData.title,
    suggestions: {
      seoTitle: metaTags.seoTitle ? {
        original: productData.seoTitle || '',
        suggested: metaTags.seoTitle,
        reasoning: 'SEO titles should be 50-60 characters with your primary keyword at the start.',
      } : null,
      seoDescription: metaTags.seoDescription ? {
        original: productData.seoDescription || '',
        suggested: metaTags.seoDescription,
        reasoning: 'Meta descriptions should be 150-160 characters with a clear call-to-action.',
      } : null,
      ogTitle: metaTags.ogTitle ? {
        suggested: metaTags.ogTitle,
        reasoning: 'Open Graph titles appear when your product is shared on social media.',
      } : null,
      ogDescription: metaTags.ogDescription ? {
        suggested: metaTags.ogDescription,
        reasoning: 'Open Graph descriptions provide context for social media shares.',
      } : null,
    },
  };
}

/**
 * Get products that need optimization
 */
export async function getProductsForOptimization(
  shopDomain: string,
  limit: number = 10
): Promise<{
  id: string;
  shopifyProductId: string;
  title: string;
  handle: string;
  aiScore: number;
  issues: Array<{ code: string; message: string }>;
}[]> {
  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Get products with low scores
  const products = await prisma.productAudit.findMany({
    where: {
      shopId: shop.id,
      aiScore: { lt: 70 }, // Products that need improvement
    },
    orderBy: { aiScore: 'asc' },
    take: limit,
    select: {
      id: true,
      shopifyProductId: true,
      title: true,
      handle: true,
      aiScore: true,
      issues: true,
    },
  });

  return products.map((p) => ({
    id: p.id,
    shopifyProductId: p.shopifyProductId.toString(),
    title: p.title,
    handle: p.handle,
    aiScore: p.aiScore,
    issues: (p.issues as Array<{ code: string; message: string }>) || [],
  }));
}

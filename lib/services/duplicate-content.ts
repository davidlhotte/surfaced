import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import { fetchProducts } from '@/lib/shopify/graphql';

// Types
export interface DuplicateGroup {
  type: 'exact' | 'similar' | 'template';
  similarity: number;
  products: {
    id: string;
    title: string;
    handle: string;
    description: string;
  }[];
  issue: string;
  recommendation: string;
}

export interface DuplicateContentReport {
  shopDomain: string;
  totalProducts: number;
  analyzedProducts: number;
  duplicateGroups: DuplicateGroup[];
  summary: {
    exactDuplicates: number;
    similarDescriptions: number;
    templateDescriptions: number;
    affectedProducts: number;
  };
  score: number; // 0-100, higher is better (less duplicates)
  generatedAt: string;
}

/**
 * Calculate similarity between two strings using Jaccard similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const words1 = new Set(normalize(str1));
  const words2 = new Set(normalize(str2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Calculate n-gram similarity for better template detection
 */
function calculateNgramSimilarity(str1: string, str2: string, n: number = 3): number {
  const getNgrams = (s: string) => {
    const clean = s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const ngrams = new Set<string>();
    for (let i = 0; i <= clean.length - n; i++) {
      ngrams.add(clean.substring(i, i + n));
    }
    return ngrams;
  };

  const ngrams1 = getNgrams(str1);
  const ngrams2 = getNgrams(str2);

  if (ngrams1.size === 0 || ngrams2.size === 0) return 0;

  const intersection = new Set([...ngrams1].filter(ng => ngrams2.has(ng)));
  const union = new Set([...ngrams1, ...ngrams2]);

  return intersection.size / union.size;
}

/**
 * Detect template patterns in descriptions
 */
function detectTemplatePatterns(descriptions: string[]): string[] {
  const patterns: string[] = [];

  // Common template indicators
  const templateIndicators = [
    /\[product\s*name\]/gi,
    /\[brand\]/gi,
    /\{\{.*?\}\}/g,
    /INSERT\s+.*?\s+HERE/gi,
    /Lorem ipsum/gi,
    /placeholder/gi,
  ];

  for (const desc of descriptions) {
    for (const pattern of templateIndicators) {
      if (pattern.test(desc)) {
        patterns.push(desc.substring(0, 100));
        break;
      }
    }
  }

  return patterns;
}

/**
 * Find duplicate and similar content groups
 */
function findDuplicateGroups(
  products: Array<{
    id: string;
    title: string;
    handle: string;
    description: string;
  }>
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

  // Exact duplicates (hash-based)
  const descriptionMap = new Map<string, typeof products>();

  for (const product of products) {
    if (!product.description || product.description.length < 50) continue;

    const normalizedDesc = product.description.toLowerCase().trim();
    const existing = descriptionMap.get(normalizedDesc);

    if (existing) {
      existing.push(product);
    } else {
      descriptionMap.set(normalizedDesc, [product]);
    }
  }

  // Add exact duplicate groups
  for (const [, prods] of descriptionMap) {
    if (prods.length > 1) {
      groups.push({
        type: 'exact',
        similarity: 100,
        products: prods,
        issue: `${prods.length} products have identical descriptions`,
        recommendation: 'Create unique descriptions for each product to help AI distinguish them',
      });
      prods.forEach(p => processed.add(p.id));
    }
  }

  // Similar descriptions (similarity-based)
  const remaining = products.filter(p =>
    !processed.has(p.id) && p.description && p.description.length >= 50
  );

  for (let i = 0; i < remaining.length; i++) {
    if (processed.has(remaining[i].id)) continue;

    const similar: typeof products = [remaining[i]];

    for (let j = i + 1; j < remaining.length; j++) {
      if (processed.has(remaining[j].id)) continue;

      const similarity = calculateSimilarity(
        remaining[i].description,
        remaining[j].description
      );

      if (similarity > 0.7) {
        similar.push(remaining[j]);
      }
    }

    if (similar.length > 1) {
      const avgSimilarity = Math.round(
        similar.slice(1).reduce((sum, p) =>
          sum + calculateSimilarity(remaining[i].description, p.description), 0
        ) / (similar.length - 1) * 100
      );

      groups.push({
        type: 'similar',
        similarity: avgSimilarity,
        products: similar,
        issue: `${similar.length} products have very similar descriptions (${avgSimilarity}% similar)`,
        recommendation: 'Differentiate these descriptions by highlighting unique features of each product',
      });
      similar.forEach(p => processed.add(p.id));
    }
  }

  // Template detection
  const allDescriptions = products
    .filter(p => p.description && p.description.length > 0)
    .map(p => p.description);

  const templatePatterns = detectTemplatePatterns(allDescriptions);
  if (templatePatterns.length > 0) {
    const templateProducts = products.filter(p =>
      templatePatterns.some(pattern =>
        p.description && calculateNgramSimilarity(p.description, pattern) > 0.8
      )
    );

    if (templateProducts.length > 0) {
      groups.push({
        type: 'template',
        similarity: 80,
        products: templateProducts,
        issue: `${templateProducts.length} products appear to use template descriptions`,
        recommendation: 'Replace template text with unique, specific product information',
      });
    }
  }

  return groups;
}

/**
 * Analyze duplicate content for a shop
 */
export async function analyzeDuplicateContent(
  shopDomain: string
): Promise<DuplicateContentReport> {
  logger.info({ shopDomain }, 'Starting duplicate content analysis');

  const shop = await prisma.shop.findUnique({
    where: { shopDomain },
    select: { id: true },
  });

  if (!shop) {
    throw new Error('Shop not found');
  }

  // Fetch products from Shopify
  const productsResponse = await fetchProducts(shopDomain, 250);
  const products = productsResponse.products.nodes.map(p => ({
    id: p.id.match(/\/(\d+)$/)?.[1] || p.id,
    title: p.title,
    handle: p.handle,
    description: p.description || '',
  }));

  // Find duplicates
  const duplicateGroups = findDuplicateGroups(products);

  // Calculate summary
  const exactDuplicates = duplicateGroups
    .filter(g => g.type === 'exact')
    .reduce((sum, g) => sum + g.products.length, 0);

  const similarDescriptions = duplicateGroups
    .filter(g => g.type === 'similar')
    .reduce((sum, g) => sum + g.products.length, 0);

  const templateDescriptions = duplicateGroups
    .filter(g => g.type === 'template')
    .reduce((sum, g) => sum + g.products.length, 0);

  const affectedProducts = new Set(
    duplicateGroups.flatMap(g => g.products.map(p => p.id))
  ).size;

  // Calculate score (higher is better)
  const duplicateRatio = products.length > 0 ? affectedProducts / products.length : 0;
  const score = Math.round((1 - duplicateRatio) * 100);

  // Log the analysis
  await prisma.auditLog.create({
    data: {
      shopId: shop.id,
      action: 'duplicate_content_analysis',
      details: {
        totalProducts: products.length,
        duplicateGroups: duplicateGroups.length,
        affectedProducts,
        score,
      },
    },
  });

  logger.info(
    { shopDomain, duplicateGroups: duplicateGroups.length, score },
    'Duplicate content analysis completed'
  );

  return {
    shopDomain,
    totalProducts: products.length,
    analyzedProducts: products.filter(p => p.description.length >= 50).length,
    duplicateGroups,
    summary: {
      exactDuplicates,
      similarDescriptions,
      templateDescriptions,
      affectedProducts,
    },
    score,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get duplicate content suggestions for a specific product
 */
export async function getProductDuplicateSuggestions(
  shopDomain: string,
  productId: string
): Promise<{
  product: { id: string; title: string; description: string };
  similarProducts: Array<{
    id: string;
    title: string;
    similarity: number;
  }>;
  recommendations: string[];
}> {
  const productsResponse = await fetchProducts(shopDomain, 250);
  const products = productsResponse.products.nodes;

  const targetProduct = products.find(p => {
    const id = p.id.match(/\/(\d+)$/)?.[1];
    return id === productId;
  });

  if (!targetProduct) {
    throw new Error('Product not found');
  }

  const similarProducts: Array<{
    id: string;
    title: string;
    similarity: number;
  }> = [];

  for (const product of products) {
    if (product.id === targetProduct.id) continue;
    if (!product.description || !targetProduct.description) continue;

    const similarity = calculateSimilarity(targetProduct.description, product.description);
    if (similarity > 0.5) {
      similarProducts.push({
        id: product.id.match(/\/(\d+)$/)?.[1] || product.id,
        title: product.title,
        similarity: Math.round(similarity * 100),
      });
    }
  }

  // Sort by similarity
  similarProducts.sort((a, b) => b.similarity - a.similarity);

  // Generate recommendations
  const recommendations: string[] = [];

  if (similarProducts.length > 0) {
    recommendations.push(`Found ${similarProducts.length} products with similar descriptions`);
    recommendations.push('Consider adding unique selling points to differentiate this product');
    recommendations.push('Include specific features, dimensions, or use cases unique to this product');
  }

  if (!targetProduct.description || targetProduct.description.length < 100) {
    recommendations.push('Add a more detailed product description (aim for 150+ characters)');
  }

  return {
    product: {
      id: productId,
      title: targetProduct.title,
      description: targetProduct.description || '',
    },
    similarProducts: similarProducts.slice(0, 5),
    recommendations,
  };
}

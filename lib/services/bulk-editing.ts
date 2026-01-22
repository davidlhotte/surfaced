import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/monitoring/logger';
import { fetchProducts } from '@/lib/shopify/graphql';
import { generateAltTextSuggestions, generateMetaTagsSuggestions } from './content-optimizer';

// Types
export interface BulkEditOperation {
  type: 'alt_text' | 'meta_tags' | 'description' | 'title';
  productIds: string[];
  options?: {
    applyAutomatically?: boolean;
    skipIfExists?: boolean;
  };
}

export interface BulkEditResult {
  productId: string;
  productTitle: string;
  status: 'success' | 'skipped' | 'error';
  changes?: {
    field: string;
    before: string | null;
    after: string;
  }[];
  error?: string;
}

export interface BulkEditJob {
  id: string;
  shopDomain: string;
  operation: BulkEditOperation;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    succeeded: number;
    failed: number;
  };
  results: BulkEditResult[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// In-memory job storage (in production, use Redis or database)
const jobs = new Map<string, BulkEditJob>();

/**
 * Create a new bulk edit job
 */
export function createBulkEditJob(
  shopDomain: string,
  operation: BulkEditOperation
): BulkEditJob {
  const job: BulkEditJob = {
    id: `bulk-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    shopDomain,
    operation,
    status: 'pending',
    progress: {
      total: operation.productIds.length,
      completed: 0,
      succeeded: 0,
      failed: 0,
    },
    results: [],
    startedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };

  jobs.set(job.id, job);
  return job;
}

/**
 * Get a bulk edit job by ID
 */
export function getBulkEditJob(jobId: string): BulkEditJob | null {
  return jobs.get(jobId) || null;
}

/**
 * Get all jobs for a shop
 */
export function getShopBulkEditJobs(shopDomain: string): BulkEditJob[] {
  return Array.from(jobs.values())
    .filter(job => job.shopDomain === shopDomain)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Process a bulk edit job
 */
export async function processBulkEditJob(jobId: string): Promise<BulkEditJob> {
  const job = jobs.get(jobId);
  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== 'pending') {
    throw new Error(`Job is already ${job.status}`);
  }

  job.status = 'processing';
  job.startedAt = new Date().toISOString();

  logger.info({ jobId, shopDomain: job.shopDomain, operation: job.operation.type }, 'Starting bulk edit job');

  try {
    // Fetch products data
    const productsResponse = await fetchProducts(job.shopDomain, 250);
    const productsMap = new Map(
      productsResponse.products.nodes.map(p => {
        const id = p.id.match(/\/(\d+)$/)?.[1] || p.id;
        return [id, p];
      })
    );

    // Process each product
    for (const productId of job.operation.productIds) {
      const product = productsMap.get(productId);

      if (!product) {
        job.results.push({
          productId,
          productTitle: 'Unknown',
          status: 'error',
          error: 'Product not found',
        });
        job.progress.failed++;
        job.progress.completed++;
        continue;
      }

      try {
        const result = await processProductEdit(
          job.shopDomain,
          productId,
          product,
          job.operation
        );
        job.results.push(result);

        if (result.status === 'success') {
          job.progress.succeeded++;
        } else if (result.status === 'error') {
          job.progress.failed++;
        }
      } catch (error) {
        job.results.push({
          productId,
          productTitle: product.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        job.progress.failed++;
      }

      job.progress.completed++;
    }

    job.status = 'completed';
    job.completedAt = new Date().toISOString();

    // Log the job completion
    const shop = await prisma.shop.findUnique({
      where: { shopDomain: job.shopDomain },
      select: { id: true },
    });

    if (shop) {
      await prisma.auditLog.create({
        data: {
          shopId: shop.id,
          action: 'bulk_edit_completed',
          details: {
            jobId: job.id,
            operation: job.operation.type,
            total: job.progress.total,
            succeeded: job.progress.succeeded,
            failed: job.progress.failed,
          },
        },
      });
    }

    logger.info(
      { jobId, succeeded: job.progress.succeeded, failed: job.progress.failed },
      'Bulk edit job completed'
    );

    return job;
  } catch (error) {
    job.status = 'failed';
    job.completedAt = new Date().toISOString();

    logger.error({ error, jobId }, 'Bulk edit job failed');
    throw error;
  }
}

/**
 * Process a single product edit
 */
async function processProductEdit(
  shopDomain: string,
  productId: string,
  product: {
    id: string;
    title: string;
    handle: string;
    description: string | null;
    descriptionHtml: string | null;
    seo: { title: string | null; description: string | null };
    images: { nodes: Array<{ url: string; altText: string | null }> };
    vendor: string | null;
    productType: string | null;
  },
  operation: BulkEditOperation
): Promise<BulkEditResult> {
  const changes: BulkEditResult['changes'] = [];

  switch (operation.type) {
    case 'alt_text': {
      // Skip if all images already have alt text and skipIfExists is true
      if (operation.options?.skipIfExists) {
        const allHaveAlt = product.images.nodes.every(img => img.altText && img.altText.length > 0);
        if (allHaveAlt) {
          return {
            productId,
            productTitle: product.title,
            status: 'skipped',
          };
        }
      }

      // Generate ALT text suggestions
      const suggestions = await generateAltTextSuggestions(
        shopDomain,
        productId,
        {
          title: product.title,
          description: product.description || '',
          productType: product.productType || undefined,
          vendor: product.vendor || undefined,
          images: product.images.nodes.map(img => ({
            url: img.url,
            altText: img.altText,
          })),
        }
      );

      // Apply if automatic mode
      if (operation.options?.applyAutomatically) {
        for (const suggestion of suggestions.suggestions) {
          if (!suggestion.originalAlt || suggestion.originalAlt.length === 0) {
            changes.push({
              field: 'alt_text',
              before: suggestion.originalAlt,
              after: suggestion.suggestedAlt,
            });
          }
        }
      } else {
        // Just return suggestions without applying
        for (const suggestion of suggestions.suggestions) {
          changes.push({
            field: 'alt_text_suggestion',
            before: suggestion.originalAlt,
            after: suggestion.suggestedAlt,
          });
        }
      }

      return {
        productId,
        productTitle: product.title,
        status: changes.length > 0 ? 'success' : 'skipped',
        changes,
      };
    }

    case 'meta_tags': {
      // Skip if SEO fields already exist and skipIfExists is true
      if (operation.options?.skipIfExists) {
        if (product.seo.title && product.seo.description) {
          return {
            productId,
            productTitle: product.title,
            status: 'skipped',
          };
        }
      }

      // Generate meta tags suggestions
      const suggestions = await generateMetaTagsSuggestions(
        shopDomain,
        productId,
        {
          title: product.title,
          description: product.description || '',
          productType: product.productType || undefined,
          vendor: product.vendor || undefined,
          seoTitle: product.seo.title || undefined,
          seoDescription: product.seo.description || undefined,
        }
      );

      // Apply if automatic mode
      if (operation.options?.applyAutomatically && suggestions.suggestions.seoTitle) {
        // Would apply via Shopify API here
        changes.push({
          field: 'seo_title',
          before: product.seo.title,
          after: suggestions.suggestions.seoTitle.suggested,
        });
      }

      if (operation.options?.applyAutomatically && suggestions.suggestions.seoDescription) {
        changes.push({
          field: 'seo_description',
          before: product.seo.description,
          after: suggestions.suggestions.seoDescription.suggested,
        });
      }

      return {
        productId,
        productTitle: product.title,
        status: changes.length > 0 ? 'success' : 'skipped',
        changes,
      };
    }

    default:
      return {
        productId,
        productTitle: product.title,
        status: 'error',
        error: `Unknown operation type: ${operation.type}`,
      };
  }
}

/**
 * Get bulk edit statistics for a shop
 */
export async function getBulkEditStats(shopDomain: string): Promise<{
  totalJobs: number;
  completedJobs: number;
  totalProductsProcessed: number;
  successRate: number;
  recentJobs: BulkEditJob[];
}> {
  const shopJobs = getShopBulkEditJobs(shopDomain);

  const completedJobs = shopJobs.filter(j => j.status === 'completed');
  const totalProcessed = completedJobs.reduce((sum, j) => sum + j.progress.total, 0);
  const totalSucceeded = completedJobs.reduce((sum, j) => sum + j.progress.succeeded, 0);

  return {
    totalJobs: shopJobs.length,
    completedJobs: completedJobs.length,
    totalProductsProcessed: totalProcessed,
    successRate: totalProcessed > 0 ? Math.round((totalSucceeded / totalProcessed) * 100) : 0,
    recentJobs: shopJobs.slice(0, 10),
  };
}

/**
 * Cancel a pending bulk edit job
 */
export function cancelBulkEditJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'pending') {
    return false;
  }

  jobs.delete(jobId);
  return true;
}

/**
 * Clean up old jobs (older than 24 hours)
 */
export function cleanupOldJobs(): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const [id, job] of jobs.entries()) {
    if (new Date(job.createdAt).getTime() < cutoff) {
      jobs.delete(id);
      removed++;
    }
  }

  return removed;
}

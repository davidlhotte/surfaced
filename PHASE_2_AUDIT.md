# 🤖 PROMPT CLAUDE CODE - PHASE 2 : AUDIT ENGINE
## Système d'audit des produits pour AI Readiness

---

## CONTEXTE

Phase 1 complétée : projet setup, auth Shopify, database Supabase.

**Objectif Phase 2** : Créer le moteur d'audit qui analyse les produits Shopify et calcule un score AI-readiness.

---

## FICHIERS À CRÉER

### 1. lib/audit/rules.ts - Règles d'audit

```typescript
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface AuditIssue {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  message: string;
  recommendation: string;
}

const stripHtml = (html: string | null): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

export const auditRules = [
  // CRITICAL - bloquants pour l'AI
  {
    id: 'no_description',
    name: 'Missing Description',
    severity: 'critical' as Severity,
    check: (product: any): AuditIssue | null => {
      const desc = stripHtml(product.body_html);
      if (!desc || desc.length < 10) {
        return {
          ruleId: 'no_description',
          ruleName: 'Missing Description',
          severity: 'critical',
          message: 'No description. AI cannot recommend this product.',
          recommendation: 'Add a detailed description (100+ chars) with features and benefits.'
        };
      }
      return null;
    }
  },
  {
    id: 'no_images',
    name: 'No Images',
    severity: 'critical' as Severity,
    check: (product: any): AuditIssue | null => {
      if (!product.images?.length) {
        return {
          ruleId: 'no_images',
          ruleName: 'No Images',
          severity: 'critical',
          message: 'Products without images are rarely recommended.',
          recommendation: 'Add at least one high-quality product image.'
        };
      }
      return null;
    }
  },
  
  // HIGH - importants
  {
    id: 'short_description',
    name: 'Short Description',
    severity: 'high' as Severity,
    check: (product: any): AuditIssue | null => {
      const desc = stripHtml(product.body_html);
      if (desc && desc.length >= 10 && desc.length < 100) {
        return {
          ruleId: 'short_description',
          ruleName: 'Short Description',
          severity: 'high',
          message: `Only ${desc.length} chars. AI needs more context.`,
          recommendation: 'Expand to 100+ chars with features, materials, use cases.'
        };
      }
      return null;
    }
  },
  {
    id: 'no_product_type',
    name: 'Missing Product Type',
    severity: 'high' as Severity,
    check: (product: any): AuditIssue | null => {
      if (!product.product_type) {
        return {
          ruleId: 'no_product_type',
          ruleName: 'Missing Product Type',
          severity: 'high',
          message: 'Product type helps AI categorize your product.',
          recommendation: 'Set a product type (e.g., "Running Shoes", "T-Shirt").'
        };
      }
      return null;
    }
  },
  {
    id: 'no_vendor',
    name: 'Missing Brand/Vendor',
    severity: 'high' as Severity,
    check: (product: any): AuditIssue | null => {
      if (!product.vendor) {
        return {
          ruleId: 'no_vendor',
          ruleName: 'Missing Brand/Vendor',
          severity: 'high',
          message: 'Brand is important for AI recommendations.',
          recommendation: 'Set the vendor field to your brand name.'
        };
      }
      return null;
    }
  },
  
  // MEDIUM
  {
    id: 'no_tags',
    name: 'No Tags',
    severity: 'medium' as Severity,
    check: (product: any): AuditIssue | null => {
      if (!product.tags || product.tags.length === 0) {
        return {
          ruleId: 'no_tags',
          ruleName: 'No Tags',
          severity: 'medium',
          message: 'Tags help AI understand product attributes.',
          recommendation: 'Add tags: color, size, material, use case, etc.'
        };
      }
      return null;
    }
  },
  {
    id: 'single_image',
    name: 'Only One Image',
    severity: 'medium' as Severity,
    check: (product: any): AuditIssue | null => {
      if (product.images?.length === 1) {
        return {
          ruleId: 'single_image',
          ruleName: 'Only One Image',
          severity: 'medium',
          message: 'Multiple images improve product understanding.',
          recommendation: 'Add 2-4 images showing different angles.'
        };
      }
      return null;
    }
  },
  
  // LOW
  {
    id: 'no_sku',
    name: 'Missing SKU',
    severity: 'low' as Severity,
    check: (product: any): AuditIssue | null => {
      const hasSkus = product.variants?.every((v: any) => v.sku);
      if (!hasSkus) {
        return {
          ruleId: 'no_sku',
          ruleName: 'Missing SKU',
          severity: 'low',
          message: 'SKUs help with inventory tracking and feed accuracy.',
          recommendation: 'Add SKUs to all variants.'
        };
      }
      return null;
    }
  }
];
```

### 2. lib/audit/scanner.ts - Moteur d'audit

```typescript
import { auditRules, AuditIssue, Severity } from './rules';
import { supabaseAdmin } from '@/lib/supabase';

interface ProductAuditResult {
  shopify_product_id: number;
  title: string;
  handle: string;
  ai_score: number;
  issues: AuditIssue[];
  has_images: boolean;
  has_description: boolean;
  description_length: number;
}

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 40,
  high: 25,
  medium: 15,
  low: 5
};

export function auditProduct(product: any): ProductAuditResult {
  const issues: AuditIssue[] = [];
  
  // Run all rules
  for (const rule of auditRules) {
    const issue = rule.check(product);
    if (issue) {
      issues.push(issue);
    }
  }
  
  // Calculate score
  const ai_score = calculateScore(issues);
  
  // Extract metadata
  const description = product.body_html?.replace(/<[^>]*>/g, '').trim() || '';
  
  return {
    shopify_product_id: product.id,
    title: product.title,
    handle: product.handle,
    ai_score,
    issues,
    has_images: (product.images?.length || 0) > 0,
    has_description: description.length >= 10,
    description_length: description.length
  };
}

function calculateScore(issues: AuditIssue[]): number {
  // Max possible deduction
  const maxDeduction = Object.values(SEVERITY_WEIGHTS).reduce((a, b) => a + b, 0) * 2;
  
  // Actual deductions
  let deductions = 0;
  for (const issue of issues) {
    deductions += SEVERITY_WEIGHTS[issue.severity];
  }
  
  // Score (100 - percentage deducted)
  const score = Math.max(0, Math.round(100 - (deductions / maxDeduction) * 100));
  return score;
}

export async function runFullAudit(
  storeId: string, 
  products: any[]
): Promise<{ avgScore: number; totalProducts: number; issuesSummary: Record<string, number> }> {
  const results: ProductAuditResult[] = [];
  const issuesSummary: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  for (const product of products) {
    const result = auditProduct(product);
    results.push(result);
    
    // Count issues by severity
    for (const issue of result.issues) {
      issuesSummary[issue.severity]++;
    }
  }
  
  // Save to database
  for (const result of results) {
    await supabaseAdmin
      .from('products_audit')
      .upsert({
        store_id: storeId,
        shopify_product_id: result.shopify_product_id,
        title: result.title,
        handle: result.handle,
        ai_score: result.ai_score,
        issues: result.issues,
        has_images: result.has_images,
        has_description: result.has_description,
        description_length: result.description_length,
        last_audit_at: new Date().toISOString()
      }, {
        onConflict: 'store_id,shopify_product_id'
      });
  }
  
  // Calculate average score
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.ai_score, 0) / results.length)
    : 0;
  
  // Update store with average score
  await supabaseAdmin
    .from('stores')
    .update({ 
      ai_score: avgScore,
      products_count: products.length,
      last_audit_at: new Date().toISOString()
    })
    .eq('id', storeId);
  
  return {
    avgScore,
    totalProducts: results.length,
    issuesSummary
  };
}
```

### 3. app/api/audit/start/route.ts - API endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getStoreByDomain } from '@/lib/supabase';
import { fetchAllProducts } from '@/lib/shopify/products';
import { runFullAudit } from '@/lib/audit/scanner';

export async function POST(request: NextRequest) {
  try {
    // Get shop from header (set by middleware)
    const shop = request.headers.get('X-Shopify-Shop');
    if (!shop) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get store from DB
    const store = await getStoreByDomain(shop);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    
    // Fetch products
    const products = await fetchAllProducts(store);
    
    // Run audit
    const result = await runFullAudit(store.id, products);
    
    return NextResponse.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'Failed to run audit' },
      { status: 500 }
    );
  }
}
```

### 4. Composants UI Dashboard

Voir fichier PHASE_2_COMPONENTS.md pour les composants Polaris.

---

## CRITÈRES DE VALIDATION

✅ Les produits sont récupérés depuis Shopify
✅ Chaque produit est audité avec toutes les règles
✅ Le score est calculé correctement (0-100)
✅ Les résultats sont sauvegardés en DB
✅ Le dashboard affiche le score et les issues

---

*Passe à PHASE_3_LLMS_TXT.md une fois validé*

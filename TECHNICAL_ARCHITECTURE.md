# 🏗️ ARCHITECTURE TECHNIQUE
## AI Visibility - Shopify App

---

## 📁 STRUCTURE DU PROJET

```
ai-visibility/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout avec Polaris provider
│   ├── page.tsx                 # Dashboard principal
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts    # OAuth callback
│   │   ├── webhooks/
│   │   │   ├── app-uninstalled/route.ts
│   │   │   ├── gdpr/
│   │   │   │   ├── customers-redact/route.ts
│   │   │   │   ├── customers-data-request/route.ts
│   │   │   │   └── shop-redact/route.ts
│   │   ├── billing/
│   │   │   ├── create/route.ts
│   │   │   └── callback/route.ts
│   │   ├── audit/
│   │   │   ├── start/route.ts
│   │   │   └── status/route.ts
│   │   ├── visibility/
│   │   │   ├── check/route.ts
│   │   │   └── history/route.ts
│   │   └── llms-txt/
│   │       ├── generate/route.ts
│   │       └── serve/route.ts
│   ├── audit/
│   │   └── page.tsx             # Détails de l'audit
│   ├── visibility/
│   │   └── page.tsx             # Visibility tracking
│   ├── competitors/
│   │   └── page.tsx             # Suivi concurrents
│   ├── settings/
│   │   └── page.tsx             # Configuration
│   └── onboarding/
│       └── page.tsx             # Flow premier lancement
├── components/
│   ├── layout/
│   │   ├── AppFrame.tsx         # Frame Polaris avec navigation
│   │   └── Navigation.tsx       # Menu latéral
│   ├── dashboard/
│   │   ├── ScoreCard.tsx        # Affichage du score AI
│   │   ├── RecentChecks.tsx     # Derniers visibility checks
│   │   └── AlertsPanel.tsx      # Alertes et notifications
│   ├── audit/
│   │   ├── AuditProgress.tsx    # Barre de progression
│   │   ├── IssuesList.tsx       # Liste des problèmes
│   │   └── ProductCard.tsx      # Détail produit audité
│   ├── visibility/
│   │   ├── QueryInput.tsx       # Saisie des queries
│   │   ├── ResultCard.tsx       # Résultat d'un check
│   │   └── PlatformBadge.tsx    # Badge ChatGPT/Perplexity
│   └── common/
│       ├── LoadingState.tsx
│       ├── EmptyState.tsx
│       └── ErrorBanner.tsx
├── lib/
│   ├── shopify/
│   │   ├── client.ts            # Shopify API client
│   │   ├── session.ts           # Session token handling
│   │   ├── billing.ts           # Billing helpers
│   │   └── webhooks.ts          # Webhook verification
│   ├── supabase/
│   │   ├── client.ts            # Supabase client
│   │   ├── types.ts             # Types générés
│   │   └── queries.ts           # Fonctions utilitaires
│   ├── audit/
│   │   ├── scanner.ts           # Logic de scan produits
│   │   ├── scoring.ts           # Calcul du score
│   │   └── rules.ts             # Règles d'audit
│   ├── visibility/
│   │   ├── checker.ts           # Logic de check AI
│   │   ├── parsers.ts           # Parsers de réponses AI
│   │   └── platforms.ts         # Config par plateforme
│   ├── llms-txt/
│   │   ├── generator.ts         # Génération du fichier
│   │   └── templates.ts         # Templates llms.txt
│   └── utils/
│       ├── crypto.ts            # Encryption tokens
│       └── helpers.ts           # Fonctions diverses
├── hooks/
│   ├── useShopify.ts            # Hook contexte Shopify
│   ├── useAudit.ts              # Hook données audit
│   ├── useVisibility.ts         # Hook visibility checks
│   └── useBilling.ts            # Hook état billing
├── types/
│   ├── shopify.ts               # Types Shopify
│   ├── audit.ts                 # Types audit
│   ├── visibility.ts            # Types visibility
│   └── database.ts              # Types DB
├── public/
│   └── ... assets
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.js
└── shopify.app.toml              # Config Shopify CLI
```

---

## 🔧 CONFIGURATION

### Variables d'environnement (.env.local)

```bash
# Shopify App
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,read_content,write_content
SHOPIFY_APP_URL=https://your-app.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI (pour visibility checks)
OPENAI_API_KEY=your_openai_key

# Encryption
ENCRYPTION_KEY=32_char_random_string

# Environment
NODE_ENV=development
```

### shopify.app.toml

```toml
name = "AI Visibility"
client_id = "your_client_id"

[access_scopes]
scopes = "read_products,read_content,write_content"

[auth]
redirect_urls = [
  "https://your-app.vercel.app/api/auth/callback"
]

[webhooks]
api_version = "2024-01"

[[webhooks.subscriptions]]
topics = ["app/uninstalled"]
uri = "/api/webhooks/app-uninstalled"

[[webhooks.subscriptions]]
topics = ["customers/redact"]
uri = "/api/webhooks/gdpr/customers-redact"
compliance_topics = ["customers/redact"]

[[webhooks.subscriptions]]
topics = ["customers/data_request"]
uri = "/api/webhooks/gdpr/customers-data-request"
compliance_topics = ["customers/data_request"]

[[webhooks.subscriptions]]
topics = ["shop/redact"]
uri = "/api/webhooks/gdpr/shop-redact"
compliance_topics = ["shop/redact"]

[app_proxy]
url = "/api/llms-txt/serve"
subpath = "llms"
prefix = "apps"
```

---

## 💾 SCHÉMA BASE DE DONNÉES (Supabase)

### Migration initiale

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_domain VARCHAR(255) UNIQUE NOT NULL,
  shopify_access_token TEXT NOT NULL, -- Encrypted
  shop_name VARCHAR(255),
  shop_email VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'trial', -- trial, starter, growth, scale
  plan_started_at TIMESTAMPTZ,
  products_count INTEGER DEFAULT 0,
  ai_score INTEGER, -- 0-100
  last_audit_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products audit cache
CREATE TABLE products_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_product_id BIGINT NOT NULL,
  title VARCHAR(500),
  handle VARCHAR(255),
  ai_score INTEGER, -- 0-100 pour ce produit
  issues JSONB DEFAULT '[]',
  -- Issues structure: [{ type: 'missing_description', severity: 'high', message: '...' }]
  has_images BOOLEAN DEFAULT false,
  has_description BOOLEAN DEFAULT false,
  has_metafields BOOLEAN DEFAULT false,
  description_length INTEGER DEFAULT 0,
  last_audit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, shopify_product_id)
);

-- Visibility checks
CREATE TABLE visibility_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- chatgpt, perplexity, gemini, copilot
  query TEXT NOT NULL,
  is_mentioned BOOLEAN,
  mention_context TEXT, -- Extrait où la marque est mentionnée
  position INTEGER, -- Position dans les recommandations si applicable
  competitors_found JSONB DEFAULT '[]', -- [{ name: 'Brand X', url: '...' }]
  raw_response TEXT, -- Réponse complète (pour debug)
  response_quality VARCHAR(20), -- good, partial, none
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors tracking
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, domain)
);

-- llms.txt configuration
CREATE TABLE llms_txt_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  allowed_bots JSONB DEFAULT '["ChatGPT-User", "GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]',
  include_products BOOLEAN DEFAULT true,
  include_collections BOOLEAN DEFAULT true,
  include_blog BOOLEAN DEFAULT false,
  excluded_product_ids JSONB DEFAULT '[]',
  custom_instructions TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs (pour historique)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_audit_store ON products_audit(store_id);
CREATE INDEX idx_visibility_checks_store ON visibility_checks(store_id);
CREATE INDEX idx_visibility_checks_platform ON visibility_checks(platform);
CREATE INDEX idx_visibility_checks_date ON visibility_checks(checked_at DESC);

-- Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE llms_txt_configs ENABLE ROW LEVEL SECURITY;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER llms_txt_configs_updated_at
  BEFORE UPDATE ON llms_txt_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## 🔐 AUTHENTIFICATION SHOPIFY

### Flow OAuth

```typescript
// lib/shopify/session.ts
import { shopifyApp } from "@shopify/shopify-app-remix/server";

export const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(","),
  appUrl: process.env.SHOPIFY_APP_URL!,
  authPathPrefix: "/api/auth",
  sessionStorage: new CustomSessionStorage(), // Supabase-backed
});
```

### Session Token Validation

```typescript
// middleware.ts
import { verifySessionToken } from "@shopify/shopify-app-session-storage";

export async function middleware(request: NextRequest) {
  const sessionToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  
  if (!sessionToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  try {
    const payload = await verifySessionToken(sessionToken, {
      apiKey: process.env.SHOPIFY_API_KEY!,
      apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    });
    
    // Attach shop to request
    request.headers.set("X-Shopify-Shop", payload.dest);
    return NextResponse.next();
  } catch (error) {
    return new NextResponse("Invalid session", { status: 401 });
  }
}
```

---

## 🔍 ENGINE D'AUDIT

### Règles d'audit (lib/audit/rules.ts)

```typescript
export interface AuditRule {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'content' | 'structure' | 'media' | 'seo';
  check: (product: ShopifyProduct) => AuditResult;
}

export const auditRules: AuditRule[] = [
  {
    id: 'missing_description',
    name: 'Missing product description',
    severity: 'critical',
    category: 'content',
    check: (product) => ({
      passed: product.body_html && product.body_html.length > 50,
      message: 'Product needs a description of at least 50 characters for AI to understand it',
      recommendation: 'Add a detailed description explaining the product benefits, features, and use cases'
    })
  },
  {
    id: 'short_title',
    name: 'Title too short',
    severity: 'high',
    category: 'content',
    check: (product) => ({
      passed: product.title.length >= 20,
      message: 'Title should be at least 20 characters',
      recommendation: 'Include brand, product type, and key features in the title'
    })
  },
  {
    id: 'no_images',
    name: 'No product images',
    severity: 'critical',
    category: 'media',
    check: (product) => ({
      passed: product.images && product.images.length > 0,
      message: 'Products without images cannot be effectively recommended by AI',
      recommendation: 'Add at least one high-quality product image'
    })
  },
  {
    id: 'missing_product_type',
    name: 'Missing product type',
    severity: 'high',
    category: 'structure',
    check: (product) => ({
      passed: !!product.product_type,
      message: 'Product type helps AI categorize your product correctly',
      recommendation: 'Set a product type that describes the category'
    })
  },
  {
    id: 'no_tags',
    name: 'No product tags',
    severity: 'medium',
    category: 'structure',
    check: (product) => ({
      passed: product.tags && product.tags.length > 0,
      message: 'Tags help AI understand product attributes',
      recommendation: 'Add relevant tags like color, size, material, use case'
    })
  },
  {
    id: 'missing_vendor',
    name: 'Missing vendor/brand',
    severity: 'medium',
    category: 'structure',
    check: (product) => ({
      passed: !!product.vendor,
      message: 'Brand information helps AI recommend your products',
      recommendation: 'Set the vendor field to your brand name'
    })
  },
  {
    id: 'no_variants_data',
    name: 'Variants missing key data',
    severity: 'medium',
    category: 'structure',
    check: (product) => {
      const variants = product.variants || [];
      const hasCompleteVariants = variants.every(v => 
        v.price && v.sku && v.inventory_quantity !== undefined
      );
      return {
        passed: hasCompleteVariants,
        message: 'Some variants are missing price, SKU, or inventory data',
        recommendation: 'Ensure all variants have complete information'
      };
    }
  }
];
```

### Calcul du score (lib/audit/scoring.ts)

```typescript
export function calculateAIScore(auditResults: AuditResult[]): number {
  const weights = {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5
  };
  
  let totalWeight = 0;
  let earnedWeight = 0;
  
  auditResults.forEach(result => {
    const rule = auditRules.find(r => r.id === result.ruleId);
    if (rule) {
      totalWeight += weights[rule.severity];
      if (result.passed) {
        earnedWeight += weights[rule.severity];
      }
    }
  });
  
  return Math.round((earnedWeight / totalWeight) * 100);
}
```

---

## 🤖 VISIBILITY CHECKER

### Implementation ChatGPT (lib/visibility/checker.ts)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function checkVisibility(
  query: string,
  brandName: string,
  productKeywords: string[]
): Promise<VisibilityResult> {
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'user',
        content: query
      }
    ],
    // Enable web browsing if available
    tools: [{ type: 'web_search' }],
    tool_choice: 'auto'
  });
  
  const content = response.choices[0].message.content || '';
  
  // Parse the response
  const isMentioned = checkIfMentioned(content, brandName, productKeywords);
  const competitors = extractCompetitors(content, brandName);
  const context = extractMentionContext(content, brandName);
  
  return {
    platform: 'chatgpt',
    query,
    isMentioned,
    mentionContext: context,
    competitorsFound: competitors,
    rawResponse: content,
    checkedAt: new Date()
  };
}

function checkIfMentioned(
  content: string, 
  brandName: string, 
  keywords: string[]
): boolean {
  const lowerContent = content.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  
  // Check for brand name
  if (lowerContent.includes(lowerBrand)) {
    return true;
  }
  
  // Check for product-specific keywords
  const keywordMatches = keywords.filter(kw => 
    lowerContent.includes(kw.toLowerCase())
  );
  
  return keywordMatches.length >= 2; // At least 2 keywords match
}

function extractCompetitors(content: string, excludeBrand: string): Competitor[] {
  // Pattern to find brand names mentioned with products
  const brandPatterns = [
    /(?:recommend|suggest|try|check out|consider)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    /([A-Z][a-z]+(?:'s)?)\s+(?:offers?|sells?|has|makes?)/g
  ];
  
  const competitors: Set<string> = new Set();
  
  brandPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const brand = match[1].trim();
      if (brand.toLowerCase() !== excludeBrand.toLowerCase()) {
        competitors.add(brand);
      }
    }
  });
  
  return Array.from(competitors).map(name => ({ name }));
}
```

---

## 📄 GÉNÉRATEUR llms.txt

### Template (lib/llms-txt/generator.ts)

```typescript
export async function generateLlmsTxt(
  store: Store,
  config: LlmsTxtConfig,
  products: Product[],
  collections: Collection[]
): Promise<string> {
  
  const lines: string[] = [];
  
  // Header
  lines.push(`# ${store.shop_name}`);
  lines.push(`# AI-friendly store information`);
  lines.push(`# Generated by AI Visibility for Shopify`);
  lines.push('');
  
  // Store info
  lines.push(`> ${store.shop_name} is an online store selling ${getMainCategories(products).join(', ')}.`);
  lines.push('');
  
  // Products section
  if (config.include_products) {
    lines.push('## Products');
    lines.push('');
    
    products
      .filter(p => !config.excluded_product_ids.includes(p.id))
      .slice(0, 500) // Limit for performance
      .forEach(product => {
        lines.push(`- [${product.title}](${store.shopify_domain}/products/${product.handle}): ${truncate(stripHtml(product.body_html), 150)}`);
      });
    
    lines.push('');
  }
  
  // Collections section
  if (config.include_collections) {
    lines.push('## Collections');
    lines.push('');
    
    collections.forEach(collection => {
      lines.push(`- [${collection.title}](${store.shopify_domain}/collections/${collection.handle}): ${truncate(stripHtml(collection.body_html), 100)}`);
    });
    
    lines.push('');
  }
  
  // Custom instructions
  if (config.custom_instructions) {
    lines.push('## Additional Information');
    lines.push('');
    lines.push(config.custom_instructions);
    lines.push('');
  }
  
  // Footer
  lines.push('---');
  lines.push(`Last updated: ${new Date().toISOString()}`);
  
  return lines.join('\n');
}
```

---

## 🧪 TESTS ESSENTIELS

### Tests à implémenter

```typescript
// __tests__/audit.test.ts
describe('AI Audit Engine', () => {
  test('calculates correct score for complete product', () => {
    const product = mockCompleteProduct();
    const score = runAudit(product);
    expect(score).toBeGreaterThan(80);
  });
  
  test('flags missing description', () => {
    const product = mockProductWithoutDescription();
    const results = runAudit(product);
    expect(results.issues).toContainEqual(
      expect.objectContaining({ id: 'missing_description' })
    );
  });
});

// __tests__/visibility.test.ts
describe('Visibility Checker', () => {
  test('detects brand mention in response', () => {
    const response = 'I recommend checking out Nike for running shoes...';
    const result = checkIfMentioned(response, 'Nike', ['running', 'shoes']);
    expect(result).toBe(true);
  });
  
  test('extracts competitors correctly', () => {
    const response = 'Consider Adidas, Asics, or Brooks for your needs.';
    const competitors = extractCompetitors(response, 'Nike');
    expect(competitors).toHaveLength(3);
  });
});
```

---

*Document technique - Version 1.0*
*À utiliser avec Claude Code pour l'implémentation*

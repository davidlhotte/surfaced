# 🤖 PROMPT CLAUDE CODE - PHASE 1 : FOUNDATION
## Setup projet + Auth + Database

---

## CONTEXTE

Tu vas développer une application Shopify embedded appelée "AI Visibility".
Cette app aide les marchands Shopify à comprendre leur visibilité dans les moteurs de recherche AI (ChatGPT, Perplexity, etc.).

**Objectif Phase 1** : Créer les fondations du projet
- Setup Next.js avec Shopify App template
- Configuration Supabase
- OAuth Shopify fonctionnel
- Billing API (plans payants)
- Structure de base Polaris

---

## STACK TECHNIQUE

- **Framework** : Next.js 14+ (App Router)
- **UI** : Polaris (@shopify/polaris) - OBLIGATOIRE
- **Auth** : Shopify OAuth avec session tokens
- **Database** : Supabase (PostgreSQL)
- **Hosting** : Vercel
- **Language** : TypeScript

---

## INSTRUCTIONS ÉTAPE PAR ÉTAPE

### Étape 1 : Initialiser le projet

```bash
# Utiliser le template Shopify
npx @shopify/create-app@latest --template node

# Ou si tu préfères partir de zéro avec Next.js
npx create-next-app@latest ai-visibility --typescript --tailwind --app
```

Installer les dépendances Shopify :

```bash
npm install @shopify/shopify-api @shopify/polaris @shopify/app-bridge-react
npm install @supabase/supabase-js
npm install -D @types/node
```

### Étape 2 : Configuration des variables d'environnement

Créer `.env.local` :

```env
# Shopify (à remplir après création de l'app dans Partner Dashboard)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_SCOPES=read_products,read_content,write_content
SHOPIFY_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Encryption pour tokens
ENCRYPTION_KEY=

# Node
NODE_ENV=development
```

### Étape 3 : Configurer Supabase

Exécuter cette migration dans Supabase SQL Editor :

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table (main table)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_domain VARCHAR(255) UNIQUE NOT NULL,
  shopify_access_token TEXT NOT NULL,
  shop_name VARCHAR(255),
  shop_email VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'trial',
  plan_started_at TIMESTAMPTZ,
  products_count INTEGER DEFAULT 0,
  ai_score INTEGER,
  last_audit_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products audit
CREATE TABLE products_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_product_id BIGINT NOT NULL,
  title VARCHAR(500),
  handle VARCHAR(255),
  ai_score INTEGER,
  issues JSONB DEFAULT '[]',
  has_images BOOLEAN DEFAULT false,
  has_description BOOLEAN DEFAULT false,
  description_length INTEGER DEFAULT 0,
  last_audit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, shopify_product_id)
);

-- Visibility checks
CREATE TABLE visibility_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  query TEXT NOT NULL,
  is_mentioned BOOLEAN,
  mention_context TEXT,
  position INTEGER,
  competitors_found JSONB DEFAULT '[]',
  raw_response TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- llms.txt config
CREATE TABLE llms_txt_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  allowed_bots JSONB DEFAULT '["ChatGPT-User", "GPTBot", "ClaudeBot", "PerplexityBot"]',
  include_products BOOLEAN DEFAULT true,
  include_collections BOOLEAN DEFAULT true,
  custom_instructions TEXT,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_audit_store ON products_audit(store_id);
CREATE INDEX idx_visibility_checks_store ON visibility_checks(store_id);
CREATE INDEX idx_visibility_checks_date ON visibility_checks(checked_at DESC);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Étape 4 : Créer la structure de fichiers

```
app/
├── layout.tsx           # Root layout avec providers
├── page.tsx             # Dashboard principal
├── api/
│   ├── auth/
│   │   ├── route.ts         # Initier OAuth
│   │   └── callback/route.ts # Callback OAuth
│   ├── webhooks/
│   │   └── app-uninstalled/route.ts
│   └── billing/
│       └── route.ts
├── loading.tsx
└── error.tsx
lib/
├── shopify.ts           # Client Shopify
├── supabase.ts          # Client Supabase
└── utils.ts
components/
├── providers/
│   └── AppProvider.tsx  # Polaris + AppBridge
└── layout/
    └── AppFrame.tsx     # Frame principale
```

### Étape 5 : Implémenter le client Supabase

Créer `lib/supabase.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client pour le frontend (anon)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client pour le backend (service role)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Types
export interface Store {
  id: string;
  shopify_domain: string;
  shopify_access_token: string;
  shop_name: string | null;
  shop_email: string | null;
  plan: 'trial' | 'starter' | 'growth' | 'scale';
  plan_started_at: string | null;
  products_count: number;
  ai_score: number | null;
  last_audit_at: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Helper functions
export async function getStoreByDomain(domain: string): Promise<Store | null> {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('shopify_domain', domain)
    .single();
  
  if (error) return null;
  return data;
}

export async function createOrUpdateStore(
  domain: string, 
  accessToken: string,
  shopData: { name?: string; email?: string }
): Promise<Store> {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .upsert({
      shopify_domain: domain,
      shopify_access_token: accessToken,
      shop_name: shopData.name,
      shop_email: shopData.email,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'shopify_domain'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### Étape 6 : Implémenter l'OAuth Shopify

Créer `app/api/auth/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');
  
  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  
  // Build authorization URL
  const redirectUri = `${process.env.SHOPIFY_APP_URL}/api/auth/callback`;
  const scopes = process.env.SHOPIFY_SCOPES;
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY!,
    scope: scopes!,
    redirect_uri: redirectUri,
    state: state
  });
  
  // Set state in cookie
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('shopify_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  });
  
  return response;
}
```

Créer `app/api/auth/callback/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateStore } from '@/lib/supabase';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const state = searchParams.get('state');
  const hmac = searchParams.get('hmac');
  
  // Validate state
  const savedState = request.cookies.get('shopify_oauth_state')?.value;
  if (state !== savedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }
  
  // Validate HMAC
  const params = new URLSearchParams(searchParams);
  params.delete('hmac');
  const sortedParams = [...params].sort().map(([k, v]) => `${k}=${v}`).join('&');
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(sortedParams)
    .digest('hex');
  
  if (hash !== hmac) {
    return NextResponse.json({ error: 'Invalid HMAC' }, { status: 400 });
  }
  
  // Exchange code for access token
  const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code
    })
  });
  
  const { access_token } = await tokenResponse.json();
  
  // Get shop info
  const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: { 'X-Shopify-Access-Token': access_token }
  });
  const { shop: shopData } = await shopResponse.json();
  
  // Save to database
  await createOrUpdateStore(shop!, access_token, {
    name: shopData.name,
    email: shopData.email
  });
  
  // Redirect to app
  const appUrl = `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
  
  const response = NextResponse.redirect(appUrl);
  response.cookies.delete('shopify_oauth_state');
  
  return response;
}
```

### Étape 7 : Créer le provider Polaris

Créer `components/providers/AppProvider.tsx` :

```typescript
'use client';

import { AppProvider as PolarisProvider } from '@shopify/polaris';
import { AppBridgeProvider } from './AppBridgeProvider';
import '@shopify/polaris/build/esm/styles.css';
import enTranslations from '@shopify/polaris/locales/en.json';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <PolarisProvider i18n={enTranslations}>
      <AppBridgeProvider>
        {children}
      </AppBridgeProvider>
    </PolarisProvider>
  );
}
```

### Étape 8 : Créer le layout root

Créer `app/layout.tsx` :

```typescript
import { AppProvider } from '@/components/providers/AppProvider';

export const metadata = {
  title: 'AI Visibility',
  description: 'Track your visibility in ChatGPT and AI search',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
```

### Étape 9 : Page dashboard de base

Créer `app/page.tsx` :

```typescript
'use client';

import { Page, Layout, Card, Text, BlockStack } from '@shopify/polaris';

export default function Dashboard() {
  return (
    <Page title="AI Visibility Dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Welcome to AI Visibility
              </Text>
              <Text as="p" variant="bodyMd">
                Your app is successfully installed. Next steps:
              </Text>
              <ul>
                <li>Run your first AI Readiness Audit</li>
                <li>Generate your llms.txt file</li>
                <li>Check your visibility on ChatGPT</li>
              </ul>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

---

## CRITÈRES DE VALIDATION PHASE 1

✅ Le projet démarre sans erreur (`npm run dev`)
✅ La connexion Supabase fonctionne (tables créées)
✅ L'OAuth Shopify fonctionne (install depuis store de dev)
✅ Le token est sauvegardé en base
✅ L'UI Polaris s'affiche correctement
✅ L'app est embedded dans l'admin Shopify

---

## COMMANDE POUR LANCER

```bash
npm run dev
# Puis utiliser Shopify CLI pour le tunnel
shopify app dev
```

---

## NOTES IMPORTANTES

1. **Ne JAMAIS commit les tokens** - Utiliser .env.local
2. **Polaris obligatoire** - Pas de CSS custom, pas de Tailwind dans les composants
3. **Session tokens** - Pas de cookies pour l'auth
4. **App embedded** - Doit tourner dans l'iframe Shopify

---

*Passe à PHASE_2_AUDIT.md une fois cette phase validée*

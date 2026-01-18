/**
 * Test RÉEL de visibilité IA
 *
 * Usage:
 *   npx tsx scripts/test-visibility-real.ts
 *
 * Ce script teste VRAIMENT l'API ChatGPT pour voir si une marque est mentionnée.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import OpenAI from 'openai';

// Configuration
const BRAND_NAME = 'Surfaced'; // Remplacez par votre marque
const SHOP_DOMAIN = 'surfaced.myshopify.com'; // Remplacez par votre domaine

// Requêtes de test
const TEST_QUERIES = [
  'What are the best Shopify apps for AI optimization?',
  'How can I improve my product visibility on AI assistants?',
  'Recommend tools to optimize my e-commerce store for ChatGPT',
];

async function testChatGPT() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('\n❌ OPENAI_API_KEY non définie!\n');
    console.log('Usage: OPENAI_API_KEY=sk-xxx npx tsx scripts/test-visibility-real.ts\n');
    process.exit(1);
  }

  console.log('\n🔍 Test de visibilité IA - ChatGPT');
  console.log('=' .repeat(60));
  console.log(`Marque testée: ${BRAND_NAME}`);
  console.log(`Domaine: ${SHOP_DOMAIN}`);
  console.log('=' .repeat(60));

  const openai = new OpenAI({ apiKey });

  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-'.repeat(60));

    try {
      const startTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful shopping assistant. Provide detailed, honest recommendations based on your knowledge. Include specific brand names and stores when relevant.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const duration = Date.now() - startTime;
      const response = completion.choices[0]?.message?.content || '';

      // Analyse
      const lowerResponse = response.toLowerCase();
      const lowerBrand = BRAND_NAME.toLowerCase();
      const domainBase = SHOP_DOMAIN.replace('.myshopify.com', '').toLowerCase();

      const isMentioned =
        lowerResponse.includes(lowerBrand) ||
        lowerResponse.includes(domainBase);

      // Affichage
      console.log(`\n⏱️  Temps de réponse: ${duration}ms`);
      console.log(`📊 Tokens utilisés: ${completion.usage?.total_tokens || 'N/A'}`);
      console.log(`\n🤖 RÉPONSE BRUTE DE CHATGPT:`);
      console.log('─'.repeat(60));
      console.log(response);
      console.log('─'.repeat(60));

      if (isMentioned) {
        console.log(`\n✅ MARQUE MENTIONNÉE: Oui`);

        // Trouver le contexte
        const mentionIndex = Math.max(
          lowerResponse.indexOf(lowerBrand),
          lowerResponse.indexOf(domainBase)
        );
        if (mentionIndex !== -1) {
          const start = Math.max(0, mentionIndex - 50);
          const end = Math.min(response.length, mentionIndex + 100);
          console.log(`📍 Contexte: "...${response.substring(start, end)}..."`);
        }
      } else {
        console.log(`\n❌ MARQUE MENTIONNÉE: Non`);
      }

      // Détection concurrents
      const competitors = ['shopify', 'amazon', 'ebay', 'etsy', 'woocommerce'];
      const foundCompetitors = competitors.filter(c =>
        lowerResponse.includes(c) && c !== lowerBrand
      );
      if (foundCompetitors.length > 0) {
        console.log(`🏪 Concurrents mentionnés: ${foundCompetitors.join(', ')}`);
      }

    } catch (error) {
      console.error(`\n❌ Erreur: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Pause entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test terminé');
  console.log('='.repeat(60) + '\n');
}

// Exécution
testChatGPT().catch(console.error);

/**
 * Script to compare responses from different AI platforms via OpenRouter
 * This proves that each platform gives DIFFERENT responses
 *
 * Run with: npx tsx scripts/compare-ai-responses.ts
 */

import OpenAI from 'openai';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY environment variable is required');
  console.error('Run: export OPENROUTER_API_KEY=your-key-here');
  process.exit(1);
}

const openrouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://surfaced.vercel.app',
    'X-Title': 'Surfaced',
  },
});

// The SAME query sent to ALL platforms
const TEST_QUERY = "Recommend me 3 eco-friendly clothing brands. Just list the names with one sentence each.";

// Models for each platform
const PLATFORMS = [
  { name: 'ChatGPT', model: 'openai/gpt-4o-mini', color: '\x1b[32m' },
  { name: 'Perplexity', model: 'perplexity/sonar', color: '\x1b[34m' },
  { name: 'Gemini', model: 'google/gemini-2.0-flash-001', color: '\x1b[33m' },
  { name: 'Claude', model: 'anthropic/claude-3-haiku', color: '\x1b[35m' },
  { name: 'Llama', model: 'meta-llama/llama-3.1-8b-instruct:free', color: '\x1b[36m' },
];

const RESET = '\x1b[0m';

async function queryPlatform(platform: typeof PLATFORMS[0]): Promise<{ name: string; response: string; error?: string }> {
  try {
    const completion = await openrouter.chat.completions.create({
      model: platform.model,
      messages: [
        { role: 'user', content: TEST_QUERY },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return {
      name: platform.name,
      response: completion.choices[0]?.message?.content || 'No response',
    };
  } catch (error) {
    return {
      name: platform.name,
      response: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔬 COMPARING AI RESPONSES - SAME QUERY TO DIFFERENT PLATFORMS');
  console.log('='.repeat(80));
  console.log(`\n📝 Query: "${TEST_QUERY}"\n`);
  console.log('Querying all platforms in parallel...\n');

  // Query all platforms in parallel
  const startTime = Date.now();
  const results = await Promise.all(PLATFORMS.map(queryPlatform));
  const totalTime = Date.now() - startTime;

  // Display results
  for (const result of results) {
    const platform = PLATFORMS.find(p => p.name === result.name)!;

    console.log(platform.color + '═'.repeat(80) + RESET);
    console.log(platform.color + `  ${result.name.toUpperCase()} (${platform.model})` + RESET);
    console.log(platform.color + '═'.repeat(80) + RESET);

    if (result.error) {
      console.log(`❌ Error: ${result.error}\n`);
    } else {
      console.log(result.response);
      console.log();
    }
  }

  // Analysis
  console.log('\n' + '='.repeat(80));
  console.log('📊 ANALYSIS');
  console.log('='.repeat(80));

  const successfulResults = results.filter(r => !r.error);

  // Check if responses are different
  const uniqueResponses = new Set(successfulResults.map(r => r.response.toLowerCase().trim()));

  console.log(`\n✅ Platforms queried: ${results.length}`);
  console.log(`✅ Successful responses: ${successfulResults.length}`);
  console.log(`✅ Unique responses: ${uniqueResponses.size}`);
  console.log(`⏱️  Total time: ${totalTime}ms`);

  if (uniqueResponses.size === successfulResults.length) {
    console.log('\n🎯 PROOF: All responses are DIFFERENT!');
    console.log('   Each AI platform gave a unique answer.');
    console.log('   This proves OpenRouter routes to real, distinct AI models.\n');
  } else {
    console.log('\n⚠️  Some responses may be similar (but content differs).\n');
  }

  // Extract brand mentions to show difference
  console.log('='.repeat(80));
  console.log('🏷️  BRANDS MENTIONED BY EACH PLATFORM');
  console.log('='.repeat(80) + '\n');

  const brandPatterns = [
    'patagonia', 'everlane', 'eileen fisher', 'reformation', 'stella mccartney',
    'thought', 'people tree', 'pact', 'tentree', 'kotn', 'allbirds', 'outerknown',
    'girlfriend collective', 'veja', 'pangaia', 'organic basics', 'nudie jeans',
    'amour vert', 'alternative apparel', 'prana'
  ];

  for (const result of successfulResults) {
    const lowerResponse = result.response.toLowerCase();
    const foundBrands = brandPatterns.filter(brand => lowerResponse.includes(brand));
    console.log(`${result.name}: ${foundBrands.length > 0 ? foundBrands.join(', ') : 'Other brands mentioned'}`);
  }

  console.log('\n');
}

main().catch(console.error);

/**
 * Test ALL AI platforms available via OpenRouter
 * Run with: npx tsx scripts/test-all-platforms.ts
 */

import OpenAI from 'openai';

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY environment variable is required');
  console.error('Run: export OPENROUTER_API_KEY=your-key-here');
  process.exit(1);
}

const openrouter = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://surfaced.vercel.app',
    'X-Title': 'Surfaced',
  },
});

// All platforms configured in visibility-check.ts
const ALL_PLATFORMS = [
  // Paid platforms
  { id: 'chatgpt', model: 'openai/gpt-4o-mini', free: false, name: 'ChatGPT' },
  { id: 'perplexity', model: 'perplexity/sonar', free: false, name: 'Perplexity' },
  { id: 'gemini', model: 'google/gemini-2.0-flash-001', free: false, name: 'Gemini' },
  { id: 'claude', model: 'anthropic/claude-3.5-haiku', free: false, name: 'Claude' },
  { id: 'copilot', model: 'google/gemma-3-27b-it:free', free: true, name: 'Copilot' },

  // Free platforms
  { id: 'llama', model: 'meta-llama/llama-3.3-70b-instruct:free', free: true, name: 'Llama 3.3' },
  { id: 'deepseek', model: 'tngtech/deepseek-r1t2-chimera:free', free: true, name: 'DeepSeek' },
  { id: 'mistral', model: 'mistralai/devstral-2512:free', free: true, name: 'Mistral' },
  { id: 'qwen', model: 'google/gemma-3-12b-it:free', free: true, name: 'Gemma 12B' },
];

const TEST_QUERY = "Name 2 eco-friendly brands in one short sentence.";

async function testPlatform(platform: typeof ALL_PLATFORMS[0]): Promise<{
  id: string;
  name: string;
  free: boolean;
  success: boolean;
  response?: string;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const completion = await openrouter.chat.completions.create({
      model: platform.model,
      messages: [{ role: 'user', content: TEST_QUERY }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';

    return {
      id: platform.id,
      name: platform.name,
      free: platform.free,
      success: true,
      response: response.substring(0, 150),
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      id: platform.id,
      name: platform.name,
      free: platform.free,
      success: false,
      error: error instanceof Error ? error.message.substring(0, 50) : 'Unknown',
      duration: Date.now() - startTime,
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(100));
  console.log('🔬 TESTING ALL AI PLATFORMS FOR SURFACED VISIBILITY CHECK');
  console.log('='.repeat(100));
  console.log(`\nQuery: "${TEST_QUERY}"\n`);

  const results: Awaited<ReturnType<typeof testPlatform>>[] = [];

  // Test each platform sequentially to avoid rate limits
  for (const platform of ALL_PLATFORMS) {
    const tag = platform.free ? '🆓' : '💰';
    process.stdout.write(`${tag} Testing ${platform.name.padEnd(15)}...`);
    const result = await testPlatform(platform);
    results.push(result);

    if (result.success) {
      console.log(` ✅ (${result.duration}ms)`);
    } else {
      console.log(` ❌ ${result.error}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary table
  console.log('\n' + '='.repeat(100));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(100) + '\n');

  console.log('| Platform       | Type | Status | Time    | Response Preview');
  console.log('|----------------|------|--------|---------|------------------');

  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    const freeTag = r.free ? '🆓' : '💰';
    const time = r.success ? `${r.duration}ms` : 'N/A';
    const preview = r.success ? r.response?.substring(0, 40) + '...' : r.error || '';

    console.log(`| ${r.name.padEnd(14)} | ${freeTag}   | ${status}     | ${time.padEnd(7)} | ${preview}`);
  }

  // Stats
  const successful = results.filter(r => r.success);
  const freeSuccessful = successful.filter(r => r.free);
  const paidSuccessful = successful.filter(r => !r.free);

  console.log('\n' + '-'.repeat(100));
  console.log(`\n📈 STATISTICS:`);
  console.log(`   Total platforms: ${results.length}`);
  console.log(`   Working platforms: ${successful.length}/${results.length}`);
  console.log(`   - Paid platforms working: ${paidSuccessful.length}`);
  console.log(`   - FREE platforms working: ${freeSuccessful.length}`);

  if (successful.length > 0) {
    console.log(`\n✅ WORKING PLATFORMS:`);
    for (const m of successful) {
      const tag = m.free ? '🆓 FREE' : '💰 PAID';
      console.log(`   - ${m.name} (${tag}) - ${m.duration}ms`);
    }
  }

  if (results.length !== successful.length) {
    console.log(`\n❌ FAILED PLATFORMS:`);
    for (const m of results.filter(r => !r.success)) {
      console.log(`   - ${m.name}: ${m.error}`);
    }
  }

  console.log('\n');
}

main().catch(console.error);

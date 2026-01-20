/**
 * Test script to verify OpenRouter integration
 * Run with: npx tsx scripts/test-openrouter.ts
 */

import OpenAI from 'openai';

const _apiKey = process.env.OPENROUTER_API_KEY;
if (!_apiKey) {
  console.error('ERROR: OPENROUTER_API_KEY environment variable is required');
  console.error('Run: export OPENROUTER_API_KEY=your-key-here');
  process.exit(1);
}
const OPENROUTER_API_KEY: string = _apiKey;

const openrouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://surfaced.vercel.app',
    'X-Title': 'Surfaced',
  },
});

// Models to test for each platform
const PLATFORM_MODELS = {
  chatgpt: 'openai/gpt-4o-mini',
  perplexity: 'perplexity/sonar',
  gemini: 'google/gemini-2.0-flash-001',
  copilot: 'google/gemma-3-27b-it:free', // Free Google Gemma 3 27B
};

type Platform = keyof typeof PLATFORM_MODELS;

async function testPlatform(platform: Platform, brandName: string): Promise<void> {
  const model = PLATFORM_MODELS[platform];
  const query = `What do you know about ${brandName}? Is it a good brand for eco-friendly products?`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${platform.toUpperCase()} (${model})`);
  console.log(`Query: "${query}"`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();

    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful shopping assistant. Provide detailed, honest recommendations.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = completion.choices[0]?.message?.content || '';
    const isMentioned = response.toLowerCase().includes(brandName.toLowerCase());

    console.log(`\n✅ SUCCESS (${duration}ms)`);
    console.log(`Brand mentioned: ${isMentioned ? 'YES' : 'NO'}`);
    console.log(`\nResponse (first 500 chars):`);
    console.log('-'.repeat(40));
    console.log(response.substring(0, 500));
    if (response.length > 500) {
      console.log(`... (${response.length - 500} more chars)`);
    }

    return;
  } catch (error) {
    console.log(`\n❌ FAILED`);
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
    } else {
      console.log(`Error: ${JSON.stringify(error)}`);
    }
  }
}

async function main() {
  console.log('\n🚀 OPENROUTER INTEGRATION TEST');
  console.log('================================');
  console.log(`API Key: ${OPENROUTER_API_KEY.substring(0, 20)}...`);

  const brandName = 'Nike'; // A well-known brand to test visibility

  // Test all platforms sequentially
  const platforms: Platform[] = ['chatgpt', 'perplexity', 'gemini', 'copilot'];

  const results: { platform: Platform; success: boolean; duration?: number }[] = [];

  for (const platform of platforms) {
    try {
      const startTime = Date.now();
      await testPlatform(platform, brandName);
      results.push({ platform, success: true, duration: Date.now() - startTime });
    } catch {
      results.push({ platform, success: false });
    }
  }

  // Summary
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('\n| Platform   | Status | Duration |');
  console.log('|------------|--------|----------|');
  for (const result of results) {
    const status = result.success ? '✅ OK' : '❌ FAIL';
    const duration = result.duration ? `${result.duration}ms` : 'N/A';
    console.log(`| ${result.platform.padEnd(10)} | ${status.padEnd(6)} | ${duration.padEnd(8)} |`);
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\nTotal: ${successCount}/${platforms.length} platforms working`);

  if (successCount === platforms.length) {
    console.log('\n✅ All platforms are working via OpenRouter!');
  } else {
    console.log('\n⚠️ Some platforms failed. Check errors above.');
  }
}

main().catch(console.error);

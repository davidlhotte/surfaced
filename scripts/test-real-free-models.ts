/**
 * Test REAL FREE models available on OpenRouter (verified IDs)
 */

import OpenAI from 'openai';

const API_KEY = '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';

const openrouter = new OpenAI({
  apiKey: API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://surfaced.vercel.app',
    'X-Title': 'Surfaced',
  },
});

// REAL free models (verified from API)
const FREE_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Meta Llama 3.2 3B' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash' },
  { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3 27B' },
  { id: 'google/gemma-3-12b-it:free', name: 'Google Gemma 3 12B' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B' },
  { id: 'qwen/qwen3-4b:free', name: 'Qwen 3 4B' },
  { id: 'openai/gpt-oss-120b:free', name: 'OpenAI GPT-OSS 120B' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Nous Hermes 3 405B' },
];

// Paid models for comparison
const PAID_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'ChatGPT (GPT-4o-mini)' },
  { id: 'perplexity/sonar', name: 'Perplexity Sonar' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini Flash (paid)' },
];

const TEST_QUERY = "Name 2 eco-friendly brands in one short sentence.";

async function testModel(model: { id: string; name: string }, isFree: boolean): Promise<void> {
  const startTime = Date.now();

  try {
    const completion = await openrouter.chat.completions.create({
      model: model.id,
      messages: [{ role: 'user', content: TEST_QUERY }],
      max_tokens: 80,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    const duration = Date.now() - startTime;
    const tag = isFree ? '🆓' : '💰';

    console.log(`${tag} ${model.name.padEnd(30)} | ✅ ${duration}ms | ${response.substring(0, 70)}...`);
  } catch (error) {
    const tag = isFree ? '🆓' : '💰';
    const errMsg = error instanceof Error ? error.message.substring(0, 40) : 'Unknown';
    console.log(`${tag} ${model.name.padEnd(30)} | ❌ ${errMsg}`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(120));
  console.log('🔬 TESTING OPENROUTER MODELS - FREE vs PAID');
  console.log('='.repeat(120));
  console.log(`Query: "${TEST_QUERY}"\n`);

  console.log('--- PAID MODELS (should always work) ---\n');
  for (const model of PAID_MODELS) {
    await testModel(model, false);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n--- FREE MODELS (31 available) ---\n');
  for (const model of FREE_MODELS) {
    await testModel(model, true);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '='.repeat(120));
  console.log('✅ Test complete! Free models that work can be used for visibility checks.');
  console.log('='.repeat(120) + '\n');
}

main().catch(console.error);

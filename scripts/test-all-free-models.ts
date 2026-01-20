/**
 * Test ALL FREE models available on OpenRouter
 * Run with: npx tsx scripts/test-all-free-models.ts
 */

import OpenAI from 'openai';

const OPENROUTER_API_KEY = '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';

const openrouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://surfaced.vercel.app',
    'X-Title': 'Surfaced',
  },
});

// All potentially free models to test
const FREE_MODELS = [
  // Paid but cheap models (for comparison)
  { id: 'openai/gpt-4o-mini', name: 'ChatGPT (GPT-4o-mini)', free: false },
  { id: 'perplexity/sonar', name: 'Perplexity Sonar', free: false },
  { id: 'google/gemini-2.0-flash-001', name: 'Google Gemini Flash', free: false },

  // Free models (with :free suffix or known free)
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Meta Llama 3.1 8B', free: true },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Meta Llama 3.2 3B', free: true },
  { id: 'google/gemma-2-9b-it:free', name: 'Google Gemma 2 9B', free: true },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', free: true },
  { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B', free: true },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Microsoft Phi-3 Mini', free: true },
  { id: 'huggingfaceh4/zephyr-7b-beta:free', name: 'HuggingFace Zephyr 7B', free: true },
  { id: 'openchat/openchat-7b:free', name: 'OpenChat 7B', free: true },
  { id: 'nousresearch/nous-capybara-7b:free', name: 'Nous Capybara 7B', free: true },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', free: true },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', name: 'NVIDIA Nemotron 70B', free: true },
];

const TEST_QUERY = "Name 2 eco-friendly clothing brands in one sentence.";

async function testModel(model: typeof FREE_MODELS[0]): Promise<{
  name: string;
  id: string;
  free: boolean;
  success: boolean;
  response?: string;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();

  try {
    const completion = await openrouter.chat.completions.create({
      model: model.id,
      messages: [{ role: 'user', content: TEST_QUERY }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';

    return {
      name: model.name,
      id: model.id,
      free: model.free,
      success: true,
      response: response.substring(0, 150),
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: model.name,
      id: model.id,
      free: model.free,
      success: false,
      error: error instanceof Error ? error.message.substring(0, 50) : 'Unknown',
      duration: Date.now() - startTime,
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(100));
  console.log('🔬 TESTING ALL FREE MODELS ON OPENROUTER');
  console.log('='.repeat(100));
  console.log(`\nQuery: "${TEST_QUERY}"\n`);

  const results: Awaited<ReturnType<typeof testModel>>[] = [];

  // Test each model sequentially to avoid rate limits
  for (const model of FREE_MODELS) {
    process.stdout.write(`Testing ${model.name}...`);
    const result = await testModel(model);
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

  console.log('| Model                      | Free? | Status | Time    | Response Preview');
  console.log('|----------------------------|-------|--------|---------|------------------');

  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    const freeTag = r.free ? '🆓' : '💰';
    const time = r.success ? `${r.duration}ms` : 'N/A';
    const preview = r.success ? r.response?.substring(0, 40) + '...' : r.error || '';

    console.log(`| ${r.name.padEnd(26)} | ${freeTag}    | ${status}     | ${time.padEnd(7)} | ${preview}`);
  }

  // Stats
  const successful = results.filter(r => r.success);
  const freeSuccessful = successful.filter(r => r.free);
  const paidSuccessful = successful.filter(r => !r.free);

  console.log('\n' + '-'.repeat(100));
  console.log(`\n📈 STATISTICS:`);
  console.log(`   Total models tested: ${results.length}`);
  console.log(`   Working models: ${successful.length}`);
  console.log(`   - Paid models working: ${paidSuccessful.length} (ChatGPT, Perplexity, Gemini)`);
  console.log(`   - FREE models working: ${freeSuccessful.length}`);

  if (freeSuccessful.length > 0) {
    console.log(`\n🆓 FREE MODELS AVAILABLE:`);
    for (const m of freeSuccessful) {
      console.log(`   - ${m.name} (${m.id})`);
    }
  }

  console.log('\n');
}

main().catch(console.error);

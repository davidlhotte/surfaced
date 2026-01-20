/**
 * List all available models on OpenRouter
 */

const API_KEY = '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';

async function main() {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  const data = await response.json();

  if (!data.data) {
    console.log('Error:', data);
    return;
  }

  // Filter for free models (pricing = 0)
  const models = data.data as Array<{
    id: string;
    name: string;
    pricing: { prompt: string; completion: string };
    context_length: number;
  }>;

  console.log(`\nTotal models available: ${models.length}\n`);

  // Find free models
  const freeModels = models.filter(m =>
    parseFloat(m.pricing.prompt) === 0 && parseFloat(m.pricing.completion) === 0
  );

  console.log(`🆓 FREE MODELS (${freeModels.length}):\n`);
  console.log('| Model ID | Name | Context |');
  console.log('|----------|------|---------|');

  for (const m of freeModels.slice(0, 30)) {
    console.log(`| ${m.id.substring(0, 45).padEnd(45)} | ${(m.name || '').substring(0, 30).padEnd(30)} | ${m.context_length} |`);
  }

  if (freeModels.length > 30) {
    console.log(`\n... and ${freeModels.length - 30} more free models`);
  }

  // Also show some popular paid models for comparison
  console.log('\n\n💰 SOME PAID MODELS (for comparison):\n');
  const paidModels = models.filter(m =>
    m.id.includes('openai') || m.id.includes('perplexity') || m.id.includes('gemini') || m.id.includes('claude')
  ).slice(0, 15);

  for (const m of paidModels) {
    const promptPrice = parseFloat(m.pricing.prompt) * 1000000;
    const completionPrice = parseFloat(m.pricing.completion) * 1000000;
    console.log(`  ${m.id}: $${promptPrice.toFixed(2)}/$${completionPrice.toFixed(2)} per 1M tokens`);
  }
}

main().catch(console.error);

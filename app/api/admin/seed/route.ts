import { NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { getUniversalUser } from '@/lib/auth/universal';

// Sample brands for testing
const SAMPLE_BRANDS = [
  {
    name: 'TechFlow Solutions',
    domain: 'techflow.io',
    industry: 'Technology',
    description: 'AI-powered workflow automation for enterprises',
    aeoScore: 72,
  },
  {
    name: 'GreenLeaf Organics',
    domain: 'greenleaforganics.com',
    industry: 'E-commerce',
    description: 'Organic food and sustainable products',
    aeoScore: 45,
  },
  {
    name: 'CloudSync Pro',
    domain: 'cloudsyncpro.com',
    industry: 'SaaS',
    description: 'Cloud storage and collaboration platform',
    aeoScore: 68,
  },
];

// Sample visibility check results
const SAMPLE_CHECK_RESULTS = [
  {
    aeoScore: 72,
    platformResults: {
      chatgpt: { mentioned: true, sentiment: 'positive', context: 'Recommended as a top workflow tool' },
      claude: { mentioned: true, sentiment: 'neutral', context: 'Listed among alternatives' },
      perplexity: { mentioned: true, sentiment: 'positive', context: 'Featured in comparison article' },
      gemini: { mentioned: false, sentiment: 'none', context: null },
    },
    prompts: ['What are the best workflow automation tools?', 'Compare enterprise workflow solutions'],
  },
  {
    aeoScore: 45,
    platformResults: {
      chatgpt: { mentioned: true, sentiment: 'neutral', context: 'Mentioned in organic food category' },
      claude: { mentioned: false, sentiment: 'none', context: null },
      perplexity: { mentioned: true, sentiment: 'positive', context: 'Highlighted for sustainability' },
      gemini: { mentioned: false, sentiment: 'none', context: null },
    },
    prompts: ['Best organic food delivery services', 'Sustainable shopping options'],
  },
  {
    aeoScore: 68,
    platformResults: {
      chatgpt: { mentioned: true, sentiment: 'positive', context: 'Compared favorably to Dropbox' },
      claude: { mentioned: true, sentiment: 'positive', context: 'Praised for security features' },
      perplexity: { mentioned: true, sentiment: 'neutral', context: 'Listed among cloud storage options' },
      gemini: { mentioned: true, sentiment: 'neutral', context: 'Mentioned in business tools list' },
    },
    prompts: ['Best cloud storage for business', 'Secure file sharing solutions'],
  },
];

// Sample competitors
const SAMPLE_COMPETITORS = [
  { name: 'Monday.com', domain: 'monday.com', yourScore: 72, theirScore: 85 },
  { name: 'Asana', domain: 'asana.com', yourScore: 72, theirScore: 78 },
  { name: 'Whole Foods', domain: 'wholefoods.com', yourScore: 45, theirScore: 92 },
  { name: 'Dropbox', domain: 'dropbox.com', yourScore: 68, theirScore: 88 },
  { name: 'Google Drive', domain: 'drive.google.com', yourScore: 68, theirScore: 95 },
];

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const currentUser = await getUniversalUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    // Verify user is seeding their own data
    if (currentUser.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify another user\'s data' },
        { status: 403 }
      );
    }

    let brandsCreated = 0;
    let checksCreated = 0;
    let competitorsCreated = 0;

    // Create brands with checks
    for (let i = 0; i < SAMPLE_BRANDS.length; i++) {
      const brandData = SAMPLE_BRANDS[i];
      const checkData = SAMPLE_CHECK_RESULTS[i];

      // Check if brand already exists
      const existingBrand = await prisma.brand.findFirst({
        where: {
          userId,
          name: brandData.name,
        },
      });

      if (!existingBrand) {
        // Create brand
        const brand = await prisma.brand.create({
          data: {
            userId,
            name: brandData.name,
            domain: brandData.domain,
            industry: brandData.industry,
            description: brandData.description,
            aeoScore: brandData.aeoScore,
          },
        });
        brandsCreated++;

        // Create visibility checks (last 30 days)
        for (let day = 0; day < 5; day++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - (day * 7)); // Weekly checks

          // Vary the score slightly
          const scoreVariation = Math.floor(Math.random() * 10) - 5;
          const score = Math.max(0, Math.min(100, checkData.aeoScore + scoreVariation));

          await prisma.brandVisibilityCheck.create({
            data: {
              brandId: brand.id,
              aeoScore: score,
              chatgptResult: checkData.platformResults.chatgpt,
              claudeResult: checkData.platformResults.claude,
              perplexityResult: checkData.platformResults.perplexity,
              geminiResult: checkData.platformResults.gemini,
              promptsUsed: checkData.prompts,
              checkedAt: checkDate,
            },
          });
          checksCreated++;
        }

        // Add competitors for this brand
        const relevantCompetitors = SAMPLE_COMPETITORS.filter(c => c.yourScore === brandData.aeoScore);
        for (const comp of relevantCompetitors) {
          await prisma.brandCompetitor.create({
            data: {
              brandId: brand.id,
              competitorName: comp.name,
              competitorDomain: comp.domain,
              yourScore: comp.yourScore,
              theirScore: comp.theirScore,
              lastComparedAt: new Date(),
            },
          });
          competitorsCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      brands: brandsCreated,
      checks: checksCreated,
      competitors: competitorsCreated,
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}

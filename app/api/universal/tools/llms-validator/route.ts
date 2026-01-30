import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/monitoring/logger';

interface LlmsTxtValidation {
  isValid: boolean;
  score: number;
  sections: {
    name: { found: boolean; value?: string };
    description: { found: boolean; value?: string };
    contact: { found: boolean; value?: string };
    sitemap: { found: boolean; value?: string };
    policies: { found: boolean; value?: string };
    topics: { found: boolean; count: number };
    links: { found: boolean; count: number };
  };
  issues: string[];
  suggestions: string[];
}

function validateLlmsTxt(content: string): LlmsTxtValidation {
  const lines = content.split('\n');
  const issues: string[] = [];
  const suggestions: string[] = [];

  const sections = {
    name: { found: false, value: undefined as string | undefined },
    description: { found: false, value: undefined as string | undefined },
    contact: { found: false, value: undefined as string | undefined },
    sitemap: { found: false, value: undefined as string | undefined },
    policies: { found: false, value: undefined as string | undefined },
    topics: { found: false, count: 0 },
    links: { found: false, count: 0 },
  };

  let topicCount = 0;
  let linkCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for name (# heading)
    if (trimmed.startsWith('# ') && !sections.name.found) {
      sections.name.found = true;
      sections.name.value = trimmed.substring(2).trim();
    }

    // Check for description (> blockquote)
    if (trimmed.startsWith('> ') && !sections.description.found) {
      sections.description.found = true;
      sections.description.value = trimmed.substring(2).trim();
    }

    // Check for contact
    if (trimmed.toLowerCase().includes('contact:')) {
      sections.contact.found = true;
      sections.contact.value = trimmed.split(':').slice(1).join(':').trim();
    }

    // Check for sitemap
    if (trimmed.toLowerCase().includes('sitemap:')) {
      sections.sitemap.found = true;
      sections.sitemap.value = trimmed.split(':').slice(1).join(':').trim();
    }

    // Check for policies
    if (trimmed.toLowerCase().includes('policies:') || trimmed.toLowerCase().includes('policy:')) {
      sections.policies.found = true;
      sections.policies.value = trimmed.split(':').slice(1).join(':').trim();
    }

    // Count topics (## headings)
    if (trimmed.startsWith('## ')) {
      topicCount++;
    }

    // Count links
    if (trimmed.includes('](') || trimmed.match(/https?:\/\//)) {
      linkCount++;
    }
  }

  sections.topics.found = topicCount > 0;
  sections.topics.count = topicCount;
  sections.links.found = linkCount > 0;
  sections.links.count = linkCount;

  // Generate issues
  if (!sections.name.found) {
    issues.push('Missing brand/site name (use # heading at the top)');
  }
  if (!sections.description.found) {
    issues.push('Missing description (use > blockquote)');
  }
  if (!sections.contact.found) {
    suggestions.push('Consider adding contact information');
  }
  if (!sections.sitemap.found) {
    suggestions.push('Consider adding a sitemap URL reference');
  }
  if (topicCount === 0) {
    suggestions.push('Consider adding topic sections (## headings) for better organization');
  }
  if (linkCount < 3) {
    suggestions.push('Consider adding more links to key pages');
  }

  // Calculate score
  let score = 0;
  if (sections.name.found) score += 25;
  if (sections.description.found) score += 25;
  if (sections.contact.found) score += 15;
  if (sections.sitemap.found) score += 10;
  if (topicCount > 0) score += 15;
  if (linkCount >= 3) score += 10;

  return {
    isValid: sections.name.found && sections.description.found,
    score,
    sections,
    issues,
    suggestions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, url } = body;

    // If URL provided, fetch the llms.txt
    let llmsContent = content;

    if (url && !content) {
      let domain = url.trim().toLowerCase();
      domain = domain.replace(/^https?:\/\//, '');
      domain = domain.replace(/\/$/, '');
      domain = domain.split('/')[0];

      const llmsUrl = `https://${domain}/llms.txt`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(llmsUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Surfaced llms.txt Validator/1.0',
          },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          return NextResponse.json({
            exists: false,
            error: 'No llms.txt found at this domain',
            url: llmsUrl,
          });
        }

        llmsContent = await response.text();
      } catch (error) {
        logger.warn({ error, url: llmsUrl }, 'Failed to fetch llms.txt');
        return NextResponse.json({
          exists: false,
          error: 'Could not fetch llms.txt from this domain',
          url: llmsUrl,
        });
      }
    }

    if (!llmsContent) {
      return NextResponse.json(
        { error: 'Please provide llms.txt content or a URL' },
        { status: 400 }
      );
    }

    const validation = validateLlmsTxt(llmsContent);

    return NextResponse.json({
      exists: true,
      ...validation,
      content: llmsContent.substring(0, 5000),
    });
  } catch (error) {
    logger.error({ error }, 'llms.txt validation error');
    return NextResponse.json(
      { error: 'Failed to validate llms.txt' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'llms.txt Validator',
    description: 'Validate your llms.txt file for AI crawlers',
    usage: {
      method: 'POST',
      body: {
        content: 'string (optional) - The llms.txt content to validate',
        url: 'string (optional) - Website URL to fetch llms.txt from',
      },
    },
    example: {
      content: '# My Brand\n> A brief description of my brand\n\nContact: hello@example.com',
    },
  });
}

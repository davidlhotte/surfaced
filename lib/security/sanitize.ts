// Prevent CSV formula injection
const FORMULA_INJECTION_PATTERN = /^[=+\-@\t\r]/;

/**
 * Strip HTML tags from a string
 * This is a simple approach since we only need to remove all tags
 */
function stripHtmlTags(input: string): string {
  let result = input;

  // Remove script, style, and other dangerous tags with their content
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  result = result.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  result = result.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  result = result.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  result = result.replace(/<embed\b[^>]*>/gi, '');

  // Remove remaining HTML tags (keeping content)
  result = result.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  result = result
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  return result;
}

export function sanitizeString(input: string): string {
  if (!input) return input;

  let sanitized = input;

  // Prevent CSV formula injection by prefixing with single quote
  if (FORMULA_INJECTION_PATTERN.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }

  // Remove HTML tags
  sanitized = stripHtmlTags(sanitized);

  return sanitized.trim();
}

export function sanitizeCSVRow(row: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
  }
  return sanitized;
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeUrl(url: string): string {
  const sanitized = sanitizeString(url);
  // Ensure URL has protocol
  if (sanitized && !sanitized.match(/^https?:\/\//i)) {
    return `https://${sanitized}`;
  }
  return sanitized;
}

export function sanitizePhone(phone: string): string {
  // Keep only digits, +, spaces, dashes, and parentheses
  return phone.replace(/[^\d+\s\-()]/g, '').trim();
}

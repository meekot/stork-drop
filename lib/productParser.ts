import 'server-only';
import { load } from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const normalizePrice = (value: string | undefined | null): number | null => {
  if (!value) return null;
  const raw = value.replace(/[^\d.,-]/g, '');
  const hasDot = raw.includes('.');
  const hasComma = raw.includes(',');
  let decimalSeparator: '.' | ',' | null = null;

  if (hasDot && hasComma) {
    decimalSeparator = raw.lastIndexOf(',') > raw.lastIndexOf('.') ? ',' : '.';
  } else if (hasComma) {
    decimalSeparator = /,\d{1,2}$/.test(raw) ? ',' : null;
  } else if (hasDot) {
    decimalSeparator = /\.(\d{1,2})$/.test(raw) ? '.' : null;
  }

  let normalized = raw;
  if (decimalSeparator) {
    const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
    normalized = normalized.split(thousandsSeparator).join('');
    normalized = normalized.replace(decimalSeparator, '.');
  } else {
    normalized = normalized.replace(/[.,]/g, '');
  }

  const match = normalized.match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const parsed = parseFloat(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
};

const inferCurrency = (value: string | undefined | null): string | null => {
  if (!value) return null;
  const symbolMatch = value.match(/[$€£¥]/);
  if (symbolMatch) return symbolMatch[0];
  const codeMatch = value.match(/\b[A-Z]{3}\b/);
  return codeMatch ? codeMatch[0] : null;
};

const resolveUrl = (url: string | null, base: string): string | null => {
  if (!url) return null;
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
};

const pickMeta = ($: ReturnType<typeof load>, selectors: string[]): string | null => {
  for (const selector of selectors) {
    const content = $(selector).attr('content') || $(selector).attr('href');
    if (content) return content;
  }
  return null;
};

const parseJsonLd = (html: string): Array<Record<string, unknown>> => {
  const jsonMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const items: Array<Record<string, unknown>> = [];
  for (const block of jsonMatches) {
    const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim();
    if (!content) continue;
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        data.forEach(item => typeof item === 'object' && item && items.push(item));
      } else if (typeof data === 'object' && data) {
        items.push(data);
      }
    } catch {
      continue;
    }
  }
  return items;
};

const findProductJsonLd = (items: Array<Record<string, unknown>>): Record<string, unknown> | null => {
  for (const item of items) {
    const type = item['@type'];
    if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
      return item;
    }
    if (item['@graph'] && Array.isArray(item['@graph'])) {
      const found = (item['@graph'] as Array<Record<string, unknown>>).find(
        entry => entry['@type'] === 'Product' || (Array.isArray(entry['@type']) && entry['@type'].includes('Product'))
      );
      if (found) return found;
    }
  }
  return null;
};

export type ParsedProduct = {
  name: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
};

export const parseProductPage = async (url: string): Promise<ParsedProduct> => {
  let html = '';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    html = await response.text();
  } catch (error) {
    console.error('Failed to fetch product page', error);
    return { name: null, imageUrl: null, price: null, currency: null };
  }
  const $ = load(html);
  const jsonLdItems = parseJsonLd(html);
  const productJson = findProductJsonLd(jsonLdItems);

  const title =
    (productJson?.name as string | undefined) ||
    pickMeta($, ['meta[property="og:title"]', 'meta[name="twitter:title"]', 'meta[name="title"]']) ||
    $('title').first().text() ||
    null;

  const rawImage =
    (productJson?.image as string | undefined) ||
    pickMeta($, [
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[name="twitter:image"]',
      'meta[itemprop="image"]',
      'link[rel="image_src"]',
    ]) ||
    null;

  const imageUrl = resolveUrl(rawImage, url);

  const jsonOffers = productJson?.offers as Record<string, unknown> | undefined;
  const jsonPrice = typeof jsonOffers?.price === 'string' || typeof jsonOffers?.price === 'number'
    ? String(jsonOffers.price)
    : null;
  const jsonCurrency = typeof jsonOffers?.priceCurrency === 'string' ? jsonOffers.priceCurrency : null;

  const metaPrice =
    pickMeta($, [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[name="price"]',
      'meta[itemprop="price"]',
    ]) || null;

  const metaCurrency =
    pickMeta($, [
      'meta[property="product:price:currency"]',
      'meta[property="og:price:currency"]',
      'meta[itemprop="priceCurrency"]',
    ]) || null;

  const price = normalizePrice(jsonPrice || metaPrice);
  const currency = (jsonCurrency || metaCurrency || inferCurrency(jsonPrice || metaPrice)) ?? null;

  return {
    name: title?.trim() || null,
    imageUrl,
    price,
    currency,
  };
};

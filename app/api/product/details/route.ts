import { NextResponse } from 'next/server';
import { parseProductPage } from '@/lib/productParser';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.url) {
    return NextResponse.json({ details: null }, { status: 400 });
  }

  const details = await parseProductPage(body.url);
  return NextResponse.json({
    details: details
      ? {
          name: details.name,
          price: details.price,
          currency: details.currency,
          imageUrl: details.imageUrl,
        }
      : null,
  });
}

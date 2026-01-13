import { NextResponse } from 'next/server';
import { parseProductPage } from '@/lib/productParser';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.url) {
    return NextResponse.json({ imageUrl: null }, { status: 400 });
  }

  const details = await parseProductPage(body.url);
  const imageUrl = details?.imageUrl || null;
  return NextResponse.json({ imageUrl });
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const passcode = process.env.PARENT_ACCESS_CODE || '12345';

  if (!passcode) {
    return NextResponse.json({ error: 'PARENT_ACCESS_CODE is missing' }, { status: 500 });
  }

  if (!body?.passcode || body.passcode !== passcode) {
    return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('storkdrop_parent', '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return response;
}

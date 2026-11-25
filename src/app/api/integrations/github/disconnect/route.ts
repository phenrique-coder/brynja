import { NextResponse } from 'next/server';
import { GITHUB_SESSION_COOKIE } from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ disconnected: true });
  response.cookies.delete(GITHUB_SESSION_COOKIE);
  return response;
}

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    service: 'veredito-sec',
    mode: 'vercel-serverless-local-first',
    status: 'ok',
    database: 'browser-indexeddb',
    probes: 8,
  });
}

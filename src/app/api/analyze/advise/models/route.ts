import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/server/application/container';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ListModelsSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'custom']),
  apiKey: z.string().trim().min(6).max(500),
  endpointUrl: z.string().url().max(300).optional(),
});

export async function POST(req: NextRequest) {
  try {
    requireGitHubSession(req);
    const body = ListModelsSchema.parse(await req.json());
    const result = await getServerContainer().analyzeAdvise.listModels({
      provider: body.provider,
      apiKey: body.apiKey,
      endpointUrl: body.endpointUrl,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

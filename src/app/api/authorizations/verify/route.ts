import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/server/application/container';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const VerifyOwnershipSchema = z.object({
  challengeSeal: z.string().min(10, 'challengeSeal é obrigatório.'),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const body = VerifyOwnershipSchema.parse(await req.json());
    const result =
      await getServerContainer().targetAuthorizations.verifyOwnership({
        ownerGithubUserId: session.githubUserId,
        challengeSeal: body.challengeSeal,
      });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

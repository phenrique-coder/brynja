import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/server/application/container';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_MANIFEST_PATH =
  /^(?:[A-Za-z0-9._-]+\/)*(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|requirements\.txt|pyproject\.toml|go\.mod|go\.sum|Cargo\.toml|Cargo\.lock|pom\.xml|gradle\.lockfile|packages\.lock\.json|[A-Za-z0-9._-]+\.csproj|composer\.json|composer\.lock|Gemfile\.lock)$/;

const AnalyzeScaSchema = z.object({
  repositoryUrl: z.string().min(1, 'repositoryUrl é obrigatório').max(500),
  branch: z.string().min(1).max(120).optional().default('main'),
  manifestFiles: z
    .array(
      z.object({
        path: z
          .string()
          .regex(
            ALLOWED_MANIFEST_PATH,
            'Caminho de manifesto inválido ou não suportado.',
          ),
        content: z.string().min(1).max(2_000_000),
      }),
    )
    .max(10)
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const body = AnalyzeScaSchema.parse(await req.json());
    const result = await getServerContainer().analyzeSca.execute({
      repositoryUrl: body.repositoryUrl,
      branch: body.branch,
      accessToken: session.accessToken,
      manifestFiles: body.manifestFiles,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

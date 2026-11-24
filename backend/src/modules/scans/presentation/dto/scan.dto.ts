import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z, ZodSchema } from 'zod';

const ALLOWED_MANIFEST_PATH =
  /^(?:[A-Za-z0-9._-]+\/)*(package\.json|package-lock\.json|pnpm-lock\.yaml|requirements\.txt|pyproject\.toml)$/;

export const CreateScanSchema = z.object({
  repositoryUrl: z.string().min(1, 'repositoryUrl é obrigatório').max(500),
  branch: z.string().min(1).max(120).optional().default('main'),
  targetUrl: z
    .string()
    .url('targetUrl deve ser uma URL válida (http:// ou https://)')
    .optional()
    .nullable(),
  authorizationId: z.string().uuid().optional().nullable(),
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

export type CreateScanDto = z.infer<typeof CreateScanSchema>;

export const CreateAuthorizationSchema = z.object({
  targetUrl: z.string().url('Informe uma URL válida (ex.: https://staging.app.com)'),
  method: z.enum(['WELL_KNOWN_FILE', 'DNS_TXT', 'LOCAL_DEV_SANDBOX']),
});

export type CreateAuthorizationDto = z.infer<typeof CreateAuthorizationSchema>;

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dados de entrada inválidos.',
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    return parsed.data;
  }
}

---
name: nestjs-solid-architecture
description: >-
  Use this skill when building or modifying modules, domain ports, use cases,
  dependency injection providers, or Prisma adapters in backend/ (NestJS).
---

# NestJS Modular + SOLID

## Estrutura de Módulos (`backend/src/modules/<module>/`)

- `domain/`: Entidades, Value Objects, Policies e interfaces (`ports/`). Zero dependência de `@nestjs/*`, Prisma ou Axios/Fetch.
- `application/`: UseCases com método único `execute(input)`. Recebem ports via `@Inject(PORT_TOKEN)`.
- `infrastructure/`: Adapters concretos (Prisma, Git, parsers, clients HTTP, probes).
- `presentation/`: Controllers finos com validação explícita de DTOs e mapeamento de erros de domínio para HTTP status codes.

## Multi-Providers (OCP)
Registre coleções extensíveis (`DEPENDENCY_PARSERS`, `VULNERABILITY_PROVIDERS`, `SAFE_PROBES`) por meio de tokens no módulo para que novos parsers/fontes/sondas sejam adicionados apenas criando uma nova classe e registrando-a no array do provider.

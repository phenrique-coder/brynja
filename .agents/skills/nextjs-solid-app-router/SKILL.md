---
name: nextjs-solid-app-router
description: >-
  Use this skill when creating or refactoring routes, components, hooks,
  gateways, or presenters in frontend/ (Next.js App Router) following SOLID.
---

# Next.js App Router + SOLID

## Camadas em `frontend/src`

1. `app/`: Rotas, layouts, `loading.tsx`, `error.tsx`. Responsabilidade única de roteamento e composição.
2. `core/ports/`: Interfaces enxutas (ISP) para leitura, criação de scans, autorização de domínio e exportação (`IScanReader`, `IScanCreator`, `ITargetAuthorizer`, `IReportExporter`).
3. `core/gateways/`: Adapters HTTP concretos (`HttpScanGateway`) e mocks de teste (`InMemoryScanGateway`).
4. `features/<feature>/presenters/`: Funções puras de ordenação, filtragem e formatação.
5. `features/<feature>/components/`: Componentes visuais puros usando composição e registries (OCP).

## Regras de Verificação
- Nenhum componente visual deve chamar `fetch(...)` diretamente.
- Utilize Context/Factory para injetar o gateway concreto (DIP).
- Ao adicionar nova severidade ou tipo de achado, registre no mapa de estratégia em `presenters/` ou `registries/` sem editar lógica existente.

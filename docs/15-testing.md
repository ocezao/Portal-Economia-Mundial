# Documentacao de Testes Automatizados - CIN

Este documento descreve como executar e manter os testes automatizados do projeto (Vitest + Playwright).

## Estrutura Atual

```text
tests/
  setup.ts                 # Setup global do Vitest (jsdom, matchers, mocks)
  unit/                    # Testes unitarios
  integration/             # Testes de integracao
  utils/                   # Helpers de testes
  e2e/                     # Testes end-to-end (Playwright)
    *.spec.ts
```

## Stack

| Tipo | Ferramenta | Script |
| --- | --- | --- |
| Unit/Integration | Vitest | `npm test` |
| E2E | Playwright | `npm run test:e2e` |

## Setup (Primeira Vez)

```bash
npm install
npx playwright install
```

## Vitest

- Configuracao: `vitest.config.ts`
- Setup global: `tests/setup.ts`

Comandos:

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Playwright (E2E)

- Configuracao: `playwright.config.ts`
- Specs: `tests/e2e/*.spec.ts`

### Por que E2E usa servidor de producao?

Para estabilidade (especialmente em Windows), o E2E sobe um servidor com `npm run build && npm run start` em `http://127.0.0.1:3000`.

### Determinismo (locale e servicos externos)

O E2E forca:

- `locale: 'pt-BR'` + header `Accept-Language` (garante consistencia de formatacao e das assercoes).
- Flags de ambiente no `webServer.env` para evitar dependencias externas durante os testes:
  - `NEXT_PUBLIC_ENABLE_MARKET_TICKER=false`
  - `NEXT_PUBLIC_FINNHUB_ENABLED=false`
  - `EXTERNAL_SNAPSHOTS_REQUIRE=true`

Comandos:

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug

# Rodar um unico arquivo
npx playwright test tests/e2e/smoke.spec.ts

# Rodar um browser especifico
npx playwright test --project=chromium --workers=1
npx playwright test --project=firefox --workers=1
```

### Relatorios/artefatos

- Relatorio HTML: `playwright-report/` (ou `npx playwright show-report`)
- Artefatos por falha: `test-results/`

## Troubleshooting

- Se o E2E ficar instavel: rode com `--workers=1`.
- Para inspecionar flakiness: `trace: 'on-first-retry'` ja esta habilitado no `playwright.config.ts`.

# Deploy em VPS (Legado)

Este documento ficou como referencia historica do fluxo antigo com PM2.

Nao use este guia como fluxo de producao. O caminho oficial atual e:

- `docs/RUNBOOK.md`
- `docs/24-deploy-vps-execucao-manual.md`
- `docs/22-deploy-producao-checklist.md`

## O que mudou

- PM2 nao e mais o fluxo oficial.
- O deploy oficial usa Docker Compose com banco local.
- O banco principal da VPS e o `portal-database`.
- O healthcheck e validado pela stack Docker e pelas rotas HTTP publicas.

## Referencia oficial

Use `docs/RUNBOOK.md` para operacao e `docs/24-deploy-vps-execucao-manual.md` para execucao manual.

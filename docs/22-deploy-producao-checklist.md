# Checklist de Deploy em Producao

## Escopo

Checklist realista para subir o portal com o fluxo oficial de producao:

- app Next.js
- PostgreSQL local
- uploads locais
- auth local
- API editorial v1 para LLMs
- cron editorial
- Docker Compose como orquestrador oficial

Status desta revisao: 2026-04-02

## Estado real resumido

- build da aplicacao: passando
- stack Docker oficial: validada na VPS
- web/api/collector/database: saudaveis na ultima validacao
- suite editorial dedicada: passando
- suite global de testes: com passivo legado
- lint global: com passivo relevante

## 1. Aplicacao

- [x] `npm run build` passa
- [ ] `npm run lint` passa sem passivo relevante
- [ ] `npm run test` passa por completo
- [x] namespace `/api/v1/editorial` implementado
- [x] OpenAPI editorial exposto
- [x] workflow editorial enforced no backend

## 2. Banco de dados

- [x] `DB_NAME`, `DB_USER` e `DB_PASSWORD` configurados na VPS
- [x] banco local acessivel pelo app em producao
- [x] migrations aplicadas
- [ ] backup de banco validado
- [ ] restore de banco testado

## 3. Uploads

- [x] diretorio de uploads persistente configurado
- [x] permissao de escrita validada
- [ ] backup de uploads validado
- [ ] restauracao de uploads validada

## 4. Autenticacao

- [ ] auth local validado em producao
- [ ] usuario admin funcional
- [ ] `EDITORIAL_API_KEY` provisionada
- [ ] `EDITORIAL_API_KEY` validada via `/api/v1/editorial/auth`
- [ ] `CRON_API_SECRET` provisionado separadamente

## 5. Operacao editorial por LLM

- [x] discovery em `/api/v1/editorial`
- [x] auth check em `/api/v1/editorial/auth`
- [x] `meta`, `slug`, `articles`, `sources`, `enrich`, `validate`, `approve`, `publish`, `schedule`, `jobs`
- [x] runbook editorial documentado
- [x] testes dedicados de fluxo editorial criados
- [ ] executor/agente externo configurado com segredo real
- [ ] smoke test real contra ambiente de producao

## 6. Cron e jobs

- [ ] scheduler chamando `POST /api/cron?type=editorial-jobs`
- [ ] header `x-cron-secret` validado
- [ ] jobs `queued` indo para `completed`
- [ ] publicacao agendada comprovada em producao

## 7. Infraestrutura web

- [x] reverse proxy configurado
- [x] HTTPS valido
- [x] dominio principal apontado
- [x] healthcheck publico respondendo
- [ ] reinicio da aplicacao documentado

## 8. Observabilidade

- [x] logs da aplicacao acessiveis
- [ ] logs de cron acessiveis
- [x] monitoramento de `/api/health`
- [ ] monitoramento de fila editorial
- [ ] alerta para jobs falhos

## 9. Seguranca

- [ ] segredos fora do repositorio
- [ ] `EDITORIAL_API_KEY` nao reutilizada como segredo geral
- [ ] `CRON_API_SECRET` nao reutilizado como segredo editorial
- [ ] acesso administrativo restrito
- [ ] backup protegido

## 10. Go-live editorial

- [ ] criar draft real
- [ ] adicionar fonte real
- [ ] executar enrich
- [ ] validar
- [ ] aprovar
- [ ] agendar
- [ ] cron publicar
- [ ] artigo aparecer no site

## Criterio de pronto

So considerar deploy editorial pronto quando todos os itens abaixo forem verdadeiros:

1. app sobe com `DATABASE_URL`
2. auth local funciona
3. `EDITORIAL_API_KEY` funciona
4. cron editorial funciona
5. um artigo real percorre `draft -> validate -> approve -> schedule -> publish`
6. healthcheck responde
7. logs e backup estao operacionais

## O que ainda nao pode ser afirmado hoje

Nao e correto afirmar nesta data que:

- a VPS esta 100% normalizada
- o deploy esta 95% comprovado
- a suite global de testes esta verde
- a operacao editorial por LLM esta tranquila em producao

Esses pontos ainda dependem de validacao operacional real.

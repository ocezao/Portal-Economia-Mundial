# Runbook - Operacao Editorial por LLM

## Objetivo

Padronizar a operacao de um agente externo que cria, valida, aprova, agenda e publica artigos pela API editorial.

## Dependencias minimas

- `EDITORIAL_API_KEY`
- `DATABASE_URL`
- `CRON_API_SECRET`
- endpoint publico da aplicacao acessivel pelo agente

## Segredos e injecao

Segredos necessarios:

- o agente recebe `EDITORIAL_API_KEY`
- o scheduler recebe `CRON_API_SECRET`

Regra:

- nunca reutilizar `CRON_API_SECRET` como credencial editorial
- nunca expor `EDITORIAL_API_KEY` em prompt, log ou codigo versionado

## Checklist de bootstrap do agente

1. validar base URL
2. chamar `GET /api/v1/editorial`
3. chamar `GET /api/v1/editorial/auth`
4. chamar `GET /api/v1/editorial/meta`
5. confirmar que ha autores ativos e categorias validas

Se qualquer um desses passos falhar, a operacao deve parar antes de criar artigo.

## Workflow obrigatorio

1. gerar ou validar slug
2. fazer upload da imagem, se necessario
3. criar artigo em `draft`
4. persistir fontes
5. enriquecer SEO/FAQ
6. validar artigo
7. aprovar artigo
8. publicar imediatamente ou agendar
9. monitorar jobs

## Regras de bloqueio

O agente nao deve tentar pular estas etapas:

- nao criar em `published`
- nao publicar sem aprovacao
- nao agendar sem aprovacao
- nao publicar sem fontes persistidas

## Cron editorial

O cron de jobs deve chamar:

- `POST /api/cron?type=editorial-jobs`

Header obrigatorio:

- `x-cron-secret: <CRON_API_SECRET>`

Frequencia recomendada:

- a cada 1 minuto, se o volume de agendamento justificar
- a cada 5 minutos, em operacao editorial leve

## Monitoramento minimo

Conferir:

- `GET /api/v1/editorial/jobs`
- `GET /api/health`

Sinais de alerta:

- jobs `queued` acumulando
- jobs `failed`
- artigos `scheduled` que nao viram `published`
- falhas repetidas `UNAUTHORIZED` ou `VALIDATION_REQUIRED`

## Tratamento de falhas

### `UNAUTHORIZED`

- validar `EDITORIAL_API_KEY`
- validar se o agente esta usando a base URL correta

### `WORKFLOW_CONFLICT`

- revisar a ordem das chamadas
- recriar a etapa a partir de `draft`

### `VALIDATION_REQUIRED`

- chamar `GET /validate`
- corrigir erros estruturais
- repetir `approve` antes de `publish` ou `schedule`

### `NOT_FOUND`

- revisar `id`
- revisar `lookup=slug`

## Rotacao de segredo editorial

1. gerar nova chave
2. atualizar ambiente da aplicacao
3. atualizar segredo do executor/agente
4. validar nova chave em `/api/v1/editorial/auth`
5. remover a chave antiga

## Evidencia operacional minima antes de chamar a stack de tranquila

- auth validada por rota
- criacao em draft validada
- validacao e aprovacao testadas
- publicacao e agendamento testados
- cron editorial operacional
- jobs visiveis e monitoraveis

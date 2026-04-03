# Editorial API for LLMs

Base path: `/api/v1/editorial`

Auth:
- `Authorization: Bearer <EDITORIAL_API_KEY>`
- `x-api-key: <EDITORIAL_API_KEY>`
- Sessao admin same-origin tambem funciona

Importante:
- a API nao gera credenciais
- a chave precisa ser provisionada no servidor via `EDITORIAL_API_KEY`
- para agentes externos, o fluxo correto e receber essa chave por ambiente secreto
- `CRON_API_SECRET` nao deve ser usado como credencial editorial

## Requisitos operacionais

Variaveis minimas para o agente editorial operar:

- `EDITORIAL_API_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL` ou base URL equivalente

Variaveis adicionais para agendamento e jobs:

- `CRON_API_SECRET`
- scheduler externo chamando `POST /api/cron?type=editorial-jobs`

Sem `EDITORIAL_API_KEY`, a LLM nao consegue autenticar.
Sem `DATABASE_URL`, a API nao persiste artigos, fontes e jobs.
Sem cron, artigos agendados nao serao publicados automaticamente.

## Provisionamento da chave

Fluxo recomendado:

1. gerar um segredo forte fora do codigo
2. definir `EDITORIAL_API_KEY` no ambiente do servidor
3. injetar a mesma chave no ambiente secreto do executor/agente
4. validar a chave com `GET /api/v1/editorial/auth` antes de operar

Exemplo de geracao local:

```bash
openssl rand -hex 32
```

## Rotacao da chave

Fluxo minimo recomendado:

1. gerar nova chave
2. atualizar o servidor com a nova `EDITORIAL_API_KEY`
3. atualizar o segredo do executor/agente
4. validar a nova chave em `/api/v1/editorial/auth`
5. revogar a chave antiga removendo-a do ambiente

Hoje a API aceita uma chave editorial por vez.
Se for necessario zero-downtime na rotacao, o proximo passo tecnico e suportar chave primaria + secundaria.

## Discovery

`GET /api/v1/editorial`
- resumo da API e links principais

`GET /api/v1/editorial/openapi`
- contrato OpenAPI JSON

`GET /api/v1/editorial/auth`
- verifica se a credencial recebida esta valida
- retorna `authenticated: true` quando a chave ou sessao funciona

`GET /api/v1/editorial/meta`
- autores ativos
- categorias
- enums de status

`GET /api/v1/editorial/readiness`
- readiness operacional da API editorial
- checa banco, uploads, segredos e contagem de jobs

`GET /api/v1/editorial/context/market`
- contexto economico resumido
- indices, commodities, setores, noticias de mercado, calendario economico e earnings

`GET /api/v1/editorial/jobs`
- lista jobs editoriais

`POST /api/v1/editorial/jobs/dispatch`
- executa jobs elegiveis

`GET /api/v1/editorial/slug?title=Novo%20post`
- gera e valida slug

## Articles

`GET /api/v1/editorial/articles`
- filtros: `page`, `perPage`, `search`, `category`, `status`, `author`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`

`POST /api/v1/editorial/articles`
- cria artigo
- fluxo atual exige criacao inicial em `draft`

`GET /api/v1/editorial/articles/{id}?lookup=slug`
- busca artigo por slug

`PATCH /api/v1/editorial/articles/{id}?lookup=slug`
- atualiza artigo

`GET /api/v1/editorial/articles/{id}/validate?lookup=slug`
- valida prontidao editorial

`POST /api/v1/editorial/articles/{id}/approve?lookup=slug`
- aprova editorialmente

`POST /api/v1/editorial/articles/{id}/sources?lookup=slug`
- adiciona fonte

`DELETE /api/v1/editorial/articles/{id}/sources/{sourceId}?lookup=slug`
- remove fonte

`POST /api/v1/editorial/articles/{id}/enrich?lookup=slug`
- enriquece SEO e FAQ

`GET /api/v1/editorial/articles/{id}/seo-audit?lookup=slug`
- audita SEO/AEO do artigo
- retorna issues, checks e sugestoes de melhoria

`GET /api/v1/editorial/articles/{id}/internal-links?lookup=slug`
- sugere links internos relevantes

`GET /api/v1/editorial/articles/{id}/similar?lookup=slug`
- lista artigos parecidos para evitar duplicidade

`POST /api/v1/editorial/articles/{id}/publish?lookup=slug`
- publica imediatamente
- exige artigo aprovado e validado sem erros

`POST /api/v1/editorial/articles/{id}/schedule?lookup=slug`
- agenda publicacao futura
- exige artigo aprovado e validado sem erros

## Uploads

`POST /api/v1/editorial/uploads`
- `multipart/form-data`
- campo obrigatorio: `file`
- campos opcionais: `width`, `height`, `quality`, `watermark`, `keepMetadata`

`GET /api/v1/editorial/uploads/library`
- lista arquivos ja disponiveis em `public/uploads`
- filtros: `dir`, `search`, `limit`

## Minimal create example

Precondicoes importantes para qualquer agente:

- `coverImage` deve apontar para asset local valido em `/uploads/...` ou `/images/...`
- nao use URL externa em `coverImage`
- o caminho recomendado e sempre:
  1. `GET /uploads/library` para tentar reutilizar imagem existente
  2. `POST /uploads` se precisar subir uma imagem nova
  3. reutilizar `data.file.url` retornado pelo upload
- criacao e sempre em `draft`
- publicacao e agendamento nao devem ser feitos via `PATCH`

```bash
curl -X POST "https://seu-dominio/api/v1/editorial/articles" \
  -H "Authorization: Bearer $EDITORIAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fed sinaliza nova rodada de cortes",
    "slug": "fed-sinaliza-nova-rodada-de-cortes",
    "excerpt": "Resumo curto do artigo.",
    "content": "<p>Conteudo completo em HTML.</p>",
    "category": "economia",
    "authorId": "ana-silva",
    "coverImage": "/uploads/2026/04/capa.webp",
    "status": "draft"
  }'
```

## Scheduling example

```bash
curl -X POST "https://seu-dominio/api/v1/editorial/articles/fed-sinaliza-nova-rodada-de-cortes/schedule?lookup=slug" \
  -H "x-api-key: $EDITORIAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "publishedAt": "2026-04-02T12:30:00-03:00"
  }'
```

## Operational note

Agendamentos dependem de um cron chamando:
- `/api/cron?type=editorial-jobs`
- ou `/api/cron?type=publish-scheduled`

Exemplo com segredo de cron:

```bash
curl -X POST "https://seu-dominio/api/cron?type=editorial-jobs" \
  -H "x-cron-secret: $CRON_API_SECRET"
```

## Recommended agent flow

1. `GET /api/v1/editorial`
2. `GET /api/v1/editorial/auth`
3. `GET /api/v1/editorial/readiness`
4. `GET /api/v1/editorial/meta`
5. `GET /api/v1/editorial/context/market`
6. `GET /api/v1/editorial/slug?title=...`
7. `GET /api/v1/editorial/uploads/library` se quiser reutilizar asset
8. `POST /api/v1/editorial/uploads` se precisar imagem nova
9. `POST /api/v1/editorial/articles`
10. `GET /api/v1/editorial/articles/{id}/similar`
11. `POST /api/v1/editorial/articles/{id}/sources`
12. `POST /api/v1/editorial/articles/{id}/enrich`
13. `GET /api/v1/editorial/articles/{id}/seo-audit`
14. `GET /api/v1/editorial/articles/{id}/internal-links`
15. `GET /api/v1/editorial/articles/{id}/validate`
16. `POST /api/v1/editorial/articles/{id}/approve`
17. `POST /api/v1/editorial/articles/{id}/schedule` ou `publish`
18. `GET /api/v1/editorial/jobs`

Regras operacionais:

- nao tentar criar artigo ja em `published`
- nao tentar publicar ou agendar via `PATCH /articles/{id}`
- nao tentar `approve` sem antes passar em `validate`
- nao tentar `publish` ou `schedule` sem `approve`
- sempre persistir pelo menos uma fonte antes de publicar
- sempre garantir `seoTitle`, `metaDescription`, `tags` e `faqItems` antes de publicar
- `coverImage` precisa resolver para arquivo local existente; se a imagem nao existir, `validate` deve falhar
- usar `similar` antes de criar novo artigo quando houver risco de canibalizacao
- usar `seo-audit` e `internal-links` antes de publicar
- usar `market` para contextualizar artigos economicos e geoeconomicos
- tratar `409 VALIDATION_REQUIRED` como sinal para corrigir o fluxo, nao como erro transiente
- usar `GET /api/v1/editorial/jobs` para acompanhar fila e falhas

## Response format

As rotas editoriais retornam envelope padrao:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-01T12:00:00.000Z",
    "version": "1.2.0"
  }
}
```

Erros retornam:

```json
{
  "ok": false,
  "error": {
    "message": "descricao",
    "code": "CODIGO_ESTAVEL"
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-01T12:00:00.000Z",
    "version": "1.2.0"
  }
}
```

Codigos relevantes para agentes:

- `UNAUTHORIZED`
- `INVALID_PAYLOAD`
- `INVALID_QUERY`
- `NOT_FOUND`
- `WORKFLOW_CONFLICT`
- `VALIDATION_REQUIRED`

Tratamento recomendado:

- `UNAUTHORIZED`: verificar segredo e base URL
- `INVALID_PAYLOAD`: corrigir corpo enviado
- `INVALID_QUERY`: corrigir filtros ou lookup
- `NOT_FOUND`: revisar `id` ou `lookup=slug`
- `WORKFLOW_CONFLICT`: corrigir ordem do fluxo editorial
- `VALIDATION_REQUIRED`: consultar `/validate`, corrigir pendencias e repetir a etapa correta

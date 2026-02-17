# RELATORIO SUBAGENTE B - SUPABASE (STORAGE/ANALYTICS)

Data: 2026-02-13 (registro historico)

Este documento descreve a validacao operacional feita no Supabase (bucket de storage e escrita de evento de analytics).
Os valores sensiveis (secrets, senhas e JWT secret) foram removidos deste relatorio por seguranca.

## 1) Storage bucket para uploads

Objetivo:
- Garantir um bucket publico (leitura) para servir midia do portal.
- Permitir upload autenticado, respeitando as politicas de storage.

Variavel usada pelo app:
- `SUPABASE_UPLOAD_BUCKET` (default do codigo: `uploads`)
  - Rotas que usam: `src/app/api/upload/route.ts`, `src/app/api/admin-files/route.ts`

Checklist (esperado):
- Bucket existe no Supabase Storage.
- Bucket e publico para leitura (para `getPublicUrl` funcionar sem signed URL).
- Tipos relevantes permitidos:
  - `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/avif`, `image/svg+xml`

## 2) Evidencia de upload

Validacao:
- Um arquivo simples foi enviado ao bucket e acessado via URL publica do Supabase Storage.

Resultado:
- Upload OK
- URL publica OK

## 3) Analytics (tabela de eventos)

Contexto:
- O projeto possui stack de analytics separada (`collector/` + Postgres + Metabase).
- Em alguns cenarios, pode-se optar por gravar eventos no Postgres do Supabase, dependendo da arquitetura escolhida.

Validacao registrada:
- Insercao de um evento de teste em uma tabela de eventos (ex: `analytics_events`) foi confirmada.

Observacao:
- Se o collector estiver configurado para Postgres local (VPS), este passo e apenas uma validacao de capacidade do Supabase, nao uma obrigacao arquitetural.

## 4) Politicas RLS (Storage)

Ponto de atencao:
- Politicas de storage devem refletir o modelo de acesso do produto.

Baseline comum:
- SELECT publico para servir imagens.
- INSERT/UPDATE/DELETE restrito (autenticado e/ou admin), conforme necessidade.

## 5) Variaveis de ambiente (sem secrets)

Exemplo (nao commitar valores reais):
```env
SUPABASE_UPLOAD_BUCKET=media
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
```


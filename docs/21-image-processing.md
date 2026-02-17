# Upload e Processamento de Imagens (CIN)

Este documento descreve o fluxo real de upload de midia no CIN, incluindo conversao para WebP e suporte a SVG.

## Visao geral

- Upload e feito via API interna: `POST /api/upload`.
- Imagens raster sao processadas com Sharp e armazenadas como `.webp`.
- Arquivos vetoriais (`.svg`) sao armazenados como `.svg` (sem conversao).
- Os arquivos sao gravados no Supabase Storage no bucket definido por `SUPABASE_UPLOAD_BUCKET` (default: `uploads`).
- O path de storage segue o padrao: `yyyy/mm/<uuid>.(webp|svg)`.

## Painel admin

- Pagina: `/admin/arquivos`
  - Upload (usa `POST /api/upload`)
  - Listagem/Busca/Filtro/Exclusao (usa `GET|DELETE /api/admin-files`)
  - Copia de URL publica

Arquivos relevantes:
- `src/app/admin/arquivos/page.tsx`
- `src/components/upload/ImageUploader.tsx`

## API

### `POST /api/upload`

Auth:
- Obrigatorio: `Authorization: Bearer <access_token>` (token da sessao Supabase)
- Permissao: admin-only (checado via role do usuario)

Limites (baseline atual):
- Tamanho maximo: 10MB
- Rate limit best-effort: 30 uploads/min por IP

Tipos aceitos:
- Raster: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`
- Vetor: `image/svg+xml` (ou fallback por extensao `.svg`)

Campos (multipart/form-data):
- `file` (obrigatorio)
- `quality` (opcional, 1-95, default 85) para raster
- `width`, `height` (opcional) para raster (clamp em 4096)
- `watermark` (opcional: `true|false`) para raster
- `keepMetadata` (opcional: `true|false`) para raster

Comportamento raster:
- Conversao para WebP
- Resize opcional (fit inside, sem enlarging)
- Metadados removidos por padrao (preserva apenas se `keepMetadata=true`)

Comportamento SVG:
- Armazenado como `.svg`
- Validacao basica para recusar SVGs com conteudo potencialmente inseguro:
  - `<script ...>`
  - atributos `on*=` (handlers inline)
  - `javascript:`
  - `<foreignObject ...>`
  - `<!ENTITY ...>`

Arquivo: `src/app/api/upload/route.ts`

### `GET|DELETE /api/admin-files`

Listagem recursiva e exclusao de arquivos do bucket de upload.

Auth:
- Obrigatorio: `Authorization: Bearer <access_token>`
- Permissao: `profiles.role = 'admin'`

Bucket:
- `SUPABASE_UPLOAD_BUCKET` (default: `uploads`)

`GET /api/admin-files` retorna:
- `{ ok, bucket, files[] }`
- `files[]` inclui: `name`, `path`, `size`, `contentType`, `updatedAt`, `publicUrl`, `isVector`

`DELETE /api/admin-files` body:
```json
{ "path": "yyyy/mm/uuid.webp" }
```

Arquivo: `src/app/api/admin-files/route.ts`

## Variaveis de ambiente

- `SUPABASE_UPLOAD_BUCKET` (opcional; default: `uploads`)

## Referencias no codigo

- `src/app/api/upload/route.ts`
- `src/app/api/admin-files/route.ts`

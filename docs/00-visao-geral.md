# Cenario Internacional - VisÃ£o Geral

## Sobre o Projeto

O **Cenario Internacional (CIN)** Ã© um portal de notÃ­cias profissional especializado em:

- **GeopolÃ­tica**: AnÃ¡lises de relaÃ§Ãµes internacionais, conflitos e diplomacia
- **Economia**: Mercados financeiros, polÃ­tica monetÃ¡ria e indicadores econÃ´micos
- **Tecnologia**: InovaÃ§Ã£o, inteligÃªncia artificial e transformaÃ§Ã£o digital

---

## Arquitetura

### Tecnologias

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js (App Router) + React + TypeScript |
| **EstilizaÃ§Ã£o** | Tailwind CSS + shadcn/ui |
| **Roteamento** | Next.js App Router (file-based) |
| **Estado** | React Hooks + LocalStorage |
| **Backend** | Supabase (Auth + Postgres + Edge Functions) |
| **Analytics** | PostgreSQL + Fastify + Metabase |
| **Build** | Next.js (`next build`) |

### Estrutura de Pastas

```
/src                    # AplicaÃ§Ã£o Next.js
  /app                  # App Router (pÃ¡ginas)
    /(auth)             # Rotas de autenticaÃ§Ã£o
    /(site)             # Rotas do site
    layout.tsx          # Root layout
    providers.tsx       # Providers globais (Theme/Auth/Toaster)
  /components            # Componentes React (UI/Layout/etc)
  /config                # ConfiguraÃ§Ãµes globais
  /contexts              # React Contexts (Auth, etc)
  /hooks                 # Custom hooks
  /lib                   # UtilitÃ¡rios
  /services              # ServiÃ§os e integraÃ§Ãµes
  /types                 # TypeScript types

/collector              # Analytics Backend (Node.js + Fastify)
  /src
    /db                 # PostgreSQL pool e migrations
    /routes             # Endpoints (/health, /collect)
    /plugins            # Rate limiting, dedupe
  /Dockerfile
  /package.json

/sdk                    # SDK Analytics Client
  /src                  # CÃ³digo fonte TypeScript
  /README.md            # DocumentaÃ§Ã£o do SDK

/supabase
  /functions            # Edge Functions (admin-users) - ai-news removido

/scripts                # UtilitÃ¡rios
  /verify.sh            # Script de validaÃ§Ã£o do sistema
  /partition-manager.sh # Gerenciamento de partiÃ§Ãµes

/docs                   # DocumentaÃ§Ã£o completa
/public
  /images/news          # Imagens dos artigos
```

---

## Funcionalidades Principais

### 1. Ticker de Mercado
- Scroll infinito com cotaÃ§Ãµes em tempo real
- AÃ§Ãµes, Ã­ndices, moedas e commodities
- SimulaÃ§Ã£o de atualizaÃ§Ãµes dinÃ¢micas

### 2. Sistema de Leitura
- Limite de 20% para nÃ£o-logados
- Tracking de progresso de leitura
- Limite configurÃ¡vel via banco (app_settings)

### 3. InteraÃ§Ãµes
- Favoritos (Supabase)
- HistÃ³rico de leitura
- Compartilhamento social
- RecomendaÃ§Ãµes de artigos

### 4. AutenticaÃ§Ã£o (Supabase)
- Login/Logout real
- Perfil e papel no banco
- Admin gerencia usuÃ¡rios

### 5. Busca de NotÃ­cias (GNews)
- Busca das notÃ­cias das Ãºltimas 48h (GNews)
- IntegraÃ§Ã£o direta com API de notÃ­cias
- (Funcionalidade de geraÃ§Ã£o de IA removida)

### 6. Upload de Midia (Admin)
- Upload e processamento via `POST /api/upload`
  - Raster: converte para WebP automaticamente
  - Vetor: aceita SVG e armazena como `.svg` (com validacoes basicas)
- Gestao de arquivos enviados no painel: `/admin/arquivos`
  - Lista/Busca/Filtra, copia URL publica e exclui arquivos (`GET|DELETE /api/admin-files`)

### 7. Analytics First-Party (Novo)
- Sistema 100% first-party, sem Google Analytics
- Coleta de eventos: page_view, article_read, scroll_depth
- DeduplicaÃ§Ã£o automÃ¡tica de eventos
- Painel Metabase para visualizaÃ§Ã£o
- Totalmente LGPD-compliant

---

## ConfiguraÃ§Ã£o

Todas as configuraÃ§Ãµes estÃ£o centralizadas em `/src/config/`:

- `app.ts`: Brand, contato, features
- `routes.ts`: Rotas e categorias
- `seo.ts`: Meta tags e JSON-LD
- `theme.css`: Design system
- `market.ts`: Dados de mercado
- `storage.ts`: LocalStorage keys
- `content.ts`: Categorias, autores, tags

---

## Desenvolvimento

```bash
# Instalar dependÃªncias
npm install

# Servidor de desenvolvimento (porta 5173)
npm run dev

# Build para produÃ§Ã£o
npm run build
```

### PadrÃ£o de Portas

| ServiÃ§o | Porta | ObrigatÃ³ria? | ObservaÃ§Ã£o |
|---------|-------|--------------|------------|
| **Frontend** | **5173** | âœ… Sim | Porta padrÃ£o do Vite, deve ser usada sempre |
| Analytics Collector | 3000 | âŒ NÃ£o | Apenas se usando sistema de analytics |
| Metabase | 3001 | âŒ NÃ£o | Apenas se usando analytics |
| PostgreSQL | 5432 | âŒ NÃ£o | Apenas se usando analytics |

âš ï¸ **Regra importante**: A porta 5173 Ã© obrigatÃ³ria para o frontend. 
- Se estiver ocupada, encerre o processo anterior: `taskkill /F /PID <PID>`
- **Sempre pergunte antes** de usar porta diferente
- Explique o motivo se precisar de outra porta

---

## Deploy

### Frontend (Hostinger)

```bash
npm run build
# SaÃ­da: /dist - pronto para upload
```

### Analytics (Docker)

```bash
# Subir toda a stack
docker-compose up -d

# Verificar saÃºde do sistema
./scripts/verify.sh
```

---

## DocumentaÃ§Ã£o do Analytics

| Documento | DescriÃ§Ã£o |
|-----------|-----------|
| [`04-analytics-first-party.md`](./04-analytics-first-party.md) | Arquitetura e especificaÃ§Ã£o |
| [`05-lgpd-compliance.md`](./05-lgpd-compliance.md) | Conformidade LGPD |
| [`09-event-schema.md`](./09-event-schema.md) | Schema completo de eventos |
| [`10-data-model-postgres.md`](./10-data-model-postgres.md) | Modelo de dados |
| [`14-deploy.md`](./14-deploy.md) | Guia de deploy |
| [`sdk/README.md`](../sdk/README.md) | SDK Client |

---

## PrÃ³ximos Passos

1. IntegraÃ§Ã£o com storage para imagens dos usuÃ¡rios
2. Inserir componente do AdSense real
3. Monitorar limites do Supabase
4. Newsletter (API + SMTP) com double opt-in pendente
5. ExpansÃ£o dos dashboards Metabase

---

**VersÃ£o:** 1.2.0  
**Ãšltima atualizaÃ§Ã£o:** 2026-02-16


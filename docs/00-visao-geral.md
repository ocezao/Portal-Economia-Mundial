# Portal Econômico Mundial - Visão Geral

## Sobre o Projeto

O **Portal Econômico Mundial (PEM)** é um portal de notícias profissional especializado em:

- **Geopolítica**: Análises de relações internacionais, conflitos e diplomacia
- **Economia**: Mercados financeiros, política monetária e indicadores econômicos
- **Tecnologia**: Inovação, inteligência artificial e transformação digital

---

## Arquitetura

### Tecnologias

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js (App Router) + React + TypeScript |
| **Estilização** | Tailwind CSS + shadcn/ui |
| **Roteamento** | Next.js App Router (file-based) |
| **Estado** | React Hooks + LocalStorage |
| **Backend** | Supabase (Auth + Postgres + Edge Functions) |
| **Analytics** | PostgreSQL + Fastify + Metabase |
| **Build** | Next.js (`next build`) |

### Estrutura de Pastas

```
/src                    # Aplicação Next.js
  /app                  # App Router (páginas)
    /(auth)             # Rotas de autenticação
    /(site)             # Rotas do site
    layout.tsx          # Root layout
    providers.tsx       # Providers globais (Theme/Auth/Toaster)
  /components            # Componentes React (UI/Layout/etc)
  /config                # Configurações globais
  /contexts              # React Contexts (Auth, etc)
  /hooks                 # Custom hooks
  /lib                   # Utilitários
  /services              # Serviços e integrações
  /types                 # TypeScript types

/collector              # Analytics Backend (Node.js + Fastify)
  /src
    /db                 # PostgreSQL pool e migrations
    /routes             # Endpoints (/health, /collect)
    /plugins            # Rate limiting, dedupe
  /Dockerfile
  /package.json

/sdk                    # SDK Analytics Client
  /src                  # Código fonte TypeScript
  /README.md            # Documentação do SDK

/supabase
  /functions            # Edge Functions (admin-users, ai-news)

/scripts                # Utilitários
  /verify.sh            # Script de validação do sistema
  /partition-manager.sh # Gerenciamento de partições

/docs                   # Documentação completa
/public
  /images/news          # Imagens dos artigos
```

---

## Funcionalidades Principais

### 1. Ticker de Mercado
- Scroll infinito com cotações em tempo real
- Ações, índices, moedas e commodities
- Simulação de atualizações dinâmicas

### 2. Sistema de Leitura
- Limite de 20% para não-logados
- Questionário para desbloqueio
- Tracking de progresso de leitura
- Limite configurável via banco (app_settings)

### 3. Interações
- Favoritos (Supabase)
- Histórico de leitura
- Compartilhamento social
- Recomendações de artigos

### 4. Autenticação (Supabase)
- Login/Logout real
- Perfil e papel no banco
- Admin gerencia usuários

### 5. IA para Criação de Notícias
- Busca das notícias das últimas 48h (GNews)
- Geração de texto (OpenRouter)
- Botão "Gerar Notícia" no admin
- Você escolhe tema e perguntas antes de gerar

### 6. Analytics First-Party (Novo)
- Sistema 100% first-party, sem Google Analytics
- Coleta de eventos: page_view, article_read, scroll_depth
- Deduplicação automática de eventos
- Painel Metabase para visualização
- Totalmente LGPD-compliant

---

## Configuração

Todas as configurações estão centralizadas em `/src/config/`:

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
# Instalar dependências
npm install

# Servidor de desenvolvimento (porta 5173)
npm run dev

# Build para produção
npm run build
```

### Padrão de Portas

| Serviço | Porta | Obrigatória? | Observação |
|---------|-------|--------------|------------|
| **Frontend** | **5173** | ✅ Sim | Porta padrão do Vite, deve ser usada sempre |
| Analytics Collector | 3000 | ❌ Não | Apenas se usando sistema de analytics |
| Metabase | 3001 | ❌ Não | Apenas se usando analytics |
| PostgreSQL | 5432 | ❌ Não | Apenas se usando analytics |

⚠️ **Regra importante**: A porta 5173 é obrigatória para o frontend. 
- Se estiver ocupada, encerre o processo anterior: `taskkill /F /PID <PID>`
- **Sempre pergunte antes** de usar porta diferente
- Explique o motivo se precisar de outra porta

---

## Deploy

### Frontend (Hostinger)

```bash
npm run build
# Saída: /dist - pronto para upload
```

### Analytics (Docker)

```bash
# Subir toda a stack
docker-compose up -d

# Verificar saúde do sistema
./scripts/verify.sh
```

---

## Documentação do Analytics

| Documento | Descrição |
|-----------|-----------|
| [`04-analytics-first-party.md`](./04-analytics-first-party.md) | Arquitetura e especificação |
| [`05-lgpd-compliance.md`](./05-lgpd-compliance.md) | Conformidade LGPD |
| [`09-event-schema.md`](./09-event-schema.md) | Schema completo de eventos |
| [`10-data-model-postgres.md`](./10-data-model-postgres.md) | Modelo de dados |
| [`14-deploy.md`](./14-deploy.md) | Guia de deploy |
| [`sdk/README.md`](../sdk/README.md) | SDK Client |

---

## Próximos Passos

1. Integração com storage para imagens dos usuários
2. Inserir componente do AdSense real
3. Monitorar limites do Supabase
4. Newsletter real
5. Expansão dos dashboards Metabase

---

**Versão:** 1.2.0  
**Última atualização:** 2026-02-08

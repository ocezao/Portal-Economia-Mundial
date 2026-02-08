# Arquitetura do Portal Econômico Mundial

## Visão Geral da Arquitetura

O PEM possui arquitetura modular dividida em três grandes camadas:

1. **Frontend** - Next.js (App Router) com dados do Supabase
2. **Backend** - Supabase (Auth + Postgres + Edge Functions)
3. **Analytics** - Stack independente (PostgreSQL + Fastify + Metabase)

---

## Camadas da Aplicação

### 1. Presentation Layer (Frontend)

**Componentes de UI** (`/src/components`)
- `layout/`: Estrutura visual (Header, Footer, Ticker)
- `news/`: Componentes de notícias (Cards, ArticleContent)
- `interactive/`: Elementos interativos (SurveyForm)
- `ui/`: Componentes base shadcn/ui

**Páginas** (`/src/app`)
- Cada rota é uma pasta/arquivo no App Router (file-based)
- Layouts compartilhados via `layout.tsx`
- SEO via `metadata`/`generateMetadata`

### 2. Business Logic Layer

**Hooks Customizados** (`/src/hooks`)
- `useAuth`: Gerenciamento de autenticação
- `useBookmarks`: Favoritos do usuário
- `useMarket`: Dados de mercado em tempo real
- `useReadingProgress`: Tracking de leitura
- `useSurvey`: Questionário de desbloqueio
- `useReadingLimit`: Controle de limite de leitura
- `useAppSettings`: Configurações globais do app

**Serviços** (`/src/services`)
- `newsManager.ts`: CRUD de artigos no Supabase
- `comments/supabaseService.ts`: Comentários no Supabase
- `adminUsers.ts`: Administração de usuários via Edge Function
- `aiNews.ts`: Geração de notícias via Edge Function
- `appSettings.ts`: Configurações globais no banco

### 3. Data Layer

**Configurações** (`/src/config`)
- Centralização de todas as configurações
- Fácil manutenção e modificação
- Preparado para múltiplos ambientes

**Storage** (`/src/config/storage.ts`)
- Abstração do LocalStorage
- Tipagem forte
- Métodos específicos por entidade

---

## Analytics Layer (Independente)

A camada de Analytics opera separadamente do sistema principal, garantindo:
- **Isolamento**: Falhas no analytics não afetam o portal
- **Escalabilidade**: Pode ser movida para infraestrutura separada
- **Privacidade**: Dados pseudonimizados desde a coleta

### Componentes do Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Website    │  │  SDK Analytics│  │   localStorage      │  │
│  │  (React)     │◄─┤  (vanilla JS)│◄─┤   (offline queue)   │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────┘  │
└───────────────────────────┼────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COLLECTOR API (Node.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Fastify    │  │   Validate   │  │   Deduplication      │  │
│  │   Server     │──┤    Schema    │──┤   (LRU + DB)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │ Batch INSERT
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE (PostgreSQL)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Tabela: events_raw (particionada por mês)                  ││
│  │  • UNIQUE INDEX(event_id) por partição                      ││
│  │  • Índices GIN para JSONB                                   ││
│  │  • Deduplicação via ON CONFLICT                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD (Metabase)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Dashboard Real-time                                      ││
│  │  • Dashboard Editorial                                      ││
│  │  • Dashboard Técnico                                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Endpoints do Collector

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check do sistema |
| `/collect` | POST | Recebe eventos do cliente |

### Stack Tecnológico do Analytics

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| API | Fastify (Node.js) | Performance, baixo overhead |
| Database | PostgreSQL 15 | Particionamento nativo, familiaridade |
| Dashboard | Metabase | Open source, fácil configuração |
| Deploy | Docker Compose | Simplicidade, portabilidade |

---

## Edge Functions

### 1) admin-users
Responsável por:
- Criar usuário com senha
- Atualizar dados
- Redefinir senha
- Excluir usuário

Arquivo: `supabase/functions/admin-users/index.ts`

### 2) ai-news
Responsável por:
- Buscar notícias das últimas 48h (GNews)
- Gerar conteúdo via OpenRouter

Arquivo: `supabase/functions/ai-news/index.ts`

---

## Padrões de Design

### Componentes Semânticos
- Uso estrito de tags HTML semânticas
- Proibido uso de `<div>` para layout
- Acessibilidade (ARIA labels, skip links)

### Config-Driven Development
- Nenhum valor hardcoded
- Todas as configurações em `/config`
- Facilita manutenção e internacionalização

### Future-Proof Services
- Interfaces bem definidas
- Serviços com backend real no Supabase
- DTOs preparados para API real

---

## Fluxo de Dados

### Portal (Frontend)
```
Usuário → Componente → Hook → Service → Storage/API
                ↓
            Config
```

### Analytics
```
Browser → SDK → Collector → PostgreSQL → Metabase
              ↓
         verify.sh (validação)
```

---

## Preparação para Backend

### Services Interface

```typescript
// Atual (Mock)
export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return mockArticles.find(article => article.slug === slug);
}

// Futuro (API)
export async function getArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const response = await fetch(`/api/articles/${slug}`);
  return response.json();
}
```

### Storage Migration Path

1. **Fase 1**: LocalStorage (atual)
2. **Fase 2**: IndexedDB para maior capacidade
3. **Fase 3**: Sync com backend quando online

### Auth Evolution

1. **Fase 1**: Supabase Auth (atual)
2. **Fase 2**: OAuth (Google, Apple, etc.)

---

## Performance

### Otimizações Implementadas
- Lazy loading de imagens
- Code splitting por rota
- Debounce em inputs de busca
- RAF para scroll tracking

### Métricas de Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 90

---

## Segurança

### Medidas Atuais
- Sanitização de HTML (conteúdo de artigos)
- XSS protection via React
- CSRF tokens prontos para implementação
- Hash de IPs no analytics (LGPD)

### Futuras Implementações
- Content Security Policy
- Rate limiting no collector
- Input validation no backend

---

## Validação do Sistema

Para garantir que todo o sistema está funcionando:

```bash
# Validar analytics
./scripts/verify.sh
```

Este script verifica:
1. PostgreSQL healthy
2. Partições criadas automaticamente
3. UNIQUE INDEX(event_id) nas partições
4. Collector /health respondendo
5. POST /collect funcionando
6. Deduplicação funcionando

---

**Data de criação:** 2024-01-10  
**Última atualização:** 2024-02-03 (adicionado Analytics Layer)

# Arquitetura do Cenario Internacional

## VisÃ£o Geral da Arquitetura

O CIN possui arquitetura modular dividida em trÃªs grandes camadas:

1. **Frontend** - Next.js (App Router) com dados do Supabase
2. **Backend** - Supabase (Auth + Postgres + Edge Functions)
3. **Analytics** - Stack independente (PostgreSQL + Fastify + Metabase)

---

## Camadas da AplicaÃ§Ã£o

### 1. Presentation Layer (Frontend)

**Componentes de UI** (`/src/components`)
- `layout/`: Estrutura visual (Header, Footer, Ticker)
- `news/`: Componentes de notÃ­cias (Cards, ArticleContent)
- `ui/`: Componentes base shadcn/ui

**PÃ¡ginas** (`/src/app`)
- Cada rota Ã© uma pasta/arquivo no App Router (file-based)
- Layouts compartilhados via `layout.tsx`
- SEO via `metadata`/`generateMetadata`

### 2. Business Logic Layer

**Hooks Customizados** (`/src/hooks`)
- `useAuth`: Gerenciamento de autenticaÃ§Ã£o
- `useBookmarks`: Favoritos do usuÃ¡rio
- `useFinnhub`: Dados de mercado em tempo real
- `useReadingProgress`: Tracking de leitura

**Servicos** (`/src/services`)
- `newsManager.ts`: CRUD de artigos no Supabase (inclui regras para vincular posts a um autor/profissional)
- `comments/supabaseService.ts`: Comentarios no Supabase
- `adminUsers.ts`: Administracao de usuarios (admin)
- `adminPosts.ts`: Operacoes admin de posts (ex: publicar agendados)

### 3. Data Layer

**ConfiguraÃ§Ãµes** (`/src/config`)
- CentralizaÃ§Ã£o de todas as configuraÃ§Ãµes
- FÃ¡cil manutenÃ§Ã£o e modificaÃ§Ã£o
- Preparado para mÃºltiplos ambientes

**Storage** (`/src/config/storage.ts`)
- AbstraÃ§Ã£o do LocalStorage
- Tipagem forte
- MÃ©todos especÃ­ficos por entidade

**Security** (`/src/lib/security.ts`)
- `escapeHtml`: PrevenÃ§Ã£o de XSS
- `sanitizeFilename`: SanitizaÃ§Ã£o de nomes de arquivo
- `escapeLikePattern`: Escaping de wildcards SQL para queries LIKE seguras
- `isValidEmail`: ValidaÃ§Ã£o de formato de email
- `sanitizeText`: SanitizaÃ§Ã£o bÃ¡sica de texto

> ðŸ“– Ver detalhes em [Guia de SeguranÃ§a para Desenvolvedores](./_security/GUIA_SEGURANCA_DESENVOLVEDORES.md)

---

## Analytics Layer (Independente)

A camada de Analytics opera separadamente do sistema principal, garantindo:
- **Isolamento**: Falhas no analytics nÃ£o afetam o portal
- **Escalabilidade**: Pode ser movida para infraestrutura separada
- **Privacidade**: Dados pseudonimizados desde a coleta

### Componentes do Analytics

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         CLIENTE (Browser)                        â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚   Website    â”‚  â”‚  SDK Analyticsâ”‚  â”‚   localStorage      â”‚  â”‚
â”‚  â”‚  (React)     â”‚â—„â”€â”¤  (vanilla JS)â”‚â—„â”€â”¤   (offline queue)   â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚ HTTPS
                            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    COLLECTOR API (Node.js)                       â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚   Fastify    â”‚  â”‚   Validate   â”‚  â”‚   Deduplication      â”‚  â”‚
â”‚  â”‚   Server     â”‚â”€â”€â”¤    Schema    â”‚â”€â”€â”¤   (LRU + DB)         â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚ Batch INSERT
                            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    STORAGE (PostgreSQL)                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚  Tabela: events_raw (particionada por mÃªs)                  â”‚â”‚
â”‚  â”‚  â€¢ UNIQUE INDEX(event_id) por partiÃ§Ã£o                      â”‚â”‚
â”‚  â”‚  â€¢ Ãndices GIN para JSONB                                   â”‚â”‚
â”‚  â”‚  â€¢ DeduplicaÃ§Ã£o via ON CONFLICT                             â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚
                            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      DASHBOARD (Metabase)                        â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”â”‚
â”‚  â”‚  â€¢ Dashboard Real-time                                      â”‚â”‚
â”‚  â”‚  â€¢ Dashboard Editorial                                      â”‚â”‚
â”‚  â”‚  â€¢ Dashboard TÃ©cnico                                        â”‚â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Endpoints do Collector

| Endpoint | MÃ©todo | DescriÃ§Ã£o |
|----------|--------|-----------|
| `/health` | GET | Health check do sistema |
| `/collect` | POST | Recebe eventos do cliente |

### Stack TecnolÃ³gico do Analytics

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| API | Fastify (Node.js) | Performance, baixo overhead |
| Database | PostgreSQL 15 | Particionamento nativo, familiaridade |
| Dashboard | Metabase | Open source, fÃ¡cil configuraÃ§Ã£o |
| Deploy | Docker Compose | Simplicidade, portabilidade |

---

## Edge Functions

### 1) admin-users
ResponsÃ¡vel por:
- Criar usuÃ¡rio com senha
- Atualizar dados
- Redefinir senha
- Excluir usuÃ¡rio

Arquivo: `supabase/functions/admin-users/index.ts`

### 2) ai-news (REMOVIDO)
âš ï¸ **REMOVIDO**: Esta Edge Function foi descontinuada.
- A funcionalidade de geraÃ§Ã£o de conteÃºdo via provedor de IA foi removida
- Para busca de notÃ­cias, usar a API GNews diretamente

---

## PadrÃµes de Design

### Componentes SemÃ¢nticos
- Uso estrito de tags HTML semÃ¢nticas
- Proibido uso de `<div>` para layout
- Acessibilidade (ARIA labels, skip links)

### Config-Driven Development
- Nenhum valor hardcoded
- Todas as configuraÃ§Ãµes em `/config`
- Facilita manutenÃ§Ã£o e internacionalizaÃ§Ã£o

### Future-Proof Services
- Interfaces bem definidas
- ServiÃ§os com backend real no Supabase
- DTOs preparados para API real

---

## Fluxo de Dados

### Portal (Frontend)
```
UsuÃ¡rio â†’ Componente â†’ Hook â†’ Service â†’ Storage/API
                â†“
            Config
```

### Analytics
```
Browser â†’ SDK â†’ Collector â†’ PostgreSQL â†’ Metabase
              â†“
         verify.sh (validaÃ§Ã£o)
```

---

## PreparaÃ§Ã£o para Backend

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

### OtimizaÃ§Ãµes Implementadas
- Lazy loading de imagens
- Code splitting por rota
- Debounce em inputs de busca
- RAF para scroll tracking

### MÃ©tricas de Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 90

---

## SeguranÃ§a

### Medidas Atuais
- SanitizaÃ§Ã£o de HTML (conteÃºdo de artigos)
- XSS protection via React
- CSRF tokens prontos para implementaÃ§Ã£o
- Hash de IPs no analytics (LGPD)

### Futuras ImplementaÃ§Ãµes
- Content Security Policy
- Rate limiting no collector
- Input validation no backend

---

## ValidaÃ§Ã£o do Sistema

Para garantir que todo o sistema estÃ¡ funcionando:

```bash
# Validar analytics
./scripts/verify.sh
```

Este script verifica:
1. PostgreSQL healthy
2. PartiÃ§Ãµes criadas automaticamente
3. UNIQUE INDEX(event_id) nas partiÃ§Ãµes
4. Collector /health respondendo
5. POST /collect funcionando
6. DeduplicaÃ§Ã£o funcionando

---

**Data de criaÃ§Ã£o:** 2024-01-10  
**Ãšltima atualizaÃ§Ã£o:** 2026-02-08 (corrigido hooks e atualizado estrutura)


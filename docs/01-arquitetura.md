# Arquitetura do Portal Econômico Mundial

## Visão Geral da Arquitetura

O PEM foi projetado com uma arquitetura modular e escalável, preparada para futura integração com backend.

## Camadas da Aplicação

### 1. Presentation Layer

**Componentes de UI** (`/components`)
- `layout/`: Estrutura visual (Header, Footer, Ticker)
- `news/`: Componentes de notícias (Cards, ArticleContent)
- `interactive/`: Elementos interativos (SurveyForm)
- `ui/`: Componentes base shadcn/ui

**Páginas** (`/pages`)
- Cada página é um componente React independente
- Roteamento via React Router DOM
- SEO dinâmico por página

### 2. Business Logic Layer

**Hooks Customizados** (`/hooks`)
- `useAuth`: Gerenciamento de autenticação
- `useBookmarks`: Favoritos do usuário
- `useMarket`: Dados de mercado em tempo real
- `useReadingProgress`: Tracking de leitura
- `useSurvey`: Questionário de desbloqueio
- `useReadingLimit`: Controle de limite de leitura

**Serviços** (`/services`)
- `newsService.ts`: Mock de artigos (substituível por API)
- Interface clara para futura integração

### 3. Data Layer

**Configurações** (`/config`)
- Centralização de todas as configurações
- Fácil manutenção e modificação
- Preparado para múltiplos ambientes

**Storage** (`/config/storage.ts`)
- Abstração do LocalStorage
- Tipagem forte
- Métodos específicos por entidade

## Fluxo de Dados

```
Usuário → Componente → Hook → Service → Storage/API
                ↓
            Config
```

## Padrões de Design

### Componentes Semânticos
- Uso estrito de tags HTML semânticas
- Proibido uso de `<div>`
- Acessibilidade (ARIA labels, skip links)

### Config-Driven Development
- Nenhum valor hardcoded
- Todas as configurações em `/config`
- Facilita manutenção e internacionalização

### Future-Proof Services
- Interfaces bem definidas
- Mock data facilmente substituível
- DTOs preparados para API real

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

1. **Fase 1**: Mock auth (atual)
2. **Fase 2**: JWT com refresh tokens
3. **Fase 3**: OAuth (Google, Apple, etc.)

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

## Segurança

### Medidas Atuais
- Sanitização de HTML (conteúdo de artigos)
- XSS protection via React
- CSRF tokens prontos para implementação

### Futuras Implementações
- Content Security Policy
- Rate limiting
- Input validation no backend

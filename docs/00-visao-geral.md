# Portal Econômico Mundial - Visão Geral

## Sobre o Projeto

O **Portal Econômico Mundial (PEM)** é um portal de notícias profissional especializado em:

- **Geopolítica**: Análises de relações internacionais, conflitos e diplomacia
- **Economia**: Mercados financeiros, política monetária e indicadores econômicos
- **Tecnologia**: Inovação, inteligência artificial e transformação digital

## Arquitetura

### Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Roteamento**: React Router DOM
- **Estado**: React Hooks + LocalStorage
- **Build**: Vite (suporta export estático)

### Estrutura de Pastas

```
/src
  /components
    /layout      # Header, Footer, Ticker
    /news        # Cards, ArticleContent
    /interactive # SurveyForm
    /ui          # shadcn components
  /config        # Configurações globais
  /hooks         # Custom hooks
  /pages         # Páginas da aplicação
  /services      # Mock data + futura API
  /types         # TypeScript types
/public
  /images/news   # Imagens dos artigos
/docs            # Documentação
```

## Funcionalidades Principais

### 1. Ticker de Mercado
- Scroll infinito com cotações em tempo real
- Ações, índices, moedas e commodities
- Simulação de atualizações dinâmicas

### 2. Sistema de Leitura
- Limite de 20% para não-logados
- Questionário para desbloqueio
- Tracking de progresso de leitura

### 3. Interações
- Favoritos (LocalStorage)
- Histórico de leitura
- Compartilhamento social
- Recomendações de artigos

### 4. Autenticação (Mock)
- Login/Logout simulado
- Área do usuário protegida
- Credenciais de demonstração

## Configuração

Todas as configurações estão centralizadas em `/src/config/`:

- `app.ts`: Brand, contato, features
- `routes.ts`: Rotas e categorias
- `seo.ts`: Meta tags e JSON-LD
- `theme.css`: Design system
- `market.ts`: Dados de mercado
- `storage.ts`: LocalStorage keys
- `content.ts`: Categorias, autores, tags

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Deploy

O projeto suporta export estático para Hostinger:

```bash
npm run build
# Saída: /dist
```

## Próximos Passos (Integração Backend)

1. Substituir `newsService.ts` por chamadas API
2. Implementar autenticação real (JWT)
3. Adicionar sistema de comentários
4. Integrar API de mercado financeiro
5. Implementar newsletter real

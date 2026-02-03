# Changelog - Portal Econômico Mundial

## [1.1.0] - 2024-01-15

### 🚀 Novas Funcionalidades

#### 1. Sistema de Comentários
- **Arquivos criados:**
  - `/src/services/comments/types.ts` - Interfaces e tipos
  - `/src/services/comments/mockService.ts` - Implementação LocalStorage
  - `/src/services/comments/index.ts` - Exportações
  - `/src/hooks/useComments.ts` - Hook de gerenciamento
  - `/src/components/interactive/CommentSection.tsx` - Componente UI

- **Funcionalidades:**
  - Comentários apenas para usuários logados
  - Validação de conteúdo (min/max caracteres)
  - Filtro de palavras sensíveis
  - Cooldown entre submissões (30s)
  - Exclusão de próprios comentários
  - Ordenação por data (mais recentes primeiro)

#### 2. Menu de Navegação Expandido
- **Categorias adicionadas:**
  - mercados, energia, macroeconomia, moedas
  - comercio-global, defesa, analises

- **Subcategorias:**
  - Economia: macroeconomia, moedas, comercio-global
  - Geopolítica: defesa, analises

- **Melhorias:**
  - Menu dropdown com details/summary (semântico)
  - Highlight de página ativa
  - Mobile menu com submenus expansíveis
  - Botão de cadastro no header

#### 3. Página de Cadastro
- **Arquivo criado:** `/src/pages/Register.tsx`
- **Rota:** `/cadastro`
- **Funcionalidades:**
  - Validação completa de formulário
  - Verificação de email único
  - Senha com requisitos de segurança
  - Aceite de termos obrigatório
  - Login automático após cadastro
  - Aviso de ambiente de demonstração

#### 4. Componentes de Loading
- **Arquivo criado:** `/src/components/ui/loading.tsx`
- **Componentes:**
  - `LoadingSpinner` - Spinner reutilizável
  - `FullScreenLoading` - Loading em tela cheia
  - `NewsCardSkeleton` - Skeleton para cards
  - `ArticleListSkeleton` - Skeleton para listas
  - `LoadingOverlay` - Overlay de loading
  - `ButtonLoading` - Estado de loading em botões

#### 5. Módulos Geo/Econômicos
- **Arquivo de config:** `/src/config/geoecon.ts`
- **Componentes criados:**
  - `/src/components/geoEcon/TensionMap.tsx` - Mapa de tensões
  - `/src/components/geoEcon/EconomicAgenda.tsx` - Agenda econômica
  - `/src/components/geoEcon/RiskThermometer.tsx` - Termômetro de risco
  - `/src/components/geoEcon/EconomicComparator.tsx` - Comparador econômico

- **Dados mock:**
  - 5 pontos de tensão global
  - 5 eventos econômicos agendados
  - 4 índices de risco
  - Comparação de inflação e juros

#### 6. Páginas Legais Aprimoradas
- **Atualização:** `/src/pages/Legal.tsx`
- **Melhorias:**
  - Layout padronizado com breadcrumb
  - Conteúdo variabilizado (LEGAL_CONTENT)
  - Alertas informativos
  - JSON-LD estruturado
  - SEO completo (canonical, robots)
  - Seção de contato

#### 7. Template de Artigo Melhorado
- **Módulos adicionados:**
  - Contexto (resumo no início)
  - Impacto (pontos de impacto econômico)
  - Linha do Tempo (histórico de atualizações)
  - Termos-chave (glossário)
  - Fontes (referências)
  - Sidebar com newsletter e avisos

### 📱 Mobile Optimization

#### Melhorias de UX Mobile
- Touch targets mínimos de 44px
- Botões com classe `tap-feedback`
- Tipografia responsiva (text-sm em mobile)
- Espaçamento ajustado para telas pequenas
- Menu mobile com scroll interno
- Imagens com `object-fit` otimizado

#### Performance
- Lazy loading de imagens
- Componentes leves
- Redução de re-renderizações

### 📁 Arquivos Modificados

1. `/src/config/routes.ts` - Novas categorias e subcategorias
2. `/src/components/layout/Header.tsx` - Menu expandido
3. `/src/pages/Article.tsx` - Template aprimorado + comentários
4. `/src/pages/Legal.tsx` - Páginas legais completas
5. `/src/pages/Home.tsx` - Módulos geo/econômicos
6. `/src/App.tsx` - Rota de cadastro

### 📁 Arquivos Criados

```
/src/services/comments/
  ├── types.ts
  ├── mockService.ts
  └── index.ts

/src/components/geoEcon/
  ├── TensionMap.tsx
  ├── EconomicAgenda.tsx
  ├── RiskThermometer.tsx
  └── EconomicComparator.tsx

/src/components/ui/
  └── loading.tsx

/src/pages/
  └── Register.tsx

/src/config/
  └── geoecon.ts
```

### ⚠️ Notas Técnicas

- **Sem divs:** Todos os componentes usam tags semânticas
- **LocalStorage:** Dados de comentários e cadastro persistem no navegador
- **Mock data:** Todos os dados são fictícios para demonstração
- **Sem backend:** Pronto para integração futura via interfaces

### 🔧 Próximos Passos Sugeridos

1. **Backend real:** Substituir mockService por API
2. **Notificações:** Sistema de notificações em tempo real
3. **PWA:** Transformar em Progressive Web App
4. **Analytics:** Integrar Google Analytics 4
5. **Testes:** Adicionar testes unitários e E2E

---

## [1.0.0] - 2024-01-01

### Lançamento Inicial
- Portal de notícias com 10 artigos
- Sistema de autenticação mock
- Ticker de mercado em tempo real
- Design responsivo
- SEO básico

# 📚 Índice de Documentação - Cenario Internacional

Guia rápido de navegação para toda a documentação do projeto.

---

## 🚀 Para Começar

| Documento | Descrição | Quando Ler |
|-----------|-----------|------------|
| [README.md](./README.md) | Visão geral do projeto, tecnologias e primeiros passos | **Primeira leitura** |
| [docs/00-visao-geral.md](./docs/00-visao-geral.md) | Introdução detalhada ao projeto | Após o README |

---

## 🏗️ Arquitetura e Desenvolvimento

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/01-arquitetura.md](./docs/01-arquitetura.md) | Arquitetura técnica, camadas e fluxo de dados | Backend/DevOps |
| [docs/19-convencoes-desenvolvimento.md](./docs/19-convencoes-desenvolvimento.md) | Padrões de código e convenções | Todos os devs |
| [docs/15-testing.md](./docs/15-testing.md) | Estratégia de testes automatizados | QA/Devs |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Como contribuir com o projeto | Contribuidores |

---

## 🤖 Integração com IA (NOVO)

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/20-mcp-server.md](./docs/20-mcp-server.md) | **Documentação completa do MCP Server** | Backend/DevOps |
| [mcp-server/INSTALL.md](./mcp-server/INSTALL.md) | **Guia de instalação do MCP** | DevOps |
| [mcp-server/README.md](./mcp-server/README.md) | Referência rápida do MCP | Todos |

**Funcionalidades do MCP v1.1.0:**
- 📊 **Analytics completo** (6 ferramentas): tracking, métricas, sessões
- 📝 **Gerenciamento de conteúdo** (7 ferramentas): CRUD completo de artigos
  - Campos completos: título, resumo, conteúdo
  - **Tradução** (PT/EN): titleEn, excerptEn, contentEn
  - **SEO**: metaDescription (160 chars), keywords
  - **Categorização**: categoria + tags (relacionamentos automáticos)
  - **Mídia**: imagem de capa
  - **Configurações**: featured, breaking, status, agendamento
  - **Métricas**: views, likes, shares iniciais
- 📈 **Dados de mercado** (4 ferramentas): Finnhub API

---

## 📊 Analytics e Dados

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/04-analytics-first-party.md](./docs/04-analytics-first-party.md) | Sistema de analytics próprio | Backend/Product |
| [docs/05-lgpd-compliance.md](./docs/05-lgpd-compliance.md) | Conformidade com LGPD | Legal/Product |
| [docs/10-data-model-postgres.md](./docs/10-data-model-postgres.md) | Modelo de dados do PostgreSQL | Backend |
| [docs/08-data-governance.md](./docs/08-data-governance.md) | Governança de dados | Backend/Legal |
| [docs/09-event-schema.md](./docs/09-event-schema.md) | Schema completo de eventos | Backend |

---

## 🔍 SEO e Monetização

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/02-seo-e-adsense.md](./docs/02-seo-e-adsense.md) | Estratégia de SEO e AdSense | Marketing/Dev |
| [docs/GOOGLE_ADSENSE_MODEL_GUIDE.md](./docs/GOOGLE_ADSENSE_MODEL_GUIDE.md) | Guia para ser modelo AdSense | Marketing |
| [docs/ANALISE_MERCADO_ADSENSE_BRASIL.md](./docs/ANALISE_MERCADO_ADSENSE_BRASIL.md) | Análise de mercado AdSense | Marketing |

---

## 💰 Dados de Mercado (Finnhub)

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/FINNHUB-GUIA-COMPLETO.md](./docs/FINNHUB-GUIA-COMPLETO.md) | **Documentação completa da Finnhub API** | Todos |

---

## 🎨 Design e UI

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/03-design-system.md](./docs/03-design-system.md) | Design system completo | Frontend/Design |

---

## 🚀 Deploy e DevOps

| Documento | Descrição | Público |
|-----------|-----------|---------|
| **[docs/22-deploy-producao-checklist.md](./docs/22-deploy-producao-checklist.md)** | **🆕 Checklist completo produção** | DevOps |
| [docs/06-deploy-hostinger.md](./docs/06-deploy-hostinger.md) | Deploy no Hostinger | DevOps |
| [docs/DEPLOY_SEGURO.md](./docs/DEPLOY_SEGURO.md) | Checklist de segurança pré-deploy | DevOps |
| [docs/17-cicd-pipeline.md](./docs/17-cicd-pipeline.md) | CI/CD Pipeline | DevOps |
| [docs/14-deploy.md](./docs/14-deploy.md) | Deploy do analytics | DevOps |
| [docs/21-image-processing.md](./docs/21-image-processing.md) | Processamento de imagens | DevOps |

### Checklist Deploy Produção
Progresso atual: **(ver doc)** - este índice não é a fonte de verdade do progresso.

**🔴 CRÍTICO (6 itens):**
- Sistema de Imagens (Base64 → CDN)
- Cache de Dados
- PM2 + Nginx
- Health Check API

**🟡 IMPORTANTE (exemplos):**
- CI/CD de deploy
- Newsletter funcional
- Comentários (validar setup final)

**🟢 BOM TER (7 itens):**
- PWA, Testes, Monitoramento, CSP

### 🆕 Funcionalidades Competitivas (vs Infomoney/Valor)
**Itens para igualar grandes portais (métodos gratuitos):**

| # | Funcionalidade | ROI | Custo |
|---|---------------|-----|-------|
| 1 | **Push Notifications (OneSignal)** | 🔥🔥🔥🔥🔥 | $0 |
| 2 | **Newsletter (Buttondown)** | 🔥🔥🔥🔥🔥 | $0 |
| 3 | **Comentários (Giscus)** | 🔥🔥🔥🔥 | $0 |
| 4 | **Cache Avançado (ISR)** | 🔥🔥🔥🔥 | $0 |
| 5 | **PWA Completo** | 🔥🔥🔥🔥 | $0 |
| 6 | **Schema.org Avançado** | 🔥🔥🔥 | $0 |
| 7 | **Páginas AMP** | 🔥🔥🔥 | $0 |

📊 **Nota atual do projeto:** 6.8/10  
🎯 **Com esses itens:** 9.0+/10

👉 [Ver checklist completo com implementação](./docs/22-deploy-producao-checklist.md)

---

## 🔒 Segurança

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/AUDITORIA_SEGURANCA.md](./docs/AUDITORIA_SEGURANCA.md) | Relatório de auditoria de segurança | DevOps/Security |
| [docs/CORRECOES_SEGURANCA_APLICADAS.md](./docs/CORRECOES_SEGURANCA_APLICADAS.md) | Correções aplicadas | DevOps |

---

## 🗄️ Banco de Dados

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [docs/AUDITORIA_DATABASE.md](./docs/AUDITORIA_DATABASE.md) | Auditoria do banco de dados | Backend |

---

## 📈 Histórico e Auditorias

| Documento | Descrição |
|-----------|-----------|
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Histórico de mudanças |
| [docs/AUDITORIA_ARQUIVOS_NAO_NECESSARIOS.md](./docs/AUDITORIA_ARQUIVOS_NAO_NECESSARIOS.md) | Arquivos não necessários |
| [docs/RELATORIO_CODIGO_MORTO.md](./docs/RELATORIO_CODIGO_MORTO.md) | Código morto identificado |
| [docs/RESUMO_LIMPEZA_FINAL.md](./docs/RESUMO_LIMPEZA_FINAL.md) | Resumo da limpeza |

---

## 🆕 Novidades Recentes (Fev/2026)

### MCP Server v1.1.0 - Integração com IA
- [docs/20-mcp-server.md](./docs/20-mcp-server.md) - Documentação completa
- [mcp-server/](./mcp-server/) - Código fonte
- **17 ferramentas** organizadas em 3 categorias:
  - Analytics (6): tracking completo
  - Gerenciamento de Conteúdo (7): CRUD de artigos com **todos os campos**
    - Tradução (PT/EN)
    - SEO (meta description, keywords)
    - Categoria e Tags (relacionamentos automáticos)
  - Dados de Mercado (4): Finnhub API

### E-E-A-T Signals
- Páginas de autores (`/autor/[slug]`)
- Página Editorial (`/editorial`)
- Badges de verificação
- Schema ReviewedBy

### Cookie Banner LGPD
- Consentimento granular
- Integração AdSense

### SEO Portal-Grade (Fev/2026)
- Canonical/OG/Twitter padronizados por rota e `noindex` em rotas internas/finas
- `robots.ts` com higiene para tracking params
- JSON-LD com URLs/imagens absolutas e `ItemList` alinhado ao schema

---

## 📋 Por Perfil

### 🎨 Frontend Developer
1. [README.md](./README.md)
2. [docs/03-design-system.md](./docs/03-design-system.md)
3. [docs/15-testing.md](./docs/15-testing.md)
4. [CONTRIBUTING.md](./CONTRIBUTING.md)

### ⚙️ Backend/DevOps
1. [docs/01-arquitetura.md](./docs/01-arquitetura.md)
2. **[docs/20-mcp-server.md](./docs/20-mcp-server.md)** ⭐ NOVO
3. [docs/04-analytics-first-party.md](./docs/04-analytics-first-party.md)
4. [docs/10-data-model-postgres.md](./docs/10-data-model-postgres.md)
5. [docs/17-cicd-pipeline.md](./docs/17-cicd-pipeline.md)

### 📊 Product Owner/Manager
1. [docs/00-visao-geral.md](./docs/00-visao-geral.md)
2. [docs/04-analytics-first-party.md](./docs/04-analytics-first-party.md)
3. [docs/02-seo-e-adsense.md](./docs/02-seo-e-adsense.md)

### ⚖️ Compliance/Legal
1. [docs/05-lgpd-compliance.md](./docs/05-lgpd-compliance.md)
2. [docs/08-data-governance.md](./docs/08-data-governance.md)

---

## 🔍 Busca Rápida

| Você quer... | Vá para... |
|--------------|-----------|
| Instalar o MCP Server | [mcp-server/INSTALL.md](./mcp-server/INSTALL.md) |
| Documentação MCP completa | [docs/20-mcp-server.md](./docs/20-mcp-server.md) |
| Configurar Codex CLI | [docs/20-mcp-server.md#configuração](./docs/20-mcp-server.md#️-configuração) |
| Ver exemplos de uso MCP | [docs/20-mcp-server.md#exemplos-de-uso-avançado](./docs/20-mcp-server.md#-exemplos-de-uso-avançado) |
| API Finnhub | [docs/FINNHUB-GUIA-COMPLETO.md](./docs/FINNHUB-GUIA-COMPLETO.md) |
| Checklist Deploy Produção | [docs/22-deploy-producao-checklist.md](./docs/22-deploy-producao-checklist.md) |
| Deploy | [docs/DEPLOY_SEGURO.md](./docs/DEPLOY_SEGURO.md) |
| LGPD/Cookies | [docs/05-lgpd-compliance.md](./docs/05-lgpd-compliance.md) |
| SEO/AdSense | [docs/02-seo-e-adsense.md](./docs/02-seo-e-adsense.md) |
| Analytics | [docs/04-analytics-first-party.md](./docs/04-analytics-first-party.md) |
| Processamento Imagens | [docs/21-image-processing.md](./docs/21-image-processing.md) |

---

**Última atualização:** 08/02/2026 (Atualizacao SEO portal-grade + docs)

# Documentação do Cenario Internacional

Bem-vindo à documentação central do Cenario Internacional (CIN).

---

## 📚 Índice de Documentação

### Visão Geral e Arquitetura

| # | Documento | Descrição |
|---|-----------|-----------|
| 00 | [Visão Geral](./00-visao-geral.md) | Introdução ao projeto, tecnologias e funcionalidades |
| 01 | [Arquitetura](./01-arquitetura.md) | Arquitetura técnica, camadas e fluxo de dados |

### SEO, Design e Deploy

| # | Documento | Descrição |
|---|-----------|-----------|
| 02 | [SEO e AdSense](./02-seo-e-adsense.md) | Estratégia de SEO e integração com Google AdSense |
| 03 | [Design System](./03-design-system.md) | Paleta de cores, tipografia, componentes e padrões de design |
| 06 | [Deploy Hostinger](./06-deploy-hostinger.md) | Guia de deploy no Hostinger |
| DEPLOY | [Deploy Seguro](./DEPLOY_SEGURO.md) | Checklist de segurança pré-deploy |

### Analytics First-Party

| # | Documento | Descrição |
|---|-----------|-----------|
| 04 | [Analytics First-Party](./04-analytics-first-party.md) | Arquitetura do sistema de analytics próprio |
| 05 | [LGPD Compliance](./05-lgpd-compliance.md) | Conformidade com LGPD, consentimento e privacidade |
| 07 | [Event Versioning](./07-event-versioning.md) | Versionamento de eventos de analytics |
| 08 | [Data Governance](./08-data-governance.md) | Governança e qualidade de dados |
| 09 | [Event Schema](./09-event-schema.md) | Schema completo de eventos (Enterprise) |
| 10 | [Data Model PostgreSQL](./10-data-model-postgres.md) | Modelo de dados do PostgreSQL |
| 11 | [Data Quality](./11-data-quality.md) | Qualidade de dados e monitoramento |
| 14 | [Deploy Analytics](./14-deploy.md) | Guia de deploy do sistema analytics |

### Qualidade e Testes

| # | Documento | Descrição |
|---|-----------|-----------|
| 07 | [Checklist QA](./07-checklist-qa.md) | Checklist de testes manuais |
| 15 | [Testing](./15-testing.md) | Estratégia completa de testes automatizados |

### API e Integração

| # | Documento | Descrição |
|---|-----------|-----------|
| 16 | [API REST](./16-api-rest.md) | Especificação OpenAPI, endpoints e integração |
| FINNHUB | [Finnhub - Guia Completo](./FINNHUB-GUIA-COMPLETO.md) | Integração completa com Finnhub API |

### CI/CD e DevOps

| # | Documento | Descrição |
|---|-----------|-----------|
| 17 | [CI/CD Pipeline](./17-cicd-pipeline.md) | Integração contínua e deploy automatizado |

### Funcionalidades

| # | Documento | Descrição |
|---|-----------|-----------|
| 18 | [Tradução Automática](./18-traducao-automatica.md) | Removido do app (mantido apenas para referência) |
| 20 | [Contato e Carreiras](./CONTACT_FORMS_SETUP.md) | Setup dos formulários e tabelas (Supabase) |

### 🤖 Integração com IA (MCP)

| # | Documento | Descrição |
|---|-----------|-----------|
| 20 | [MCP Server](./20-mcp-server.md) | Servidor Model Context Protocol para integração com Codex CLI |

### Contribuição

| Arquivo | Descrição |
|---------|-----------|
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Guia de contribuição com o projeto |
| [19-convencoes-desenvolvimento.md](./19-convencoes-desenvolvimento.md) | Convenções e padrões de desenvolvimento |

### Admin e Operacao

| Documento | Descrição |
|----------|-----------|
| [23-seed-admin-test-user.md](./23-seed-admin-test-user.md) | Criar/garantir usuário admin de teste no Supabase (sem vazar secrets) |

### Changelogs

| Arquivo | Descrição |
|---------|-----------|
| [CHANGELOG.md](../CHANGELOG.md) | Histórico de mudanças (formato Keep a Changelog) |

### Auditorias e Relatórios

| Arquivo | Descrição |
|---------|-----------|
| [AUDITORIA_SEGURANCA.md](./AUDITORIA_SEGURANCA.md) | Relatório de auditoria de segurança |
| [CORRECOES_SEGURANCA_2026-02-10.md](./CORRECOES_SEGURANCA_2026-02-10.md) | Correções de segurança aplicadas (10/02/2026) |
| [GUIA_SEGURANCA_DESENVOLVEDORES.md](./GUIA_SEGURANCA_DESENVOLVEDORES.md) | Guia de boas práticas de segurança |
| [AUDITORIA_DATABASE.md](./AUDITORIA_DATABASE.md) | Auditoria do banco de dados |
| [AUDITORIA_ARQUIVOS_NAO_NECESSARIOS.md](./AUDITORIA_ARQUIVOS_NAO_NECESSARIOS.md) | Auditoria de código morto |
| [RELATORIO_CODIGO_MORTO.md](./RELATORIO_CODIGO_MORTO.md) | Relatório de código morto |
| [RESUMO_LIMPEZA_FINAL.md](./RESUMO_LIMPEZA_FINAL.md) | Resumo da limpeza de código |

---

## 🎯 Documentos Recomendados por Perfil

### Desenvolvedor Frontend
1. [00-visao-geral.md](./00-visao-geral.md)
2. [03-design-system.md](./03-design-system.md)
3. [15-testing.md](./15-testing.md)
4. [FINNHUB-GUIA-COMPLETO.md](./FINNHUB-GUIA-COMPLETO.md)
5. [CONTRIBUTING.md](../CONTRIBUTING.md)

### Desenvolvedor Backend/DevOps
1. [01-arquitetura.md](./01-arquitetura.md)
2. [04-analytics-first-party.md](./04-analytics-first-party.md)
3. [10-data-model-postgres.md](./10-data-model-postgres.md)
4. [16-api-rest.md](./16-api-rest.md)
5. [17-cicd-pipeline.md](./17-cicd-pipeline.md)
6. [20-mcp-server.md](./20-mcp-server.md) - Integração com IA
7. [GUIA_SEGURANCA_DESENVOLVEDORES.md](./GUIA_SEGURANCA_DESENVOLVEDORES.md) - Boas práticas de segurança

### Product Owner/Manager
1. [00-visao-geral.md](./00-visao-geral.md)
2. [04-analytics-first-party.md](./04-analytics-first-party.md)
3. [09-event-schema.md](./09-event-schema.md)

### Compliance/Legal
1. [05-lgpd-compliance.md](./05-lgpd-compliance.md)
2. [08-data-governance.md](./08-data-governance.md)

---

## 🆕 Novidades

### Fev/2026
- ✅ **[GUIA_SEGURANCA_DESENVOLVEDORES.md](./GUIA_SEGURANCA_DESENVOLVEDORES.md)** - Guia completo de segurança
- ✅ **[CORRECOES_SEGURANCA_2026-02-10.md](./CORRECOES_SEGURANCA_2026-02-10.md)** - Correções críticas aplicadas
- ✅ **[SECURITY_FIX_PLAN.md](../SECURITY_FIX_PLAN.md)** - Plano de correções de segurança
- ✅ **[20-mcp-server.md](./20-mcp-server.md)** - Servidor MCP para integração com Codex CLI
- ✅ **FINNHUB-GUIA-COMPLETO.md** - Documentação consolidada da Finnhub API
- ✅ **SEO Portal-Grade** - Canonical/OG/Twitter + noindex + robots hygiene + JSON-LD coerente
- ✅ **AUDITORIA_ARQUIVOS_NAO_NECESSARIOS.md** - Auditoria de arquivos
- ✅ **RELATORIO_CODIGO_MORTO.md** - Relatório de código morto
- ✅ **RESUMO_LIMPEZA_FINAL.md** - Resumo da limpeza
- ✅ **PLANO_CONSOLIDACAO_DOCUMENTACAO.md** - Plano de consolidação
- 🗑️ Removidos: FINNHUB_SETUP.md, FINNHUB_INTEGRACAO.md, FINNHUB_ENDPOINTS_ANALISE.md (consolidados)
- 🗑️ Removidos: 08-changelog.md (consolidado em CHANGELOG.md)
- 🗑️ Removido: TRADING_ECONOMICS_SETUP.md (código removido)

---

## 📝 Convenções de Documentação

- Números prefixados (00-99) indicam ordem recomendada de leitura
- Documentos marcados como **NOVO** foram adicionados recentemente
- Códigos de exemplo estão em português quando aplicável
- Snippets de código incluem comentários explicativos

---

**Última atualização:** 08/02/2026

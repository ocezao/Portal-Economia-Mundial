# Plano de Consolidação de Documentação

**Data:** 2026-02-05  
**Objetivo:** Reduzir número de arquivos de documentação sem perder informação

---

## 📊 Análise Atual

### Total de Documentações: 35 arquivos

### Categorias Identificadas

| Categoria | Quantidade | Arquivos |
|-----------|------------|----------|
| **Changelogs** | 2 | `08-changelog.md`, `CHANGELOG.md` |
| **Finnhub** | 3 | `FINNHUB_SETUP.md`, `FINNHUB_INTEGRACAO.md`, `FINNHUB_ENDPOINTS_ANALISE.md` |
| **Deploy** | 3 | `06-deploy-hostinger.md`, `14-deploy.md`, `DEPLOY_SEGURO.md` |
| **Analytics** | 8 | `04-` a `11-` (exceto os acima) |
| **Auditoria** | 5 | `AUDITORIA_*`, `RELATORIO_*`, `RESUMO_*` |
| **Outros** | 14 | `00-` a `03-`, `15-` a `19-`, etc. |

---

## ✅ Plano de Consolidação

### 1. Consolidar Changelogs (2 → 1)

**Arquivos:**
- `docs/08-changelog.md` (mantido como base)
- `docs/meta/CHANGELOG.md` (conteúdo migrado para 08-changelog.md)

**Ação:** 
- Manter `docs/meta/CHANGELOG.md` como padrão do projeto
- Remover `docs/08-changelog.md`
- Atualizar conteúdo consolidado em CHANGELOG.md

---

### 2. Consolidar Finnhub (3 → 1)

**Arquivos:**
- `docs/FINNHUB_SETUP.md` (setup inicial)
- `docs/FINNHUB_INTEGRACAO.md` (endpoints implementados)
- `docs/FINNHUB_ENDPOINTS_ANALISE.md` (endpoints disponíveis)

**Novo arquivo:** `docs/product/FINNHUB-GUIA-COMPLETO.md`

**Estrutura do novo documento:**
```
1. Setup e Configuração (de FINNHUB_SETUP.md)
2. Endpoints Implementados (de FINNHUB_INTEGRACAO.md)
3. Endpoints Disponíveis para Expansão (de FINNHUB_ENDPOINTS_ANALISE.md)
4. Exemplos de Uso
5. Troubleshooting
```

---

### 3. Remover Trading Economics (1 → 0)

**Arquivo:** `docs/TRADING_ECONOMICS_SETUP.md`

**Justificativa:** 
- Todo o código Trading Economics foi removido na limpeza
- O sistema agora usa apenas Finnhub
- Documentação tornou-se obsoleta

**Ação:** Deletar arquivo

---

### 4. Manter Separados (Justificativa)

| Arquivo | Motivo |
|---------|--------|
| `06-deploy-hostinger.md` | Deploy específico de hospedagem |
| `14-deploy.md` | Deploy específico do Analytics (Docker) |
| `DEPLOY_SEGURO.md` | Checklist de segurança pré-deploy |
| `04-analytics-first-party.md` | Documentação muito grande (16KB) |
| `05-lgpd-compliance.md` | Documentação muito grande (23KB) |
| `07-event-versioning.md` | Documentação muito grande (21KB) |
| `08-data-governance.md` | Documentação muito grande (29KB) |
| `09-event-schema.md` | Documentação muito grande (31KB) |
| `10-data-model-postgres.md` | Documentação técnica especializada |
| `11-data-quality.md` | Documentação técnica especializada |

---

## 📁 Resultado Esperado

### Antes
```
docs/
├── 00-visao-geral.md
├── 01-arquitetura.md
├── ...
├── 08-changelog.md              [REMOVER]
├── CHANGELOG.md                  [MANTER - consolidado]
├── FINNHUB_SETUP.md             [REMOVER]
├── FINNHUB_INTEGRACAO.md        [REMOVER]
├── FINNHUB_ENDPOINTS_ANALISE.md [REMOVER]
├── FINNHUB-GUIA-COMPLETO.md     [NOVO]
├── TRADING_ECONOMICS_SETUP.md   [REMOVER - obsoleto]
└── ...
```

### Depois
```
docs/
├── 00-visao-geral.md
├── 01-arquitetura.md
├── ...
├── CHANGELOG.md                  [consolidado]
├── FINNHUB-GUIA-COMPLETO.md     [consolidado]
└── ...
```

**Redução total: 5 arquivos → 2 arquivos (economia de 3 documentos)**

---

## ⚠️ Considerações Importantes

1. **Preservação de conteúdo:** Todo o conteúdo será migrado, não perdido
2. **Links internos:** Verificar e atualizar links entre documentações
3. **README.md:** Atualizar referências aos documentos consolidados
4. **Histórico:** Manter histórico de versões nos changelogs

---

## ✅ Checklist de Execução

- [ ] Consolidar changelogs
- [ ] Criar FINNHUB-GUIA-COMPLETO.md
- [ ] Remover documentações obsoletas
- [ ] Atualizar links no README.md
- [ ] Verificar se há referências nos códigos

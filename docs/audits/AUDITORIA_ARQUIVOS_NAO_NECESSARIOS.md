# Auditoria de Arquivos Não Necessários

**Data da auditoria:** 2026-02-05  
**Responsável:** Sistema de auditoria automatizado  
**Status:** 🟡 Parcial - Requer decisão humana para remoção

---

## 1. Resumo Executivo

Esta auditoria identificou arquivos, dependências e estruturas que podem ser candidatos à remoção do projeto, seja por estarem obsoletos, não utilizados ou redundantes.

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| Dependências npm | 1 | 🔴 Remoção recomendada |
| Arquivos de documentação | 12+ | 🟡 Revisão necessária |
| Diretórios de sistema | 3 | 🟢 Mantidos (funcionalidade futura) |
| Scripts de build | 3 | 🟡 Análise necessária |
| Logs e cache | 2 | 🔴 Remoção segura |

---

## 2. Dependências npm Não Utilizadas

### 2.1 `kimi-plugin-inspect-react` 🔴 REMOVER

```json
"kimi-plugin-inspect-react": "^1.0.3"
```

**Localização:** `package.json` (devDependencies)

**Por que não precisamos:**
- ❌ **Erro de compatibilidade ESM:** Plugin usa `require()` para importar módulo ESM, incompatível com Vite 7 + ES modules
- ❌ **Bloqueia o servidor de desenvolvimento:** Impede `npm run dev` de iniciar na porta 5173
- ❌ **Funcionalidade não essencial:** Era apenas para inspeção de atributos React em desenvolvimento
- ❌ **Não há código que importe este pacote** (verificado via grep)

**Ação recomendada:**
```bash
npm uninstall kimi-plugin-inspect-react
```

**Impacto:** Nenhum - O plugin já foi removido do `vite.config.ts` e o projeto funciona normalmente sem ele.

---

## 3. Arquivos de Documentação Potencialmente Obsoletos

### 3.1 Documentações de Analytics (Não implementado/produção)

| Arquivo | Status | Justificativa |
|---------|--------|---------------|
| `docs/04-analytics-first-party.md` | 🟡 Revisar | Sistema analytics criado mas não em uso ativo |
| `docs/05-lgpd-compliance.md` | 🟢 Manter | Importante para conformidade legal |
| `docs/08-data-governance.md` | 🟡 Revisar | Relacionado a analytics |
| `docs/09-event-schema.md` | 🟡 Revisar | Relacionado a analytics |
| `docs/10-data-model-postgres.md` | 🟡 Revisar | Relacionado a analytics |
| `docs/11-data-quality.md` | 🟡 Revisar | Relacionado a analytics |

**Nota:** O sistema de analytics existe na pasta `/collector` e `/sdk`, mas não está integrado ao frontend em produção. As documentações são válidas mas podem estar desatualizadas.

### 3.2 Documentações de Setup/Específicas

| Arquivo | Status | Justificativa |
|---------|--------|---------------|
| `docs/TRADING_ECONOMICS_SETUP.md` | 🟡 Revisar | Setup de API específica - ainda em uso? |
| `docs/CONTACT_FORMS_SETUP.md` | 🟢 Manter | Forms de contato são usados |
| `docs/_security/CORRECOES_SEGURANCA_APLICADAS.md` | 🟢 Manter | Histórico de segurança |

### 3.3 Documentações Duplicadas/Alternativas

| Arquivo | Duplicado com | Ação |
|---------|---------------|------|
| `docs/07-checklist-qa.md` | `docs/07-event-versioning.md` | 🟡 Mesmo número - revisar nomenclatura |
| `docs/08-changelog.md` | `docs/meta/CHANGELOG.md` | 🟡 Consolidar |
| `docs/14-deploy.md` | `docs/06-deploy-hostinger.md` | 🟡 Consolidar |

---

## 4. Diretórios de Sistema

### 4.1 `/collector` 🟢 MANTER (mas considerar)

**Conteúdo:** Sistema de analytics completo (Node.js + Fastify + PostgreSQL)

**Por que mantemos:**
- ✅ Código funcional e bem estruturado
- ✅ Pode ser ativado no futuro
- ✅ Não interfere no funcionamento do frontend

**Por que poderíamos remover:**
- ❌ Não está em uso ativo
- ❌ Aumenta o tamanho do repositório
- ❌ Requer manutenção de dependências separadas

**Recomendação:** Manter por enquanto, mas considerar mover para repositório separado se não for usar em breve.

### 4.2 `/sdk` 🟢 MANTER (mas considerar)

**Conteúdo:** SDK JavaScript para analytics (client-side)

**Mesma análise do `/collector`** - é parte do sistema de analytics.

### 4.3 `/supabase` 🟢 MANTER

**Conteúdo:** Edge Functions do Supabase (vazio atualmente)

**Por que mantemos:**
- ✅ Necessário para futuras Edge Functions
- ✅ Estrutura padrão do Supabase
- ✅ Não ocupa espaço significativo

---

## 5. Scripts de Build e Automação

### 5.1 Scripts na pasta `/scripts`

| Script | Status | Justificativa |
|--------|--------|---------------|
| `convert-images-to-webp.mjs` | 🟡 Analisar | Usado no build, mas Sharp é pesado |
| `partition-manager.sh` | 🟡 Analisar | Para analytics - manter se collector permanecer |
| `verify.sh` | 🟡 Analisar | Para analytics - manter se collector permanecer |
| `verify-advanced.sh` | 🟡 Analisar | Para analytics - manter se collector permanecer |

### 5.2 Scripts em `package.json`

```json
"convert:webp": "node scripts/convert-images-to-webp.mjs"
```

**Análise:** O script `convert:webp` é executado antes do build. Se todas as imagens já estão em `.webp`, este processo é redundante. Verificar se há imagens não-webp em `public/`.

---

## 6. Arquivos de Log e Cache

### 6.1 Arquivos Seguros para Remoção 🔴

| Arquivo | Tamanho | Motivo |
|---------|---------|--------|
| `dev5173.err` | ~17KB | Log de erro antigo - já resolvido |
| `dev5173.log` | ~500B | Log de execução temporário |
| `.eslintcache` | Variável | Cache do ESLint - recriado automaticamente |

**Comando para limpeza segura:**
```bash
# Windows
Remove-Item dev5173.err, dev5173.log, .eslintcache -ErrorAction SilentlyContinue

# Linux/Mac
rm -f dev5173.err dev5173.log .eslintcache
```

---

## 7. Arquivos de Configuração Não Utilizados

### 7.1 Configurações potencialmente obsoletas

| Arquivo | Status | Análise |
|---------|--------|---------|
| `docker-compose.yml` | 🟡 Revisar | Usado para analytics local - necessário? |
| `components.json` | 🟢 Manter | Config do shadcn/ui - em uso |

---

## 8. Recomendações de Ação

### 8.1 Ações Imediatas (Seguras) 🔴

```bash
# 1. Remover dependência problemática
npm uninstall kimi-plugin-inspect-react

# 2. Limpar logs temporários
rm -f dev5173.err dev5173.log .eslintcache

# 3. Atualizar package-lock.json
npm install
```

### 8.2 Ações de Revisão (Requer análise) 🟡

1. **Consolidar documentações duplicadas:**
   - Unificar `CHANGELOG.md` com `docs/08-changelog.md`
   - Unificar `docs/14-deploy.md` com `docs/06-deploy-hostinger.md`

2. **Avaliar sistema de analytics:**
   - Decidir se mantém `/collector` e `/sdk`
   - Se remover: deletar pastas e documentações relacionadas
   - Se manter: garantir integração com frontend

3. **Revisar documentações numeradas duplicadas:**
   - `docs/07-checklist-qa.md` vs `docs/07-event-versioning.md`
   - Renomear para sequência numérica correta

### 8.3 Ações Futuras (Baixa prioridade) 🟢

1. Avaliar necessidade de cada documentação de setup específica
2. Considerar mover analytics para repositório separado
3. Revisar se `convert-images-to-webp.mjs` ainda é necessário

---

## 9. Checklist de Limpeza

- [ ] Remover `kimi-plugin-inspect-react` do `package.json`
- [ ] Limpar logs temporários (`dev5173.*`, `.eslintcache`)
- [ ] Revisar documentações de analytics
- [ ] Decidir sobre sistema collector/sdk
- [ ] Consolidar documentações duplicadas
- [ ] Revisar nomenclatura de arquivos numerados

---

## 10. Anexos

### 10.1 Comando de verificação de uso de dependências

```bash
# Verificar se uma dependência é importada no código
grep -r "kimi-plugin-inspect-react" src/ --include="*.ts" --include="*.tsx"

# Verificar imports de módulos específicos
grep -r "from.*analytics" src/ --include="*.ts" --include="*.tsx"
```

### 10.2 Estatísticas do repositório

```
Total de arquivos: ~35,000 (incluindo node_modules)
Arquivos do projeto: ~200 (excluindo node_modules, dist, .git)
Tamanho estimado do projeto: ~150MB
Tamanho do node_modules: ~400MB
```

---

**Data de criação:** 2026-02-05  
**Versão:** 1.0  
**Próxima revisão:** Após decisão sobre sistema de analytics

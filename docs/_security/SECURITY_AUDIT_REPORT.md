# 🔒 RELATÓRIO CONSOLIDADO DE AUDITORIA DE SEGURANÇA
## Cenario Internacional - Análise Completa

**Data:** 2026-02-10  
**Scope:** Full Stack (Frontend, Backend, APIs, Database, Dependencies)  
**Total Issues:** 56 vulnerabilidades/alertas encontrados

---

## 🎯 DASHBOARD EXECUTIVO

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 **CRITICAL** | 9 | Ação Imediata |
| 🟠 **HIGH** | 7 | Prioridade Alta |
| 🟡 **MEDIUM** | 15 | Prioridade Média |
| 🟢 **LOW** | 17 | Baixa Prioridade |
| 🔵 **INFO** | 8 | Informativo |

### ⚡ Ações Imediatas Necessárias
1. **ROTACIONAR TODAS AS CREDENCIAIS** - 7 secrets expostos no repositório
2. **ATUALIZAR REACT/NEXT.JS** - Vulnerabilidades RCE críticas (CVE-2025-55182, CVE-2025-66478)
3. **IMPLEMENTAR CSP E HSTS** - Headers críticos ausentes
4. **REMOVER .env DO HISTÓRICO GIT** - Usar BFG Repo-Cleaner

---

## 📁 SEÇÕES DO RELATÓRIO

### 1. [🔑 Secrets e Credenciais](#1-secrets-e-credenciais) - 7 CRITICAL
### 2. [📦 Dependências Vulneráveis](#2-dependências-vulneráveis) - 2 CRITICAL
### 3. [🛡️ Headers de Segurança](#3-headers-de-segurança) - 2 CRITICAL
### 4. [🔐 Autenticação e Autorização](#4-autenticação-e-autorização) - 1 CRITICAL
### 5. [📝 Validação de Input](#5-validação-de-input) - 1 CRITICAL
### 6. [🔍 Análise Estática (SAST)](#6-análise-estática-sast)

---

## 1. 🔑 SECRETS E CREDENCIAIS

### 🔴 CRITICAL (7 issues)

| # | Tipo | Arquivo | Descrição | Rota de Correção |
|---|------|---------|-----------|------------------|
| 1.1 | SUPABASE_SERVICE_ROLE_KEY | `.env:7` | Chave com acesso TOTAL ao banco | [Rota #1.1](#rota-11-service-role-key) |
| 1.2 | SUPABASE_SERVICE_ROLE_KEY | `confirm-email.mjs:4` | Hardcoded no script | [Rota #1.2](#rota-12-scripts-hardcoded) |
| 1.3 | SUPABASE_SERVICE_ROLE_KEY | `make-admin.mjs:4` | Hardcoded no script | [Rota #1.2](#rota-12-scripts-hardcoded) |
| 1.4 | DATABASE_PASSWORD | `.env:5,6` | Senha PostgreSQL exposta | [Rota #1.3](#rota-13-database-credentials) |
| 1.5 | JWT_SECRET | `.env:8` | Permite forjar tokens | [Rota #1.4](#rota-14-jwt-secret) |
| 1.6 | ADMIN_PASSWORD | `confirm-email.mjs:31` | Senha 'admin123' hardcoded | [Rota #1.5](#rota-15-admin-password) |
| 1.7 | API_KEYS_EXPOSTAS | `.env:22,26` | Finnhub, GNews | [Rota #1.6](#rota-16-api-keys-frontend) |

### ⚠️ HIGH (4 issues)

| # | Tipo | Arquivo | Descrição | Rota de Correção |
|---|------|---------|-----------|------------------|
| 1.8 | FINNHUB_API_KEY | `.env:22` | Exposta como NEXT_PUBLIC_ | [Rota #1.6](#rota-16-api-keys-frontend) |
| 1.9 | GNEWS_API_KEY | `.env:26` | API key exposta | [Rota #1.7](#rota-17-backend-only-secrets) |
| ~~1.10~~ | ~~CHAVE_IA_REMOVIDA~~ | ~~REMOVIDO~~ | ~~API key exposta~~ | ~~Funcionalidade removida~~ |
| 1.11 | SUPABASE_ANON_KEY | `.env:2` | Versionada (pública por design) | [Rota #1.8](#rota-18-gitignore) |

---

## 2. 📦 DEPENDÊNCIAS VULNERÁVEIS

### 🔴 CRITICAL (2 issues) - ATUALIZAR IMEDIATAMENTE

| CVE | Pacote | Versão Atual | Versão Segura | Descrição |
|-----|--------|--------------|---------------|-----------|
| CVE-2025-55182 | react | 19.2.0 | 19.2.4 | RCE via React Server Components - CVSS 10.0 |
| CVE-2025-66478 | next | 16.1.6 | 16.0.7/16.1.5 | RCE no protocolo RSC - CVSS 10.0 |

### 🟡 MEDIUM (1 issue)

| Pacote | CVE | Descrição | Rota de Correção |
|--------|-----|-----------|------------------|
| lodash | CVE-2024-xxxx | Prototype Pollution via recharts | [Rota #2.2](#rota-22-lodash) |

### Rota de Correção
- [Rota #2.1](#rota-21-atualizar-react-next) - Atualizar React e Next.js

---

## 3. 🛡️ HEADERS DE SEGURANÇA

### 🔴 CRITICAL (2 issues)

| Header | Status | Impacto | Rota de Correção |
|--------|--------|---------|------------------|
| Content-Security-Policy | ❌ Não configurado | Vulnerável a XSS, injeção de scripts | [Rota #3.1](#rota-31-implementar-csp) |
| Strict-Transport-Security | ❌ Não configurado | Vulnerável a MITM, downgrade | [Rota #3.2](#rota-32-implementar-hsts) |

### 🟠 HIGH (2 issues)

| Header | Status | Rota de Correção |
|--------|--------|------------------|
| Permissions-Policy | ❌ Não configurado | [Rota #3.3](#rota-33-permissions-policy) |
| CORS (Edge Functions) | ⚠️ Allow-Origin: * | [Rota #3.4](#rota-34-cors-restriction) |

---

## 4. 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### 🔴 CRITICAL (1 issue)

| Issue | Arquivo | Descrição | Rota de Correção |
|-------|---------|-----------|------------------|
| Service Role Key exposta | `.env`, scripts | Acesso total ao banco | [Rota #1.1](#rota-11-service-role-key) |

### 🟠 HIGH (3 issues)

| # | Issue | Descrição | Rota de Correção |
|---|-------|-----------|------------------|
| 4.1 | Sem rate limiting login | Vulnerável a brute force | [Rota #4.1](#rota-41-rate-limiting-auth) |
| 4.2 | Política de senha fraca | Apenas 6 caracteres | [Rota #4.2](#rota-42-password-policy) |
| 4.3 | API admin sem proteção | Endpoint /api/admin-users | [Rota #4.3](#rota-43-admin-api-protection) |

### 🟡 MEDIUM (5 issues)

| # | Issue | Descrição | Rota de Correção |
|---|-------|-----------|------------------|
| 4.4 | MFA/2FA não implementado | Campo existe mas não usado | [Rota #4.4](#rota-44-mfa) |
| 4.5 | Sem proteção CSRF | API routes sem CSRF tokens | [Rota #4.5](#rota-45-csrf) |
| 4.6 | Sem bloqueio de conta | Após tentativas falhas | [Rota #4.6](#rota-46-account-lockout) |
| 4.7 | Sem timeout de sessão | Por inatividade | [Rota #4.7](#rota-47-session-timeout) |
| 4.8 | RLS policy antiga | Permite impersonation | [Rota #4.8](#rota-48-rls-policy) |

---

## 5. 📝 VALIDAÇÃO DE INPUT

### 🔴 CRITICAL (1 issue)

| # | Issue | Arquivo | Descrição | Rota de Correção |
|---|-------|---------|-----------|------------------|
| 5.1 | XSS via filename | `api/upload/route.ts` | Nome de arquivo não sanitizado | [Rota #5.1](#rota-51-sanitize-filename) |

### 🟠 HIGH (1 issue)

| # | Issue | Arquivo | Descrição | Rota de Correção |
|---|-------|---------|-----------|------------------|
| 5.2 | JSON.parse sem try-catch | `lib/storage.ts` | DoS via malformed JSON | [Rota #5.2](#rota-52-json-validation) |

### 🟡 MEDIUM (4 issues)

| # | Issue | Arquivo | Rota de Correção |
|---|-------|---------|------------------|
| 5.3 | Sem schema validation (Zod) | `api/admin-users/route.ts` | [Rota #5.3](#rota-53-zod-validation) |
| 5.4 | LIKE wildcards não escapados | `services/newsManager.ts` | [Rota #5.4](#rota-54-escape-like) |
| 5.5 | Validação manual de forms | `admin/noticias/novo/page.tsx` | [Rota #5.5](#rota-55-react-hook-form) |
| 5.6 | Telemetria sem validação | `api/telemetry/error/route.ts` | [Rota #5.6](#rota-56-telemetry-validation) |

---

## 6. 🔍 ANÁLISE ESTÁTICA (SAST)

### 🟢 LOW (2 issues)

| # | Issue | Arquivo | Descrição | Rota de Correção |
|---|-------|---------|-----------|------------------|
| 6.1 | CSP ausente | `next.config.js` | Header não configurado | [Rota #3.1](#rota-31-implementar-csp) |
| 6.2 | Sanitização SSR | `lib/sanitize.ts` | Retorna HTML original no server | [Rota #6.1](#rota-61-isomorphic-sanitize) |

### 🔵 INFO (9 issues)

| # | Issue | Arquivo | Descrição |
|---|-------|---------|-----------|
| 6.3 | Rate limiting in-memory | `api/upload/route.ts` | Não escala para múltiplas instâncias |
| 6.4 | Health endpoint expõe versão | `api/health/route.ts` | Informação para reconhecimento |
| 6.5 | X-XSS-Protection ausente | `next.config.js` | Header legado não configurado |
| 6.6 | NEXT_PUBLIC_ exposto | `lib/supabaseClient.ts` | Verificar RLS está rigoroso |
| 6.7 | Version check | `package.json` | Verificar CVEs da versão 16.1.6 |
| 6.8-6.11 | (Outros alerts menores) | - | Ver seção completa |

---

# 🛠️ ROTAS DE CORREÇÃO

## Rota #1.1: Service Role Key
**Arquivos:** `.env`, `confirm-email.mjs`, `make-admin.mjs`

```bash
# 1. Rotacionar chave no Supabase Dashboard
# Acesse: Project Settings > API > Service Role Key > Generate New Key

# 2. Atualizar .env (NÃO commitar!)
# Remover: SUPABASE_SERVICE_ROLE_KEY="..."
# Adicionar em .env.local apenas (já no .gitignore)

# 3. Refatorar scripts para usar env vars
```

**Código:**
```javascript
// confirm-email.mjs - ANTES
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// confirm-email.mjs - DEPOIS
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  process.exit(1);
}
```

---

## Rota #1.2: Scripts Hardcoded
**Arquivos:** `confirm-email.mjs`, `make-admin.mjs`

```bash
# 1. Criar .env.scripts (adicionar ao .gitignore)
# 2. Usar dotenv para carregar variáveis
npm install dotenv
```

**Código:**
```javascript
// No início dos scripts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.scripts' });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

---

## Rota #1.3: Database Credentials
**Arquivo:** `.env`

```bash
# 1. Rotacionar senha no Supabase
# Dashboard > Database > Connection Pooling > Reset Password

# 2. Usar Connection Pooler (recomendado)
# Em vez de conexão direta, usar PgBouncer
```

---

## Rota #1.4: JWT Secret
**Arquivo:** `.env`

```bash
# 1. Gerar novo JWT Secret no Supabase
# Dashboard > Settings > API > JWT Settings > Generate New Secret

# 2. ATENÇÃO: Todos os tokens existentes serão invalidados!
# Usuários precisarão fazer login novamente
```

---

## Rota #1.5: Admin Password
**Arquivo:** `confirm-email.mjs:31`

```javascript
// ANTES
password: 'admin123'

// DEPOIS - Opção 1: Prompt interativo
import readline from 'readline';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await new Promise(resolve => rl.question('Senha admin: ', resolve));

// DEPOIS - Opção 2: Env var
const password = process.env.ADMIN_DEFAULT_PASSWORD;
```

---

## Rota #1.6: API Keys Frontend
**Arquivo:** `.env`

```bash
# 1. Remover NEXT_PUBLIC_FINNHUB_API_KEY do .env
# 2. Criar proxy API interno
```

**Código:**
```typescript
// src/app/api/finnhub/[...path]/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  const res = await fetch(`https://finnhub.io/api/v1/${path}`, {
    headers: { 'X-Finnhub-Token': process.env.FINNHUB_API_KEY }
  });
  
  return res;
}
```

---

## Rota #1.7: Backend-Only Secrets
**Arquivos:** `.env`

```bash
# 1. Renomear variáveis (remover NEXT_PUBLIC_)
GNEWS_API_KEY="..."
# CHAVE_IA_REMOVIDA REMOVIDO - funcionalidade descontinuada

# 2. Mover lógica para API routes ou Edge Functions
```

---

## Rota #1.8: Gitignore
**Arquivo:** `.gitignore`

```bash
# Verificar se já está no .gitignore
.env
.env.*
!.env.example

# Remover do histórico git
git rm --cached .env
git commit -m "Remove .env from tracking"

# Se já foi commitado, usar BFG Repo-Cleaner
java -jar bfg.jar --delete-files .env
```

---

## Rota #2.1: Atualizar React/Next
**Comandos:**

```bash
# URGENTE - Vulnerabilidades RCE críticas
npm install react@19.2.4 react-dom@19.2.4
npm install next@16.0.7  # ou 16.1.5+ com patch

# Verificar se aplicação funciona
npm run build
npm run test

# Se houver breaking changes, verificar changelog
```

**Verificação:**
```bash
npm audit
# Deve mostrar 0 vulnerabilidades críticas
```

---

## Rota #3.1: Implementar CSP
**Arquivo:** `next.config.js`

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy-Report-Only',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.supabase.co https://pagead2.googlesyndication.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; frame-src https://googleads.g.doubleclick.net; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; report-uri /api/csp-report;"
        }
      ]
    }
  ];
}
```

**Fase 2 (após testes):** Remover `-Report-Only` para aplicar CSP.

---

## Rota #3.2: Implementar HSTS
**Arquivo:** `next.config.js`

```javascript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload'
}
```

**Pré-requisito:** Garantir HTTPS 100% funcional antes de ativar!

---

## Rota #5.1: Sanitize Filename
**Arquivo:** `src/app/api/upload/route.ts`

```typescript
import { escapeHtml } from '@/lib/utils';

// Na resposta
return NextResponse.json({
  ...result,
  originalName: escapeHtml(file.name), // Sanitizar antes de retornar
});
```

---

## Rota Completa: Criar middleware.ts
**Novo arquivo:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Headers de segurança
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (apenas em produção HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

export const config = {
  matcher: '/:path*'
};
```

---

# ✅ CHECKLIST DE IMPLEMENTAÇÃO

## Semana 1 - CRÍTICO
- [ ] Rotacionar todas as credenciais (Supabase, APIs)
- [ ] Atualizar React para 19.2.4
- [ ] Atualizar Next.js para 16.0.7
- [ ] Remover .env do histórico git (BFG)
- [ ] Implementar CSP (Report-Only)

## Semana 2 - HIGH
- [ ] Implementar HSTS
- [ ] Criar middleware.ts
- [ ] Sanitizar filename em upload
- [ ] Adicionar rate limiting Redis
- [ ] Implementar Zod schemas

## Semana 3 - MEDIUM
- [ ] Refatorar scripts para env vars
- [ ] Criar proxy APIs
- [ ] Melhorar política de senha
- [ ] Implementar CSRF protection
- [ ] Revisar RLS policies

## Semana 4 - LOW/INFO
- [ ] Implementar MFA
- [ ] Timeout de sessão
- [ ] Bloqueio de conta
- [ ] Documentar SECURITY.md

---

**Relatório gerado por:** Subagentes de Segurança Automatizados  
**Próxima revisão recomendada:** Após implementação das correções críticas

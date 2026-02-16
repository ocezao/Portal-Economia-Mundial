# 🔧 CORREÇÕES POSSÍVEIS SEM DOMÍNIO/VPS
## Ambiente Local - Prioridade de Execução

---

## ✅ O QUE PODE SER FEITO AGORA (100% Local)

### 🔴 PRIORIDADE 1: CRÍTICO (Faça hoje)

| # | Tarefa | Arquivo(s) | Tempo | Como Testar Local |
|---|--------|------------|-------|-------------------|
| 1.1 | **Remover hardcoded keys** | `confirm-email.mjs`, `make-admin.mjs` | 30min | Rodar `node confirm-email.mjs` → deve pedir env |
| 1.2 | **Atualizar React/Next.js** | `package.json` | 20min | `npm run dev` → funciona sem erros |
| 1.3 | **Sanitizar filename** | `src/lib/security.ts`, `api/upload/route.ts` | 15min | Teste unitário manual |
| 1.4 | **Criar .env.example** | `.env.example` | 10min | Validar que não tem valores reais |

### 🟠 PRIORIDADE 2: HIGH (Esta semana)

| # | Tarefa | Arquivo(s) | Tempo | Como Testar Local |
|---|--------|------------|-------|-------------------|
| 2.1 | **Implementar CSP** | `next.config.js` | 30min | `curl -I localhost:3000` |
| 2.2 | **Criar middleware.ts** | `src/middleware.ts` | 20min | Navegar no app → funciona |
| 2.3 | **Zod validation APIs** | `src/lib/validation/`, `api/**/*.ts` | 60min | Testar POST inválido → 400 |
| 2.4 | **Escape LIKE wildcards** | `src/services/newsManager.ts` | 15min | Buscar com `%` funciona |
| 2.5 | **Proxy API Finnhub** | `src/app/api/finnhub/**` | 45min | Network tab → sem chave exposta |

### 🟡 PRIORIDADE 3: MEDIUM (Próxima semana)

| # | Tarefa | Arquivo(s) | Tempo | Local? |
|---|--------|------------|-------|--------|
| 3.1 | **Documentar SECURITY.md** | `SECURITY.md` | 20min | ✅ Sim |
| 3.2 | **Validar RLS policies** | `supabase/migrations/` | 30min | ✅ Sim (ver SQL) |
| 3.3 | **Password policy** | `src/hooks/useAuth.ts` | 20min | ✅ Sim (testar registro) |
| 3.4 | **CSRF protection** | `src/lib/csrf.ts` | 40min | ✅ Sim |

---

## ❌ O QUE NÃO PODE SER FEITO SEM VPS

| Tarefa | Por que não? | Quando fazer? |
|--------|--------------|---------------|
| **HSTS** | Requer HTTPS real | Após SSL na VPS |
| **Rate limiting Redis** | Requer Redis rodando | Deploy VPS |
| **Certbot/SSL** | Requer domínio + servidor | Config VPS |
| **DNS validation** | Requer domínio configurado | Após comprar domínio |
| **Teste CSP real** | Alguns recursos só funcionam em HTTPS | Pós-deploy |

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

### Dia 1 (Hoje) - 90 minutos

```bash
# 1. Verificar hardcoded keys (5min)
grep -n "eyJhbGci" confirm-email.mjs make-admin.mjs 2>/dev/null

# 2. Backup e atualizar dependências (20min)
cp package-lock.json package-lock.json.bak
npm install react@19.2.4 react-dom@19.2.4 next@16.0.7

# 3. Testar se aplicação funciona (10min)
npm run build  # deve passar
npm run dev    # testar navegação

# 4. Criar security.ts (15min)
# Código no final deste arquivo

# 5. Atualizar upload route (15min)
# Adicionar import e sanitização

# 6. Criar .env.scripts (10min)
cp .env .env.scripts
# Editar: deixar apenas variáveis necessárias pros scripts

# 7. Atualizar scripts .mjs (15min)
# Adicionar dotenv e validação
```

### Dia 2 - 60 minutos

```bash
# 8. Implementar CSP (30min)
# Editar next.config.js

# 9. Criar middleware.ts (20min)
# Headers de segurança globais

# 10. Testar headers (10min)
curl -I http://localhost:3000
```

### Dia 3 - 90 minutos

```bash
# 11. Criar schemas Zod (30min)
mkdir -p src/lib/validation

# 12. Aplicar validação em APIs (60min)
# Começar pelas APIs mais críticas (admin-users, upload)
```

---

## 📝 CÓDIGOS PRONTOS PARA COPIAR

### 1. security.ts (Criar arquivo)

```typescript
// src/lib/security.ts
/**
 * Utilitários de segurança
 */

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeFilename(filename: string): string {
  const basename = filename.replace(/^[\/\\]+/, '').replace(/[\/\\]+/g, '_');
  const clean = basename.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  return clean.substring(0, 255);
}

export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}
```

### 2. Atualização confirm-email.mjs

```javascript
// ANTES (remover):
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// DEPOIS (adicionar no topo):
import { config } from 'dotenv';
config({ path: './.env.scripts' });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ ERRO: Crie .env.scripts com SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
```

### 3. CSP no next.config.js

```javascript
// Adicionar dentro de async headers()
{
  key: 'Content-Security-Policy-Report-Only',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.supabase.co",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}
```

### 4. middleware.ts

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO LOCAL

Após cada tarefa, verificar:

```bash
# [ ] Hardcoded keys removidas
grep -r "eyJhbGci" *.mjs && echo "❌ FAIL" || echo "✅ PASS"

# [ ] React atualizado
npm list react | grep "19.2.4" && echo "✅ PASS" || echo "❌ FAIL"

# [ ] Build funciona
npm run build > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL"

# [ ] CSP presente
grep -q "Content-Security-Policy" next.config.js && echo "✅ PASS" || echo "❌ FAIL"

# [ ] Middleware existe
[ -f "src/middleware.ts" ] && echo "✅ PASS" || echo "❌ FAIL"

# [ ] Security.ts existe
[ -f "src/lib/security.ts" ] && echo "✅ PASS" || echo "❌ FAIL"
```

---

## ⏱️ TIMELINE TOTAL

| Dia | Tempo | Tarefas | Status |
|-----|-------|---------|--------|
| 1 | 90min | Dependências + Hardcoded + Sanitização | ⬜ |
| 2 | 60min | CSP + Middleware | ⬜ |
| 3 | 90min | Zod + Validações | ⬜ |
| 4 | 60min | Proxy APIs + Testes | ⬜ |
| **Total** | **5h** | **Tudo pronto pro deploy** | ⬜ |

---

**Próximo passo:** Quer que eu execute a FASE 1 (Dia 1) agora?

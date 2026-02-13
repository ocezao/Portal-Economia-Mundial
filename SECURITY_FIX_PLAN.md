# 🛠️ PLANO DE CORREÇÃO - SEGURANÇA CIN
## Passo a passo com verificação

---

## 📋 ÍNDICE POR PRIORIDADE

### 🔴 FASE 1: CRÍTICO (Imediato - Bloqueante para deploy)
| # | Issue | Tempo Est. | Arquivos |
|---|-------|------------|----------|
| 1.1 | Hardcoded keys em scripts | 30min | `confirm-email.mjs`, `make-admin.mjs` |
| 1.2 | Atualizar React/Next (CVEs RCE) | 20min | `package.json` |
| 1.3 | Sanitizar filename upload | 15min | `api/upload/route.ts` |

### 🟠 FASE 2: HIGH (Pre-deploy)
| # | Issue | Tempo Est. | Arquivos |
|---|-------|------------|----------|
| 2.1 | Implementar CSP | 45min | `next.config.js` |
| 2.2 | Implementar HSTS | 15min | `next.config.js`, `middleware.ts` |
| 2.3 | Criar middleware.ts | 30min | `src/middleware.ts` |
| 2.4 | Rate limiting Redis | 60min | `api/*`, Docker |

### 🟡 FASE 3: MEDIUM (Post-deploy semana 1)
| # | Issue | Tempo Est. | Arquivos |
|---|-------|------------|----------|
| 3.1 | Zod validation APIs | 90min | `api/**/*.ts` |
| 3.2 | Escape LIKE wildcards | 20min | `services/newsManager.ts` |
| 3.3 | Proxy APIs terceiros | 60min | `api/finnhub/**` |

---

# 🔴 FASE 1: CRÍTICO

## 1.1 Hardcoded Keys em Scripts

### Passo 1: Verificar se existem hardcoded keys
```bash
# Verificar confirm-email.mjs
grep -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" confirm-email.mjs
# ou
grep -n "serviceRoleKey\s*=" confirm-email.mjs

# Verificar make-admin.mjs
grep -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" make-admin.mjs
grep -n "serviceRoleKey\s*=" make-admin.mjs

# Verificar senha admin hardcoded
grep -n "admin123\|password:" confirm-email.mjs
```

**Resultado esperado:** Se retornar linhas, há hardcoded keys.

### Passo 2: Criar .env.scripts
```bash
# Criar arquivo
cat > .env.scripts << 'EOF'
# Scripts utilities - NUNCA commitar este arquivo
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
ADMIN_DEFAULT_PASSWORD=senha_segura_aqui
EOF

# Adicionar ao .gitignore
echo -e "\n# Scripts env\n.env.scripts\n.env.scripts.*" >> .gitignore
```

### Passo 3: Refatorar confirm-email.mjs
```javascript
// ANTES (remover isto):
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// DEPOIS (adicionar no topo do arquivo):
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.scripts') });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;

if (!serviceRoleKey) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.error('Crie um arquivo .env.scripts na pasta raiz');
  process.exit(1);
}

if (!adminPassword) {
  console.error('❌ ERRO: ADMIN_DEFAULT_PASSWORD não configurada');
  process.exit(1);
}
```

### Passo 4: Refatorar make-admin.mjs
```javascript
// Mesma estrutura do passo 3
import { config } from 'dotenv';
config({ path: './.env.scripts' });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ ERRO: Variável de ambiente necessária');
  process.exit(1);
}
```

### Passo 5: Verificação
```bash
# Testar se os scripts funcionam com env
node confirm-email.mjs
# Deve mostrar: "❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada"

# Configurar e testar novamente
echo 'SUPABASE_SERVICE_ROLE_KEY=teste' > .env.scripts
echo 'ADMIN_DEFAULT_PASSWORD=teste123' >> .env.scripts

node confirm-email.mjs
# Deve prosseguir (pode falhar na API mas não no env)

# Limpar teste
rm .env.scripts
```

**✅ Checklist:**
- [ ] Scripts não contêm strings de chaves
- [ ] Scripts falham graceful se env não existe
- [ ] .env.scripts está no .gitignore
- [ ] Teste passou

---

## 1.2 Atualizar React/Next (CVEs RCE)

### Passo 1: Backup e atualização
```bash
# Backup do package-lock.json
cp package-lock.json package-lock.json.backup

# Atualizar react (CVE-2025-55182)
npm install react@19.2.4 react-dom@19.2.4

# Atualizar next (CVE-2025-66478)
npm install next@16.0.7

# Se der erro, tentar versão alternativa
# npm install next@16.1.6  # ou versão mais recente sem CVE
```

### Passo 2: Verificar instalação
```bash
# Verificar versões instaladas
npm list react react-dom next

# Deve mostrar:
# react@19.2.4
# react-dom@19.2.4
# next@16.0.7 (ou versão segura)
```

### Passo 3: Testar build
```bash
# Limpar cache
rm -rf .next

# Build
npm run build

# Verificar se não há erros
```

### Passo 4: Testes funcionais
```bash
# Iniciar dev server
npm run dev

# Verificar console do navegador (F12)
# Não deve haver erros de React
```

### Passo 5: Verificação de segurança
```bash
# Rodar audit
npm audit

# Deve mostrar 0 vulnerabilidades CRITICAL em react/next
# Se mostrar, verificar se são relacionadas ao CVE
```

**✅ Checklist:**
- [ ] `npm list react` mostra 19.2.4
- [ ] `npm list next` mostra versão sem CVE
- [ ] Build passou sem erros
- [ ] `npm audit` não mostra CVEs críticos
- [ ] Aplicação inicia normalmente

---

## 1.3 Sanitizar Filename Upload

### Passo 1: Localizar o código
```bash
# Encontrar linha exata
grep -n "originalName\|file.name" src/app/api/upload/route.ts
```

### Passo 2: Criar função de utilidade
```bash
# Criar arquivo src/lib/security.ts
cat > src/lib/security.ts << 'EOF'
/**
 * Utilitários de segurança
 */

/**
 * Escapa HTML para prevenir XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitiza nome de arquivo
 * Remove caracteres perigosos e path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remover path traversal
  const basename = filename.replace(/^[\/\\]+/, '').replace(/[\/\\]+/g, '_');
  
  // Remover caracteres de controle
  const clean = basename.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Limitar tamanho
  return clean.substring(0, 255);
}

/**
 * Escapa caracteres LIKE SQL
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}
EOF
```

### Passo 3: Atualizar upload route
```typescript
// src/app/api/upload/route.ts
import { escapeHtml, sanitizeFilename } from '@/lib/security';

// Na resposta (aproximadamente linha 140+):
return NextResponse.json({
  success: true,
  file: {
    url: result.url,
    pathname: result.pathname,
    // SANITIZAR ANTES DE RETORNAR
    originalName: escapeHtml(sanitizeFilename(file.name)),
    size: file.size,
    contentType: file.type
  }
});
```

### Passo 4: Testar sanitização
```bash
# Criar teste manual
cat > test-sanitize.js << 'EOF'
const { escapeHtml, sanitizeFilename } = require('./src/lib/security.ts');

// Teste XSS
console.log('XSS Test:', escapeHtml('<img src=x onerror=alert(1)>.jpg'));
// Esperado: &lt;img src=x onerror=alert(1)&gt;.jpg

// Teste Path Traversal
console.log('Path Test:', sanitizeFilename('../../../etc/passwd'));
// Esperado: .._.._.._etc_passwd

// Teste nome longo
console.log('Length Test:', sanitizeFilename('a'.repeat(300)).length);
// Esperado: 255
EOF

node test-sanitize.js
rm test-sanitize.js
```

**✅ Checklist:**
- [ ] Funções criadas em `src/lib/security.ts`
- [ ] Upload route usa `escapeHtml` e `sanitizeFilename`
- [ ] Teste manual passou
- [ ] Build passa sem erros de TypeScript

---

# 🟠 FASE 2: HIGH

## 2.1 Implementar CSP (Content Security Policy)

### Passo 1: Modificar next.config.js
```javascript
// next.config.js
const nextConfig = {
  // ... config existente ...
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // CSP em modo report-only primeiro (para testar)
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://*.supabase.co https://images.unsplash.com https://pagead2.googlesyndication.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.finnhub.io",
              "frame-src https://googleads.g.doubleclick.net",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ];
  }
};
```

### Passo 2: Verificar CSP
```bash
# Build
npm run build

# Iniciar e verificar headers
curl -I http://localhost:3000

# Deve conter:
# Content-Security-Policy-Report-Only: default-src 'self'; ...
```

### Passo 3: Monitorar violations
```bash
# Abrir console do navegador (F12)
# Navegar pela aplicação
# Verificar se há erros CSP no console
```

**✅ Checklist:**
- [ ] Header CSP presente na resposta
- [ ] Navegação funciona sem erros CSP
- [ ] AdSense continua funcionando (se habilitado)
- [ ] Fonts carregam corretamente

---

## 2.2 Implementar HSTS

### Passo 1: Adicionar ao next.config.js
```javascript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=31536000; includeSubDomains; preload'
}
```

### Passo 2: Criar middleware.ts (para validação)
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Headers de segurança globais
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // HSTS apenas em produção HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
```

### Passo 3: Verificar
```bash
# Verificar se middleware está funcionando
curl -I http://localhost:3000

# Deve mostrar:
# strict-transport-security: max-age=31536000; includeSubDomains
```

**✅ Checklist:**
- [ ] Middleware criado
- [ ] Headers presentes na resposta
- [ ] Navegação funciona normalmente

---

# 🟡 FASE 3: MEDIUM

## 3.1 Zod Validation APIs

### Passo 1: Criar schemas
```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['admin', 'editor', 'author', 'user'])
});

export const uploadSchema = z.object({
  file: z.instanceof(File)
    .refine(f => f.size <= 10 * 1024 * 1024, 'Máximo 10MB')
    .refine(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type), 'Tipo inválido')
});

export const searchSchema = z.object({
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
```

### Passo 2: Aplicar em API routes
```typescript
// src/app/api/admin-users/route.ts
import { createUserSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validar com Zod
  const result = createUserSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: result.error.flatten() },
      { status: 400 }
    );
  }
  
  // Usar result.data (tipado e validado)
  const { email, password, role } = result.data;
  // ...
}
```

**✅ Checklist:**
- [ ] Schemas criados
- [ ] APIs validam input
- [ ] Erros retornam 400 com detalhes

---

## 3.2 Escape LIKE Wildcards

### Passo 1: Atualizar newsManager.ts
```typescript
// src/services/newsManager.ts
import { escapeLikePattern } from '@/lib/security';

// Na função searchArticles:
export async function searchArticles(query: string, options?: SearchOptions) {
  // Escapar wildcards SQL
  const safeQuery = escapeLikePattern(query);
  const likePattern = `%${safeQuery}%`;
  
  // Usar pattern seguro na query
  // ...
}
```

**✅ Checklist:**
- [ ] Busca com `%` e `_` funciona corretamente
- [ ] Não há injeção SQL

---

# ✅ VERIFICAÇÃO FINAL

## Script de Teste Completo

```bash
#!/bin/bash
# security-check.sh

echo "🔒 VERIFICAÇÃO DE SEGURANÇA"
echo "=========================="

# 1. Verificar hardcoded keys
echo -e "\n1. Verificando hardcoded keys..."
if grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --include="*.mjs" --include="*.ts" .; then
  echo "❌ FAIL: Hardcoded keys encontradas"
  exit 1
else
  echo "✅ PASS: Nenhuma hardcoded key"
fi

# 2. Verificar versões
echo -e "\n2. Verificando versões..."
REACT_VERSION=$(npm list react --json 2>/dev/null | grep -o '"version": "[^"]*"' | head -1)
if echo "$REACT_VERSION" | grep -q "19.2.4"; then
  echo "✅ PASS: React atualizado"
else
  echo "❌ FAIL: React desatualizado: $REACT_VERSION"
fi

# 3. Verificar CSP
echo -e "\n3. Verificando CSP..."
if grep -q "Content-Security-Policy" next.config.js; then
  echo "✅ PASS: CSP configurado"
else
  echo "❌ FAIL: CSP não configurado"
fi

# 4. Verificar middleware
echo -e "\n4. Verificando middleware..."
if [ -f "src/middleware.ts" ]; then
  echo "✅ PASS: Middleware existe"
else
  echo "❌ FAIL: Middleware não existe"
fi

# 5. Verificar security.ts
echo -e "\n5. Verificando utilitários de segurança..."
if [ -f "src/lib/security.ts" ]; then
  echo "✅ PASS: security.ts existe"
else
  echo "❌ FAIL: security.ts não existe"
fi

echo -e "\n=========================="
echo "Verificação completa!"
```

## Comando de Execução

```bash
chmod +x security-check.sh
./security-check.sh
```

---

**Relatório completo:** `SECURITY_AUDIT_REPORT.md`  
**Este plano:** `SECURITY_FIX_PLAN.md`

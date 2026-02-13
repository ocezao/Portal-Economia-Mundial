# 🛡️ Guia de Segurança para Desenvolvedores
## Cenario Internacional - Boas Práticas

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Módulo de Segurança](#módulo-de-segurança)
3. [Validação de Input](#validação-de-input)
4. [Proteção contra XSS](#proteção-contra-xss)
5. [Proteção contra SQL Injection](#proteção-contra-sql-injection)
6. [Gerenciamento de Secrets](#gerenciamento-de-secrets)
7. [Headers de Segurança](#headers-de-segurança)
8. [Checklist de Code Review](#checklist-de-code-review)

---

## Visão Geral

Este guia documenta as práticas de segurança adotadas no projeto e como utilizá-las corretamente.

### Princípios Fundamentais

1. **Nunca confie no input do usuário**
2. **Sempre sanitize outputs**
3. **Secrets nunca no código**
4. **Princípio do menor privilégio**

---

## Módulo de Segurança

O projeto possui um módulo centralizado de segurança em `src/lib/security.ts`.

### Funções Disponíveis

#### `escapeHtml(unsafe: string): string`

**Uso:** Previne XSS escapando caracteres HTML especiais.

**Quando usar:**
- Exibir dados de usuário no DOM
- Retornar dados em APIs que serão renderizados
- Qualquer output que possa conter HTML

**Exemplo:**
```typescript
import { escapeHtml } from '@/lib/security';

// Em um componente React
function UserComment({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ 
    __html: escapeHtml(content) 
  }} />;
}

// Em uma API route
return NextResponse.json({
  message: escapeHtml(userInput)
});
```

**NÃO use para:**
- Conteúdo HTML confiável (use DOMPurify via `sanitizeHtml`)

---

#### `sanitizeFilename(filename: string): string`

**Uso:** Remove caracteres perigosos de nomes de arquivo.

**Quando usar:**
- Upload de arquivos
- Exibição de nomes de arquivo
- Processamento de paths

**Exemplo:**
```typescript
import { sanitizeFilename } from '@/lib/security';

// Em upload de arquivo
const safeName = sanitizeFilename(file.name);
await fs.writeFile(`./uploads/${safeName}`, buffer);

// Combinado com escapeHtml para exibição
return NextResponse.json({
  originalName: escapeHtml(sanitizeFilename(file.name))
});
```

**Protege contra:**
- Path traversal (`../../../etc/passwd`)
- Caracteres de controle
- Caracteres especiais do sistema de arquivos

---

#### `escapeLikePattern(pattern: string): string`

**Uso:** Escapa wildcards SQL para consultas LIKE seguras.

**Quando usar:**
- Busca com operador LIKE/ILIKE
- Filtros de texto em queries SQL
- Autocomplete/search

**Exemplo:**
```typescript
import { escapeLikePattern } from '@/lib/security';

// Antes (VULNERÁVEL)
const like = `%${userQuery}%`;
await supabase
  .from('articles')
  .or(`title.ilike.${like},content.ilike.${like}`);

// Depois (SEGURO)
const safeQuery = escapeLikePattern(userQuery);
const like = `%${safeQuery}%`;
await supabase
  .from('articles')
  .or(`title.ilike.${like},content.ilike.${like}`);
```

**Escapa:**
- `%` (wildcard de múltiplos caracteres)
- `_` (wildcard de único caractere)
- `\` (caractere de escape)

---

#### `isValidEmail(email: string): boolean`

**Uso:** Validação básica de formato de email.

**Exemplo:**
```typescript
import { isValidEmail } from '@/lib/security';

if (!isValidEmail(userInput)) {
  return NextResponse.json(
    { error: 'Email inválido' },
    { status: 400 }
  );
}
```

---

#### `sanitizeText(input: string): string`

**Uso:** Sanitização básica de texto sem HTML.

**Exemplo:**
```typescript
import { sanitizeText } from '@/lib/security';

const clean = sanitizeText(userInput);
// Remove tags HTML, caracteres de controle, limita a 10000 chars
```

---

## Validação de Input

### Regras Gerais

1. **Valide no frontend** (UX) **E no backend** (segurança)
2. **Use Zod** para schemas de validação
3. **Sempre escape** antes de usar em queries

### Exemplo Completo

```typescript
import { z } from 'zod';
import { escapeHtml, escapeLikePattern } from '@/lib/security';

// Schema de validação
const searchSchema = z.object({
  q: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 1. Parse e validação
  const result = searchSchema.safeParse({
    q: searchParams.get('q'),
    page: Number(searchParams.get('page')) || 1,
  });
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos' },
      { status: 400 }
    );
  }
  
  const { q, page } = result.data;
  
  // 2. Escape para uso seguro
  const safeQuery = q ? escapeLikePattern(q) : '';
  
  // 3. Uso na query
  const { data } = await supabase
    .from('articles')
    .select('*')
    .ilike('title', `%${safeQuery}%`)
    .range((page - 1) * 10, page * 10 - 1);
  
  // 4. Escape no retorno (se necessário)
  return NextResponse.json({
    results: data?.map(item => ({
      ...item,
      title: escapeHtml(item.title), // Se for renderizado no DOM
    }))
  });
}
```

---

## Proteção contra XSS

### Estratégias do Projeto

1. **DOMPurify** para HTML rico
2. **escapeHtml** para texto simples
3. **CSP** (Content Security Policy)

### Quando usar cada um

| Cenário | Ferramenta | Exemplo |
|---------|------------|---------|
| Conteúdo HTML do editor | DOMPurify | Artigos, comentários formatados |
| Texto simples de usuário | escapeHtml | Nomes, títulos, buscas |
| Nomes de arquivo | sanitizeFilename | Uploads |
| Retorno de APIs | escapeHtml | JSON responses |

### Exemplo: Renderização Segura

```tsx
import { sanitizeHtml } from '@/lib/sanitize';
import { escapeHtml } from '@/lib/security';

// Conteúdo HTML rico (do editor)
function ArticleContent({ html }: { html: string }) {
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: sanitizeHtml(html) // DOMPurify com whitelist
      }} 
    />
  );
}

// Texto simples (nome do autor)
function AuthorName({ name }: { name: string }) {
  return (
    <span dangerouslySetInnerHTML={{ 
      __html: escapeHtml(name) // Escape simples
    }} />
  );
  
  // Ou melhor ainda (React escapa automaticamente):
  return <span>{name}</span>;
}
```

---

## Proteção contra SQL Injection

### Práticas Adotadas

1. **Supabase Client** - Queries parametrizadas automaticamente
2. **escapeLikePattern** - Escaping de wildcards para LIKE
3. **Sem concatenção SQL** - Nunca concatene strings em queries

### Exemplo Seguro vs Inseguro

```typescript
// ❌ INSEGURO - Nunca faça isso
const query = `SELECT * FROM users WHERE name = '${userInput}'`;

// ✅ SEGURO - Use o cliente Supabase
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('name', userInput); // Automaticamente parametrizado

// ❌ INSEGURO - LIKE sem escape
const like = `%${userInput}%`;
.or(`title.ilike.${like}`)

// ✅ SEGURO - LIKE com escape
const safeQuery = escapeLikePattern(userInput);
const like = `%${safeQuery}%`;
.or(`title.ilike.${like}`)
```

---

## Gerenciamento de Secrets

### Hierarquia de Variáveis

```
.env                    # NUNCA commitar (já no .gitignore)
.env.local              # Override local
.env.scripts            # Scripts de utilidade (não commitar)
.env.example            # Template para documentação
```

### Regras

1. **NUNCA** coloque secrets diretamente no código
2. **NUNCA** commitar arquivos `.env*` (exceto `.env.example`)
3. **SEMPRE** valide se a variável existe antes de usar
4. **Use** `NEXT_PUBLIC_` apenas para valores que podem ser públicos

### Exemplo: Uso Seguro de Secrets

```typescript
// ❌ ERRADO
const apiKey = 'sk-1234567890abcdef';

// ✅ CERTO
const apiKey = process.env.API_SECRET_KEY;
if (!apiKey) {
  throw new Error('API_SECRET_KEY não configurada');
}
```

### Scripts de Utilidade

Para scripts `.mjs` que precisam de secrets:

```javascript
import { config } from 'dotenv';
config({ path: './.env.scripts' });

const secret = process.env.MY_SECRET;
if (!secret) {
  console.error('❌ MY_SECRET não configurada');
  process.exit(1);
}
```

---

## Headers de Segurança

### Headers Configurados

Atualmente em `next.config.js`:

```javascript
{
  key: 'X-Frame-Options',        // Previne clickjacking
  value: 'DENY'
},
{
  key: 'X-Content-Type-Options', // Previne MIME sniffing
  value: 'nosniff'
},
{
  key: 'Referrer-Policy',        // Controla informação de referrer
  value: 'strict-origin-when-cross-origin'
}
```

### Futuros (Pendentes)

- `Content-Security-Policy` (CSP)
- `Strict-Transport-Security` (HSTS)
- `Permissions-Policy`

---

## Checklist de Code Review

### Antes de commitar, verifique:

#### ✅ Input Validation
- [ ] Todos os inputs de usuário são validados?
- [ ] Strings têm limite de tamanho?
- [ ] Números têm range válido?

#### ✅ Output Encoding
- [ ] Dados de usuário são escapados antes de exibição?
- [ ] APIs retornam dados sanitizados?
- [ ] Nomes de arquivo são sanitizados?

#### ✅ SQL/NoSQL
- [ ] Não há concatenação de queries?
- [ ] LIKE queries usam `escapeLikePattern`?
- [ ] Está usando o cliente Supabase corretamente?

#### ✅ Secrets
- [ ] Nenhum secret hardcoded?
- [ ] Variáveis de ambiente são validadas?
- [ ] Arquivos `.env*` não foram commitados?

#### ✅ XSS Prevention
- [ ] `dangerouslySetInnerHTML` só com conteúdo sanitizado?
- [ ] URLs externas são validadas?
- [ ] Event handlers inline são seguros?

---

## Exemplos Completos

### API Route Segura

```typescript
// src/app/api/articles/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { escapeHtml, escapeLikePattern } from '@/lib/security';

const createSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(50000),
  category: z.enum(['economy', 'politics', 'tech']),
});

export async function POST(request: Request) {
  try {
    // 1. Parse body
    const body = await request.json();
    
    // 2. Validar schema
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { title, content, category } = result.data;
    
    // 3. Inserir no banco (Supabase escapa automaticamente)
    const { data, error } = await supabase
      .from('articles')
      .insert({
        title,
        content,
        category,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 4. Retornar resposta segura
    return NextResponse.json({
      success: true,
      article: {
        ...data,
        title: escapeHtml(data.title), // Extra safety
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar artigo:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  
  // Escape para busca segura
  const safeQuery = escapeLikePattern(query);
  
  const { data } = await supabase
    .from('articles')
    .select('*')
    .ilike('title', `%${safeQuery}%`)
    .limit(20);
  
  return NextResponse.json({
    results: data?.map(article => ({
      ...article,
      title: escapeHtml(article.title),
    })) || []
  });
}
```

---

## Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Supabase Security](https://supabase.com/docs/guides/database/security)
- [Next.js Security](https://nextjs.org/docs/architecture/security)

---

**Mantenha este guia atualizado conforme novas práticas forem adotadas.**

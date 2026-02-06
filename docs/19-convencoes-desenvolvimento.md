# Convenções de Desenvolvimento - PEM

## Padrões e Regras do Projeto

---

## 1. Padrão de Portas (REGRA CRÍTICA)

### 1.1 Porta do Frontend (Obrigatória)

A porta **5173 é obrigatória** para o servidor de desenvolvimento do frontend.

```bash
# Comando correto
npm run dev

# O Vite deve iniciar em:
# ➜  Local:   http://localhost:5173/
```

### 1.2 Tabela de Portas

| Serviço | Porta | Obrigatória? | Quando Usar |
|---------|-------|--------------|-------------|
| **Frontend (Vite)** | **5173** | ✅ SIM | Sempre para desenvolvimento local |
| Analytics Collector | 3000 | ❌ Não | Apenas se desenvolvendo feature de analytics |
| Metabase | 3001 | ❌ Não | Apenas se usando dashboard de analytics |
| PostgreSQL | 5432 | ❌ Não | Apenas se usando analytics local |

### 1.3 Procedimento quando a Porta 5173 está Ocupada

**❌ NUNCA faça isso:**
```bash
# Não use outra porta sem permissão!
npm run dev -- --port 5174  # PROIBIDO sem autorização
```

**✅ FAÇA ISSO:**

1. Identifique o processo usando a porta:
   ```bash
   # Windows
   netstat -ano | findstr :5173
   
   # Linux/Mac
   lsof -i :5173
   ```

2. Encerre o processo:
   ```bash
   # Windows
   taskkill /F /PID <PID>
   
   # Linux/Mac
   kill -9 <PID>
   ```

3. Inicie novamente:
   ```bash
   npm run dev
   ```

### 1.4 Exceções Aceitáveis

| Comando | Porta | Quando Usar |
|---------|-------|-------------|
| `npm run dev` | **5173** | Desenvolvimento local (obrigatório) |
| `npm run preview` | 4173 | Preview do build de produção (aceitável) |

⚠️ O comando `vite preview` usa a porta 4173 por padrão. Isso é **aceitável** porque:
- É um propósito diferente (preview vs desenvolvimento)
- Não conflita com o servidor de dev
- É temporário (só para testar o build)

### 1.5 Quando Perguntar ao Usuário

**Se por algum motivo você PRECISAR usar outra porta para desenvolvimento:**

1. Pare imediatamente
2. Pergunte ao usuário:
   > "A porta 5173 está ocupada. Posso usar a porta 5174? Motivo: [explique aqui]"
3. Aguarde a resposta explícita (sim/não)
4. Só prossiga com autorização

---

## 2. Estrutura de Commits

### 2.1 Padrão de Mensagens

```
<tipo>: <descrição curta>

[corpo opcional]

[footer opcional]
```

### 2.2 Tipos de Commit

| Tipo | Uso | Exemplo |
|------|-----|---------|
| `feat` | Nova funcionalidade | `feat: adicionar busca por tags` |
| `fix` | Correção de bug | `fix: corrigir login no Safari` |
| `docs` | Documentação | `docs: atualizar README` |
| `style` | Formatação | `style: ajustar indentação` |
| `refactor` | Refatoração | `refactor: simplificar hook useAuth` |
| `test` | Testes | `test: adicionar testes de login` |
| `chore` | Tarefas | `chore: atualizar dependências` |

---

## 3. Estrutura de Pastas

```
src/
├── components/        # Componentes React
│   ├── home/         # Componentes específicos da Home
│   ├── layout/       # Header, Footer, Layout
│   ├── news/         # Cards, ArticleContent
│   ├── geoEcon/      # Componentes geo-econômicos
│   └── ui/           # shadcn/ui components
├── pages/            # Páginas da aplicação
├── hooks/            # Custom hooks
├── services/         # Serviços e APIs
├── config/           # Configurações
├── types/            # TypeScript types
├── lib/              # Utilitários
└── contexts/         # React contexts
```

---

## 4. Nomenclatura

### 4.1 Arquivos

- Componentes: `PascalCase.tsx` (ex: `HeroSection.tsx`)
- Hooks: `camelCase.ts` com prefixo `use` (ex: `useAuth.ts`)
- Utilitários: `camelCase.ts` (ex: `formatDate.ts`)
- Tipos: `PascalCase.ts` ou `types.ts`

### 4.2 Componentes

```typescript
// Nome do arquivo: HeroSection.tsx
interface HeroSectionProps {
  mainArticle: NewsArticle;
}

export function HeroSection({ mainArticle }: HeroSectionProps) {
  // ...
}
```

### 4.3 Variáveis e Funções

```typescript
// Variáveis: camelCase
const articleCount = 10;

// Funções: camelCase
function getArticles() { }

// Booleanos: prefixo is/has/should
const isLoading = true;
const hasComments = false;
const shouldRefresh = true;

// Constantes: UPPER_SNAKE_CASE
const MAX_ARTICLES = 100;
const API_TIMEOUT = 5000;
```

---

## 5. Estilo de Código

### 5.1 TypeScript

- Sempre use tipos explícitos em props
- Evite `any`
- Use interfaces para objetos complexos
- Use type para uniões e aliases

### 5.2 React

- Use functional components
- Use hooks em vez de classes
- Prefira composição over inheritance
- Use `React.FC` apenas quando necessário

### 5.3 CSS/Tailwind

- Use classes do Tailwind sempre que possível
- Cores: use as definidas no tema (ex: `[#c40000]`)
- Evite CSS inline
- Media queries: use breakpoints do Tailwind

---

## 6. Regras de Qualidade

### 6.1 Antes de Commitar

- [ ] Código compila sem erros (`npm run build`)
- [ ] Lint passa (`npm run lint`)
- [ ] TypeScript sem erros
- [ ] Testes passam (se houver)
- [ ] Porta 5173 está sendo usada

### 6.2 Pull Requests

- Descreva o que mudou
- Referencie issues relacionadas
- Inclua screenshots se for UI
- Garanta que não há conflitos

---

## 7. Ambiente de Desenvolvimento

### 7.1 VS Code (Recomendado)

Extensões recomendadas:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer
- GitLens

### 7.2 Configurações

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## 8. Comandos Úteis

```bash
# Desenvolvimento (porta 5173)
npm run dev

# Build de produção
npm run build

# Lint
npm run lint

# Preview do build
npm run preview
```

---

## 9. Troubleshooting Comum

### 9.1 Porta 5173 em Uso

```bash
# Encontrar processo
netstat -ano | findstr :5173

# Matar processo (Windows)
taskkill /F /PID <PID>

# Matar processo (Linux/Mac)
kill -9 <PID>
```

### 9.2 Erros de Build

```bash
# Limpar cache
rm -rf node_modules
rm -rf dist
npm install
npm run build
```

### 9.3 Erros de TypeScript

```bash
# Reiniciar TS server no VS Code
Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

### 9.4 Erro: "Dynamic require of ... is not supported" no Vite

**Erro:**
```
failed to load config from vite.config.ts
Error: Dynamic require of "file:///.../kimi-plugin-inspect-react/dist/inspectAttr.mjs" is not supported
```

**Causa:** Plugin `kimi-plugin-inspect-react` usa `require()` para importar módulo ESM, que não é compatível com Vite 7 + ES modules.

**Solução:** Remover o plugin do `vite.config.ts`:
```typescript
// ❌ REMOVIDO - Causa erro de compatibilidade ESM
// ...(process.env.NODE_ENV === 'development' ? [require('kimi-plugin-inspect-react').inspectAttr()] : []),

// ✅ CONFIGURAÇÃO ATUAL - Funciona corretamente
plugins: [react()]
```

**Data da correção:** 2026-02-05

---

## 10. Recursos

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Data de criação:** 2024-02-04  
**Última atualização:** 2026-02-05 (adicionado troubleshooting do plugin kimi-plugin-inspect-react)  
**Versão:** 1.1

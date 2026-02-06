# Guia de Contribuição - Portal Econômico Mundial

Obrigado por seu interesse em contribuir com o Portal Econômico Mundial! Este documento fornece diretrizes e processos para contribuir com o projeto.

---

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Padrões de Código](#padrões-de-código)
5. [Convenções de Commit](#convenções-de-commit)
6. [Processo de Pull Request](#processo-de-pull-request)
7. [Critérios de Aceitação](#critérios-de-aceitação)
8. [Templates](#templates)

---

## 🤝 Código de Conduta

### Nossos Compromissos

- **Respeito:** Trate todos com respeito, independente de experiência, identidade ou opinião
- **Construtividade:** Feedback deve ser construtivo e focado na melhoria do código
- **Inclusão:** Crie um ambiente acolhedor para contribuidores de todos os níveis
- **Profissionalismo:** Mantenha discussões técnicas profissionais e focadas

### Comportamentos Inaceitáveis

- Assédio, linguagem discriminatória ou ataques pessoais
- Trolling, comentários desrespeitosos ou insultos
- Publicação de informações privadas sem consentimento
- Qualquer conduta que poderia ser considerada inadequada em ambiente profissional

### Reportar Problemas

Se você presenciar ou for vítima de comportamento inaceitável, entre em contato:
- Email: conduct@portaleconomicomundial.com
- Issues privadas no GitHub

---

## 🚀 Como Contribuir

### Tipos de Contribuição

- **🐛 Bug Reports:** Reportar problemas encontrados
- **💡 Feature Requests:** Sugerir novas funcionalidades
- **📝 Documentação:** Melhorar documentação existente
- **🔧 Code:** Implementar correções ou features
- **🧪 Tests:** Adicionar ou melhorar testes

### Fluxo de Contribuição

```
1. Fork do repositório
        ↓
2. Clone local
        ↓
3. Crie branch (feature/xyz ou fix/xyz)
        ↓
4. Desenvolva com commits atômicos
        ↓
5. Execute testes e lint
        ↓
6. Push para seu fork
        ↓
7. Abra Pull Request
        ↓
8. Revisão de código
        ↓
9. Merge (aprovado)
```

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ (recomendado: 20 LTS)
- npm 9+ ou pnpm 8+
- Git 2.40+
- Docker (opcional, para analytics)

### Passo a Passo

```bash
# 1. Fork o repositório no GitHub
# Clique no botão "Fork" no topo da página

# 2. Clone seu fork
git clone https://github.com/SEU_USUARIO/pem-portal.git
cd pem-portal

# 3. Adicione upstream
git remote add upstream https://github.com/original/pem-portal.git

# 4. Instale dependências
npm install

# 5. Copie variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 6. Inicie em modo desenvolvimento
npm run dev

# 7. Verifique se está funcionando
# Acesse http://localhost:5173
```

### Sincronizar com Upstream

```bash
# Buscar atualizações
git fetch upstream

# Atualizar sua branch main
git checkout main
git merge upstream/main

# Atualizar seu fork no GitHub
git push origin main
```

---

## 📐 Padrões de Código

### Formatação

Usamos **Prettier** e **ESLint** para manter consistência:

```bash
# Verificar formatação
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Formatar com Prettier
npm run format
```

### Configuração de Editor

**VSCode** (recomendado):
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "@",
  "files.eol": "\n"
}
```

### Estilo de Código TypeScript/React

#### Nomenclatura

```typescript
// ✅ Variáveis/Funções: camelCase
const userName = 'João';
function getUserData() { }

// ✅ Componentes: PascalCase
function UserProfile() { }
const ArticleCard = () => { };

// ✅ Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://...';

// ✅ Interfaces/Types: PascalCase + sufixo descritivo
interface UserProps { }
interface ArticleData { }
type ArticleStatus = 'draft' | 'published';

// ❌ Evite
const user_name = '';      // snake_case
function GetData() { }     // PascalCase em função
const maxretry = 3;        // minúsculo
```

#### Organização de Imports

```typescript
// 1. React e bibliotecas externas
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Componentes absolutos (@)
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';

// 3. Hooks absolutos
import { useAuth } from '@/hooks/useAuth';

// 4. Serviços/Utilitários
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

// 5. Tipos
import type { Article } from '@/types';

// 6. Estilos
import './styles.css';
```

#### Componentes React

```typescript
// ✅ Componente funcional com TypeScript
interface ArticleCardProps {
  article: Article;
  onClick?: (id: string) => void;
  showBadge?: boolean;
}

export function ArticleCard({ 
  article, 
  onClick, 
  showBadge = false 
}: ArticleCardProps) {
  const handleClick = () => {
    onClick?.(article.id);
  };

  return (
    <article onClick={handleClick}>
      {showBadge && <span className="badge">Novo</span>}
      <h2>{article.title}</h2>
    </article>
  );
}

// ✅ Hook customizado
export function useArticle(id: string) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle(id)
      .then(setArticle)
      .finally(() => setLoading(false));
  }, [id]);

  return { article, loading };
}
```

#### Semântica HTML

```tsx
// ✅ Usar tags semânticas (regra obrigatória do projeto)
<article>
  <header>
    <h1>Título do Artigo</h1>
    <time dateTime="2024-01-15">15 Jan 2024</time>
  </header>
  <section>
    <p>Conteúdo...</p>
  </section>
  <aside>
    <h2>Relacionados</h2>
  </aside>
  <footer>
    <p>Autor: João</p>
  </footer>
</article>

// ❌ NUNCA usar div para layout
<div className="article">           // ❌
  <div className="header">          // ❌
```

### Documentação de Código

```typescript
/**
 * Busca artigos por categoria com paginação
 * 
 * @param category - Categoria dos artigos (economia, geopolitica, tecnologia)
 * @param page - Número da página (começa em 1)
 * @param limit - Quantidade de itens por página (padrão: 10, max: 50)
 * @returns Promise com array de artigos e informações de paginação
 * 
 * @example
 * const { data, pagination } = await getArticlesByCategory('economia', 1, 20);
 * 
 * @throws {ApiError} Quando a API retorna erro 4xx/5xx
 */
export async function getArticlesByCategory(
  category: string,
  page: number = 1,
  limit: number = 10
): Promise<ArticleListResponse> {
  // implementação
}
```

---

## 📝 Convenções de Commit

Usamos **Conventional Commits** para mensagens padronizadas:

### Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova funcionalidade | `feat(auth): adicionar login com Google` |
| `fix` | Correção de bug | `fix(article): corrigir slug duplicado` |
| `docs` | Documentação | `docs(api): atualizar endpoint de auth` |
| `style` | Formatação (sem mudança de código) | `style: formatar com prettier` |
| `refactor` | Refatoração | `refactor(hooks): simplificar useAuth` |
| `test` | Testes | `test(auth): adicionar testes de login` |
| `chore` | Tarefas de build/CI | `chore: atualizar dependências` |
| `perf` | Melhoria de performance | `perf(images): lazy loading` |

### Escopos Comuns

- `auth` - Autenticação
- `article` - Artigos
- `api` - API/Backend
- `ui` - Interface
- `analytics` - Analytics
- `deps` - Dependências

### Exemplos

```bash
# Nova funcionalidade
git commit -m "feat(comments): adicionar sistema de comentários"

# Correção com referência a issue
git commit -m "fix(auth): corrigir redirect após login

O usuário não era redirecionado corretamente após login bem-sucedido.

Closes #123"

# Breaking change
git commit -m "feat(api)!: alterar schema de resposta de artigos

BREAKING CHANGE: O campo 'author' agora é um objeto ao invés de string"

# Múltiplos escopos
git commit -m "feat(auth,api): implementar refresh token"
```

### Dicas

- Use modo imperativo: "adicionar" não "adicionado"
- Não capitalize a primeira letra
- Sem ponto final na descrição
- Máximo 72 caracteres na primeira linha

---

## 🔄 Processo de Pull Request

### 1. Antes de Criar

```bash
# 1. Certifique-se de estar na main atualizada
git checkout main
git pull upstream main

# 2. Crie uma branch descritiva
# Para features: git checkout -b feature/nome-da-feature
# Para fixes: git checkout -b fix/descricao-do-bug
git checkout -b feature/sistema-notificacoes

# 3. Faça seus commits seguindo as convenções
git add .
git commit -m "feat(notifications): implementar serviço de notificações"

# 4. Push para seu fork
git push origin feature/sistema-notificacoes
```

### 2. Criando o PR

1. Acesse seu repositório no GitHub
2. Clique em "Compare & pull request"
3. Preencha o template (veja seção Templates)
4. Selecione revisores (@maintainers)
5. Vincule issues relacionadas (Closes #123)

### 3. Durante Revisão

```bash
# Se precisar fazer alterações
git checkout feature/sistema-notificacoes
# Faça as mudanças
git add .
git commit -m "refactor: aplicar sugestões de revisão"
git push origin feature/sistema-notificacoes
```

**Não faça rebase após abrir o PR** (a menos que solicitado).

### 4. Após Merge

```bash
# Atualize sua main local
git checkout main
git pull upstream main

# Delete a branch local
git branch -d feature/sistema-notificacoes

# Delete a branch remota
git push origin --delete feature/sistema-notificacoes
```

---

## ✅ Critérios de Aceitação

### Para Bug Fixes

- [ ] Bug reproduzível com teste
- [ ] Correção resolve o problema
- [ ] Não introduz regressões
- [ ] Testes atualizados/criados
- [ ] Documentação atualizada (se necessário)

### Para Features

- [ ] Implementação segue requisitos
- [ ] Código segue padrões do projeto
- [ ] Testes unitários > 80% cobertura
- [ ] Testes E2E para fluxos principais
- [ ] Documentação atualizada
- [ ] Sem warnings do TypeScript/ESLint
- [ ] Funciona em mobile e desktop

### Checklist Final

- [ ] `npm run build` passa sem erros
- [ ] `npm run test` todos passam
- [ ] `npm run lint` sem warnings
- [ ] CHANGELOG.md atualizado
- [ ] Commits seguem convenção
- [ ] Branch atualizada com main
- [ ] PR preenchido com template

---

## 📝 Templates

### Template de Issue (Bug)

```markdown
## Descrição do Bug
Descrição clara do problema

## Reprodução
Passos para reproduzir:
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

## Comportamento Esperado
O que deveria acontecer

## Screenshots
Se aplicável, adicione screenshots

## Ambiente
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Versão: [e.g. 1.2.0]

## Logs
```
Erros do console
```
```

### Template de Issue (Feature)

```markdown
## Descrição
Descrição da funcionalidade proposta

## Motivação
Por que isso é necessário?

## Solução Proposta
Como deveria funcionar?

## Alternativas Consideradas
Outras abordagens possíveis

## Mockups
Se aplicável, adicione designs
```

### Template de Pull Request

```markdown
## Descrição
Breve descrição do que foi implementado

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Checkout da branch
2. `npm install`
3. `npm run dev`
4. Acesse http://localhost:5173

## Screenshots
Se aplicável

## Checklist
- [ ] Testes passam
- [ ] Lint passa
- [ ] Build passa
- [ ] Documentação atualizada

## Issues Relacionadas
Closes #123
```

---

## 🆘 Precisa de Ajuda?

- **Discord:** [Link do servidor]
- **GitHub Discussions:** Use para perguntas
- **Email:** dev@portaleconomicomundial.com

---

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

**Obrigado por contribuir! 🎉**

# Checklist de QA - Portal Econômico Mundial

## Testes Manuais Obrigatórios

### 🏠 Página Inicial (/)

- [ ] Carregamento em < 3s
- [ ] Ticker de mercado funciona (scroll infinito)
- [ ] Breaking news aparece corretamente
- [ ] Artigos em destaque exibem imagens
- [ ] Lista de últimas notícias carrega
- [ ] Sidebar com módulos geo/econômicos
- [ ] Módulos: TensionMap, EconomicAgenda, RiskThermometer

### 📰 Página de Artigo (/noticias/[slug])

- [ ] Breadcrumb funciona
- [ ] Imagem de capa carrega
- [ ] Módulos de contexto aparecem:
  - [ ] Contexto
  - [ ] Impacto
  - [ ] Linha do Tempo
  - [ ] Termos-chave
  - [ ] Fontes
- [ ] Tags exibidas corretamente
- [ ] Artigos relacionados aparecem
- [ ] **Comentários:**
  - [ ] Não logado: ver call-to-action "Faça login"
  - [ ] Logado: formulário de comentário visível
  - [ ] Validação de caracteres (min 10, max 1000)
  - [ ] Cooldown de 30s entre comentários
  - [ ] Exclusão de próprio comentário
  - [ ] Lista ordenada por data (mais recente primeiro)

### 📂 Página de Categoria (/categoria/[slug])

- [ ] Header da categoria com cor correta
- [ ] Lista de artigos filtrados
- [ ] Contador de artigos
- [ ] Mensagem quando vazio

### 🔐 Autenticação

#### Login (/login)
- [ ] Formulário de login carrega
- [ ] Validação de email/senha
- [ ] Credenciais demo funcionam:
  - usuario@exemplo.com / senha123
  - admin@pem.com / admin123
- [ ] Redirecionamento após login

#### Cadastro (/cadastro)
- [ ] Formulário de cadastro carrega
- [ ] Validação de campos:
  - [ ] Nome (min 3 caracteres)
  - [ ] Email (formato válido, único)
  - [ ] Senha (min 8, maiúscula, minúscula, número)
  - [ ] Confirmação de senha (deve coincidir)
  - [ ] Aceite de termos (obrigatório)
- [ ] Aviso de ambiente demo visível
- [ ] Login automático após cadastro
- [ ] Redirecionamento para /app

#### Área do Usuário (/app)
- [ ] Dashboard carrega
- [ ] Estatísticas exibidas
- [ ] Links de navegação funcionam
- [ ] Logout funciona

### 📄 Páginas Legais

- [ ] Privacidade (/privacidade)
  - [ ] Breadcrumb correto
  - [ ] Alerta de ambiente demo
  - [ ] Seções completas
  - [ ] JSON-LD no head
- [ ] Termos (/termos)
  - [ ] Conteúdo variabilizado
  - [ ] Alertas informativos
- [ ] Cookies (/cookies)
  - [ ] Explicação de LocalStorage
  - [ ] Tipos de cookies listados

### 📱 Mobile Testing

#### Responsividade
- [ ] Layout adapta a 320px, 375px, 414px
- [ ] Menu hamburger funciona
- [ ] Submenus expandem/colapsam
- [ ] Touch targets ≥ 44px
- [ ] Scroll suave

#### Performance Mobile
- [ ] First Contentful Paint < 1.5s
- [ ] No layout shift
- [ ] Imagens otimizadas

#### Interações Touch
- [ ] Botões respondem ao toque
- [ ] Menu fecha ao tocar fora
- [ ] Swipe funciona onde aplicável

### ♿ Acessibilidade

- [ ] Skip link funciona
- [ ] Navegação por teclado completa
- [ ] ARIA labels presentes
- [ ] Contraste de cores adequado
- [ ] Focus states visíveis
- [ ] Semântica HTML correta

### 🔍 SEO

- [ ] Title único por página
- [ ] Meta description presente
- [ ] Open Graph tags
- [ ] JSON-LD estruturado
- [ ] Canonical URLs
- [ ] H1 único por página

### 🚫 Validação de Código

#### Sem Divs
```bash
grep -r "<div" src/components/ || echo "✅ Nenhum div encontrado"
grep -r "<div" src/app/ || echo "✅ Nenhum div encontrado"
```

#### TypeScript
```bash
npm run build 2>&1 | grep -i "error" || echo "✅ Build sem erros"
```

#### ESLint
```bash
npm run lint 2>&1 | grep -i "error" || echo "✅ Lint passou"
```

### 🎨 Design System

- [ ] Cores seguem paleta definida
- [ ] Tipografia consistente
- [ ] Espaçamento de 8px
- [ ] Animações suaves (150-300ms)
- [ ] Hover states definidos

### 🧪 Testes de Funcionalidade

#### Comentários
```
1. Acessar artigo sem login
2. Verificar call-to-action de login
3. Fazer login
4. Tentar comentar com < 10 caracteres
5. Verificar erro de validação
6. Comentar texto válido
7. Verificar aparição na lista
8. Tentar comentar imediatamente (deve bloquear)
9. Aguardar 30s
10. Comentar novamente
11. Excluir comentário
```

#### Cadastro
```
1. Acessar /cadastro
2. Tentar submit vazio (validação)
3. Preencher com email existente (erro)
4. Preencher senhas diferentes (erro)
5. Preencher corretamente
6. Verificar redirecionamento
7. Verificar login automático
```

#### Navegação
```
1. Testar menu desktop (hover/dropdown)
2. Testar menu mobile (hamburger)
3. Verificar highlight de página ativa
4. Testar subcategorias
5. Verificar breadcrumbs
```

### 📊 Testes de Performance

```bash
# Lighthouse (Chrome DevTools)
- Performance > 90
- Accessibility > 95
- Best Practices > 90
- SEO > 95

# PageSpeed Insights
- Mobile score > 85
- Desktop score > 90
```

### 🌐 Testes de Compatibilidade

- [ ] Chrome (última versão)
- [ ] Firefox (última versão)
- [ ] Safari (última versão)
- [ ] Edge (última versão)
- [ ] Chrome Mobile
- [ ] Safari iOS

### ✅ Checklist Final

- [ ] Todos os testes manuais passaram
- [ ] Build sem erros
- [ ] Nenhum console.error
- [ ] Imagens carregam corretamente
- [ ] Links funcionam
- [ ] Formulários validam corretamente
- [ ] Dados persistem no LocalStorage
- [ ] Site responsivo em todos os breakpoints

---

## Comandos Úteis

```bash
# Build
npm run build

# Verificar divs
grep -rn "<div" src/

# Verificar semântica
grep -rn "<section\|<article\|<aside\|<header\|<footer\|<nav\|<main" src/ | wc -l

# Contar arquivos
find src -name "*.tsx" -o -name "*.ts" | wc -l
```

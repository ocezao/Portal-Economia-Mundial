# Documentação de CI/CD - Cenario Internacional

## Visão Geral

Este documento descreve o pipeline completo de Integração Contínua (CI) e Deploy Contínuo (CD) do Cenario Internacional, incluindo configuração de workflows, ambientes e procedimentos operacionais.

---

## 1. Arquitetura do Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE CI/CD                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │   Push   │──▶│   CI Build   │──▶│   CI Test    │──▶│   CI Deploy  │     │
│  │  Branch  │   │  + Lint      │   │  + Coverage  │   │  Artifact    │     │
│  └──────────┘   └──────────────┘   └──────────────┘   └──────────────┘     │
│                                                              │               │
│                                                              ▼               │
│                                                    ┌──────────────────┐     │
│                                                    │   Staging Env    │     │
│                                                    │  (Auto Deploy)   │     │
│                                                    └────────┬─────────┘     │
│                                                             │               │
│                                                             ▼               │
│                                                    ┌──────────────────┐     │
│                                                    │  Manual Approval │     │
│                                                    └────────┬─────────┘     │
│                                                             │               │
│                                                             ▼               │
│                                                    ┌──────────────────┐     │
│                                                    │  Production Env  │     │
│                                                    │  (Manual Deploy) │     │
│                                                    └──────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Workflows GitHub Actions

### 2.1 Estrutura de Arquivos

```
.github/
├── workflows/
│   ├── ci.yml              # CI principal (build, test, lint)
│   ├── cd-staging.yml      # Deploy automático staging
│   ├── cd-production.yml   # Deploy manual produção
│   ├── pr-checks.yml       # Verificações em PRs
│   ├── nightly.yml         # Testes noturnos
│   └── security.yml        # Scans de segurança
├── actions/
│   ├── setup-node/         # Action reutilizável
│   └── deploy-hostinger/   # Action de deploy
└── scripts/
    └── version-bump.js     # Script de versionamento
```

### 2.2 Workflow CI Principal

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Job 1: Lint e Formatação
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npx prettier --check "src/**/*.{ts,tsx}"

  # Job 2: Testes Unitários
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # Job 3: Testes E2E
  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint
    timeout-minutes: 30
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  # Job 4: Build
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test-unit, test-e2e]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 5

  # Job 5: Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true

      - name: CodeQL Analysis
        uses: github/codeql-action/init@v3
        with:
          languages: javascript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

### 2.3 Workflow Deploy Staging

```yaml
# .github/workflows/cd-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

env:
  STAGING_URL: https://staging.portaleconomicomundial.com

jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: ${{ env.STAGING_URL }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for staging
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_SITE_URL: ${{ env.STAGING_URL }}

      - name: Deploy to Hostinger (Staging)
        uses: SamKirkland/FTP-Deploy-Action@4.3.5
        with:
          server: ${{ secrets.STAGING_FTP_SERVER }}
          username: ${{ secrets.STAGING_FTP_USERNAME }}
          password: ${{ secrets.STAGING_FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./public_html/
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**

      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deploys'
          text: '✅ Deploy para Staging concluído!'
          fields: repo,message,commit,author
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()

      - name: Run smoke tests
        run: |
          curl -f ${{ env.STAGING_URL }}/health || exit 1
          curl -f ${{ env.STAGING_URL }} || exit 1
```

### 2.4 Workflow Deploy Produção

```yaml
# .github/workflows/cd-production.yml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Versão para deploy (ex: v1.2.0)'
        required: true
        type: string
      confirm:
        description: 'Confirma deploy para produção?'
        required: true
        type: boolean

env:
  PRODUCTION_URL: https://portaleconomicomundial.com

jobs:
  # Job 1: Pre-deploy checks
  pre-deploy:
    name: Pre-deploy Checks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - name: Verify version tag
        run: |
          if ! git describe --exact-match --tags HEAD; then
            echo "❌ O commit não possui uma tag de versão"
            exit 1
          fi

      - name: Check if version is documented
        run: |
          if ! grep -q "${{ github.event.inputs.version }}" CHANGELOG.md; then
            echo "❌ Versão não encontrada no CHANGELOG.md"
            exit 1
          fi

      - name: Run tests on tag
        run: |
          npm ci
          npm run test
          npm run build

  # Job 2: Deploy
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: pre-deploy
    environment:
      name: production
      url: ${{ env.PRODUCTION_URL }}
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for production
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_SITE_URL: ${{ env.PRODUCTION_URL }}
          NEXT_PUBLIC_GTM_ID: ${{ secrets.PROD_GTM_ID }}

      - name: Create .htaccess
        run: |
          cat > dist/.htaccess << 'EOF'
          # Compressão
          <IfModule mod_deflate.c>
            AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
          </IfModule>
          
          # Cache
          <IfModule mod_expires.c>
            ExpiresActive On
            ExpiresByType image/webp "access plus 1 year"
            ExpiresByType text/css "access plus 1 month"
            ExpiresByType application/javascript "access plus 1 month"
          </IfModule>
          
          # SPA routing
          <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteBase /
            RewriteRule ^index\.html$ - [L]
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule . /index.html [L]
          </IfModule>
          EOF

      - name: Deploy to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@4.3.5
        with:
          server: ${{ secrets.PROD_FTP_SERVER }}
          username: ${{ secrets.PROD_FTP_USERNAME }}
          password: ${{ secrets.PROD_FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./public_html/
          exclude: |
            **/.git*
            **/.git*/**
            **/node_modules/**

      - name: Create deployment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              environment: 'production',
              auto_merge: false,
              required_contexts: []
            })

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deploys'
          text: '🚀 Deploy para Produção concluído! Versão: ${{ github.event.inputs.version }}'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        if: always()

  # Job 3: Post-deploy verification
  verify-production:
    name: Verify Production
    runs-on: ubuntu-latest
    needs: deploy-production
    steps:
      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          curl -f ${{ env.PRODUCTION_URL }}/health || exit 1
          curl -f ${{ env.PRODUCTION_URL }} || exit 1

      - name: Run smoke tests
        run: |
          # Verificar se assets principais estão disponíveis
          curl -f ${{ env.PRODUCTION_URL }}/assets/ || exit 1
          
          # Verificar headers de segurança
          curl -I ${{ env.PRODUCTION_URL }} | grep -i "strict-transport-security"

      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --config=lighthouserc.json
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### 2.5 Workflow PR Checks

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate-pr:
    name: Validate PR
    runs-on: ubuntu-latest
    steps:
      - name: Check PR title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            test
            chore
            perf
          requireScope: false

      - name: Check PR size
        uses: codelytv/pr-size-checker@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          max_size: 500
          exclude_files: |
            package-lock.json
            *.snap
            *.svg

      - name: Check linked issues
        uses: nearform-actions/github-action-check-linked-issues@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          exclude-branches: "dependabot/**"
```

---

## 3. Ambientes

### 3.1 Configuração de Ambientes

| Ambiente | URL | Deploy | Branch | Propósito |
|----------|-----|--------|--------|-----------|
| Development | localhost:5173 | Local | feature/* | Desenvolvimento local |
| Staging | staging.portaleconomicomundial.com | Auto | develop | Testes e QA |
| Production | portaleconomicomundial.com | Manual | main | Ambiente real |

### 3.2 Variáveis por Ambiente

```yaml
# Development (local .env)
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:5173

# Staging (GitHub Secrets)
STAGING_SUPABASE_URL=https://staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=staging-anon-key
STAGING_FTP_SERVER=ftp.staging.server
STAGING_FTP_USERNAME=staging-user
STAGING_FTP_PASSWORD=staging-pass

# Production (GitHub Secrets - Environment)
PROD_SUPABASE_URL=https://prod-project.supabase.co
PROD_SUPABASE_ANON_KEY=prod-anon-key
PROD_FTP_SERVER=ftp.portaleconomicomundial.com
PROD_FTP_USERNAME=prod-user
PROD_FTP_PASSWORD=prod-pass
PROD_GTM_ID=GTM-XXXXXX
```

---

## 4. Secrets e Variáveis

### 4.1 Configuração no GitHub

**Organization Secrets:** (aplicáveis a todos os repos)
- `SLACK_WEBHOOK_URL`
- `CODECOV_TOKEN`

**Repository Secrets:**
- `STAGING_*` - Credenciais staging
- `PROD_*` - Credenciais produção (protegidas)

**Environment Secrets:** (Production)
- `PROD_SUPABASE_URL`
- `PROD_SUPABASE_ANON_KEY`
- `PROD_FTP_PASSWORD`

### 4.2 Segurança de Secrets

```bash
# NUNCA commite secrets
# Use sempre GitHub Secrets ou variáveis de ambiente

# ❌ NUNCA faça isso:
const API_KEY = "sk-1234567890"

# ✅ Faça isso:
const API_KEY = process.env.NEXT_PUBLIC_API_KEY
```

### 4.3 Rotação de Secrets

| Secret | Frequência de Rotação | Responsável |
|--------|----------------------|-------------|
| API Keys | A cada 90 dias | DevOps |
| FTP Passwords | A cada 180 dias | DevOps |
| JWT Secrets | A cada 365 dias | Security |

---

## 5. Estratégia de Versionamento

### 5.1 Versionamento Semântico

```
Formato: MAJOR.MINOR.PATCH
Exemplo: 1.2.3

MAJOR - Breaking changes
MINOR - Novas features (backward compatible)
PATCH - Bug fixes
```

### 5.2 Processo de Release

```bash
# 1. Atualizar versão no package.json
npm version minor  # ou major, patch

# 2. Criar entry no CHANGELOG.md
## [1.2.0] - 2024-02-04
### Added
- Nova feature X
### Fixed
- Bug Y corrigido

# 3. Commit
git add .
git commit -m "chore(release): bump version to 1.2.0"

# 4. Criar tag
git tag -a v1.2.0 -m "Release v1.2.0"

# 5. Push
git push origin main --tags
```

### 5.3 GitHub Release

```yaml
# .github/workflows/release.yml
name: Create Release

on:
  push:
    tags:
      - 'v*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false
```

---

## 6. Rollback Procedures

### 6.1 Rollback Rápido (Produção)

```bash
# 1. Identificar versão anterior
LAST_GOOD_VERSION="v1.1.9"

# 2. Reverter para tag anterior no GitHub
# Actions > cd-production > Run workflow
# Selecionar versão: v1.1.9

# 3. Ou manualmente via FTP
# Baixar artifact da versão anterior
# Fazer upload manual para Hostinger
```

### 6.2 Workflow de Rollback

```yaml
# .github/workflows/rollback.yml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Versão para rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout target version
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}

      - name: Build
        run: |
          npm ci
          npm run build

      - name: Deploy previous version
        uses: SamKirkland/FTP-Deploy-Action@4.3.5
        with:
          server: ${{ secrets.PROD_FTP_SERVER }}
          username: ${{ secrets.PROD_FTP_USERNAME }}
          password: ${{ secrets.PROD_FTP_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./public_html/

      - name: Notify
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '🚨 ROLLBACK executado para ${{ github.event.inputs.version }}'
```

### 6.3 Checklist de Rollback

- [ ] Identificar causa raiz do problema
- [ ] Notificar stakeholders (Slack/Email)
- [ ] Executar rollback
- [ ] Verificar se sistema está estável
- [ ] Criar incidente no sistema de tickets
- [ ] Planejar correção definitiva

---

## 7. Monitoramento do Pipeline

### 7.1 Métricas Principais

| Métrica | Target | Alerta |
|---------|--------|--------|
| Build Time | < 5 min | > 8 min |
| Test Time | < 10 min | > 15 min |
| Deploy Time | < 3 min | > 5 min |
| Success Rate | > 95% | < 90% |
| Failed Deploys | < 2/mês | > 3/mês |

### 7.2 Dashboard de CI/CD

```yaml
# .github/workflows/metrics.yml
name: CI/CD Metrics

on:
  schedule:
    - cron: '0 0 * * 0'  # Semanal

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Collect workflow stats
        uses: actions/github-script@v7
        with:
          script: |
            const runs = await github.rest.actions.listWorkflowRuns({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'ci.yml',
              per_page: 100
            });
            
            const success = runs.data.workflow_runs.filter(r => r.conclusion === 'success').length;
            const total = runs.data.workflow_runs.length;
            const rate = (success / total * 100).toFixed(2);
            
            console.log(`Taxa de sucesso CI: ${rate}%`);
```

### 7.3 Alertas

```yaml
# Alerta de falha no deploy
- name: Alert on failure
  uses: 8398a7/action-slack@v3
  if: failure()
  with:
    status: failure
    text: '@here 🚨 Deploy falhou!'
```

---

## 8. Testes em CI/CD

### 8.1 Pipeline de Testes

```yaml
# Test stages
1. Unit Tests (paralelo)
   └─> Coverage report

2. Integration Tests (paralelo)
   └─> API tests
   └─> Database tests

3. E2E Tests (depende de build)
   ├─> Desktop Chrome
   ├─> Desktop Firefox
   ├─> Mobile Chrome
   └─> Mobile Safari

4. Visual Regression
   └─> Screenshots comparison

5. Performance
   └─> Lighthouse CI
   └─> Bundle size check
```

### 8.2 Lighthouse CI

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:4173/",
        "http://localhost:4173/noticias/guerra-comercial-2024"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "interactive": ["error", { "maxNumericValue": 3000 }]
      }
    }
  }
}
```

---

## 9. Cache e Otimização

### 9.1 Cache de Dependências

```yaml
- name: Cache node_modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 9.2 Cache de Build

```yaml
- name: Cache Vite build
  uses: actions/cache@v3
  with:
    path: |
      node_modules/.vite
      dist
    key: ${{ runner.os }}-vite-${{ hashFiles('**/package-lock.json') }}-${{ github.sha }}
```

---

## 10. Checklist de Qualidade CI/CD

### Configuração Inicial

- [ ] Workflows criados no `.github/workflows/`
- [ ] Secrets configurados no GitHub
- [ ] Ambientes (staging/production) criados
- [ ] Branch protection rules ativadas
- [ ] Codecov integrado
- [ ] Slack notifications configuradas

### Antes de Merge

- [ ] CI passa em todas as verificações
- [ ] Code review aprovado
- [ ] Testes E2E passam
- [ ] Lighthouse score > 90
- [ ] Sem vulnerabilidades críticas

### Deploy

- [ ] Staging deployado com sucesso
- [ ] Smoke tests passam em staging
- [ ] Aprovação manual para produção
- [ ] Deploy produção concluído
- [ ] Health check passa em produção
- [ ] Rollback plan documentado

---

## 11. Troubleshooting

### Problema: Build falha no CI mas passa local

**Causas comuns:**
1. Variáveis de ambiente diferentes
2. Cache de dependências corrompido
3. Diferença de versão Node.js

**Solução:**
```yaml
- name: Clear cache
  run: |
    rm -rf node_modules
    rm package-lock.json
    npm install
```

### Problema: Deploy FTP lento/falha

**Solução:**
```yaml
- name: Deploy with retry
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: |
      # comando de deploy
```

### Problema: Secrets não disponíveis

**Verificar:**
1. Secrets estão no repositório correto?
2. Workflow tem permissão para acessar secrets?
3. Environment está configurado corretamente?

---

**Versão:** 1.0.0  
**Última atualização:** 2024-02-04  
**Owner:** DevOps Team

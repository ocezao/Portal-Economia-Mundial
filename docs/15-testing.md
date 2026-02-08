# Documentação de Testes Automatizados - PEM

## Visão Geral

Este documento define a estratégia completa de testes automatizados do Portal Econômico Mundial, garantindo qualidade de código, prevenção de regressões e confiabilidade do sistema.

---

## 1. Estrutura de Testes

```
├── src/
│   └── **/*.test.ts          # Testes unitários junto ao código
├── tests/
│   ├── unit/                  # Testes unitários organizados
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/           # Testes de integração
│   │   ├── api/
│   │   ├── database/
│   │   └── auth/
│   └── e2e/                   # Testes end-to-end
│       ├── specs/
│       ├── fixtures/
│       └── support/
├── collector/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── load/
└── sdk/
    └── tests/
        ├── unit/
        └── integration/
```

---

## 2. Stack de Testes

| Tipo | Ferramenta | Versão | Propósito |
|------|-----------|--------|-----------|
| Unitário | Vitest | ^1.0 | Testes rápidos de componentes/hooks |
| E2E | Playwright | ^1.40 | Testes de fluxo completo |
| API | Supertest | ^6.3 | Testes de endpoints HTTP |
| Mock | MSW | ^2.0 | Mock de API/service worker (opcional - não instalado por padrão) |
| Coverage | v8/istanbul | - | Relatório de cobertura |
| Load | k6 | - | Testes de carga do collector |

---

## 3. Configuração do Ambiente

### 3.1 Instalação de Dependências

```bash
# Instalar todas as dependências de teste
npm install -D vitest @vitest/coverage-v8 playwright @playwright/test supertest @types/supertest msw

# Instalar browsers do Playwright
npx playwright install

# Verificar instalação
npx vitest --version
npx playwright --version
```

### 3.2 Configuração Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock*/'
      ]
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
```

### 3.3 Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'junit-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

### 3.4 Arquivo de Setup

```typescript
// tests/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Estender matchers do Vitest
expect.extend(matchers);

// Limpar após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock do matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
}));

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});
```

---

## 4. Comandos de Execução

### 4.1 Testes Unitários

```bash
# Executar todos os testes unitários
npm run test

# Executar em modo watch (desenvolvimento)
npm run test:watch

# Executar com UI interativa
npm run test:ui

# Executar com cobertura
npm run test:coverage

# Executar testes específicos
npm run test -- src/components/news

# Executar por padrão de nome
npm run test -- -t "should render"
```

### 4.2 Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com UI do Playwright
npm run test:e2e:ui

# Executar em modo debug
npm run test:e2e:debug

# Executar em browser específico
npx playwright test --project=chromium

# Executar teste específico
npx playwright test tests/e2e/auth.spec.ts

# Gerar relatório HTML
npx playwright show-report
```

### 4.3 Testes do Collector

```bash
# Testes unitários do collector
cd collector && npm test

# Testes de integração (requer PostgreSQL)
cd collector && npm run test:integration

# Testes de carga
cd collector && npm run test:load

# Todos os testes com coverage
cd collector && npm run test:coverage
```

---

## 5. Exemplos de Testes

### 5.1 Teste de Componente React

```typescript
// src/components/news/NewsCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsCard } from './NewsCard';
import { BrowserRouter } from 'react-router-dom';
import type { NewsArticle } from '@/types';

const mockArticle: NewsArticle = {
  id: '1',
  slug: 'test-article',
  title: 'Test Article Title',
  excerpt: 'This is a test excerpt',
  category: 'economia',
  author: { name: 'John Doe', slug: 'john-doe' },
  publishedAt: '2024-01-15',
  imageUrl: '/test.jpg',
  readTime: 5
};

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>{component}</BrowserRouter>
  );
};

describe('NewsCard', () => {
  it('deve renderizar o título do artigo', () => {
    renderWithRouter(<NewsCard article={mockArticle} />);
    
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('deve renderizar o excerpt', () => {
    renderWithRouter(<NewsCard article={mockArticle} />);
    
    expect(screen.getByText('This is a test excerpt')).toBeInTheDocument();
  });

  it('deve ter link correto para o artigo', () => {
    renderWithRouter(<NewsCard article={mockArticle} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/noticias/test-article');
  });

  it('deve exibir a categoria corretamente', () => {
    renderWithRouter(<NewsCard article={mockArticle} />);
    
    expect(screen.getByText('economia')).toBeInTheDocument();
  });

  it('deve exibir tempo de leitura', () => {
    renderWithRouter(<NewsCard article={mockArticle} />);
    
    expect(screen.getByText('5 min de leitura')).toBeInTheDocument();
  });

  it('deve ter imagem com alt text adequado', () => {
    renderWithRouter(<NewsCard article={mockArticle} />);
    
    const image = screen.getByAltText('Test Article Title');
    expect(image).toBeInTheDocument();
  });
});
```

### 5.2 Teste de Hook Customizado

```typescript
// src/hooks/useAuth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabaseClient';

// Mock do Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn()
    }
  }
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve fazer login com sucesso', async () => {
    const mockUser = { id: '123', email: 'test@test.com' };
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: {} },
      error: null
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@test.com', 'password123');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('deve retornar erro quando credenciais são inválidas', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('wrong@test.com', 'wrongpass');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('deve fazer logout corretamente', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### 5.3 Teste de Serviço/Utilitário

```typescript
// src/services/newsService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getArticleBySlug, getArticlesByCategory } from './newsService';

// Mock dos dados
vi.mock('@/data/articles', () => ({
  articles: [
    {
      id: '1',
      slug: 'article-1',
      title: 'Article One',
      category: 'economia'
    },
    {
      id: '2', 
      slug: 'article-2',
      title: 'Article Two',
      category: 'geopolitica'
    }
  ]
}));

describe('newsService', () => {
  describe('getArticleBySlug', () => {
    it('deve retornar artigo quando slug existe', () => {
      const article = getArticleBySlug('article-1');
      
      expect(article).toBeDefined();
      expect(article?.title).toBe('Article One');
    });

    it('deve retornar undefined quando slug não existe', () => {
      const article = getArticleBySlug('non-existent');
      
      expect(article).toBeUndefined();
    });
  });

  describe('getArticlesByCategory', () => {
    it('deve filtrar artigos por categoria', () => {
      const articles = getArticlesByCategory('economia');
      
      expect(articles).toHaveLength(1);
      expect(articles[0].category).toBe('economia');
    });

    it('deve retornar array vazio quando categoria não existe', () => {
      const articles = getArticlesByCategory('invalid-category');
      
      expect(articles).toEqual([]);
    });
  });
});
```

### 5.4 Teste E2E com Playwright

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('deve exibir página de login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
  });

  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.getByLabel(/email/i).fill('usuario@exemplo.com');
    await page.getByLabel(/senha/i).fill('senha123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Verificar redirecionamento
    await expect(page).toHaveURL('/app');
    
    // Verificar usuário logado
    await expect(page.getByText(/bem-vindo/i)).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/senha/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.getByRole('button', { name: /entrar/i }).click();

    // HTML5 validation
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('required');
  });
});

test.describe('Fluxo de Leitura', () => {
  test('usuário deve conseguir ler artigo completo após login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('usuario@exemplo.com');
    await page.getByLabel(/senha/i).fill('senha123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Navegar para artigo
    await page.goto('/noticias/guerra-comercial-2024');

    // Verificar conteúdo completo visível
    await expect(page.getByRole('article')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Verificar que não há paywall para usuário logado
    await expect(page.getByText(/limite de leitura/i)).not.toBeVisible();
  });

  test('usuário anônimo deve ver limite de leitura', async ({ page }) => {
    await page.goto('/noticias/guerra-comercial-2024');

    // Scroll para ativar limite
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3));

    // Verificar overlay de limite
    await expect(page.getByText(/limite de leitura/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /desbloquear/i })).toBeVisible();
  });
});
```

### 5.5 Teste de API (Collector)

```typescript
// collector/tests/integration/collect.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../src/server';
import { pool } from '../../src/db';

const app = buildApp();

describe('POST /collect', () => {
  beforeAll(async () => {
    // Limpar tabela de teste
    await pool.query('TRUNCATE TABLE events_raw');
  });

  afterAll(async () => {
    await pool.end();
  });

  it('deve aceitar evento válido', async () => {
    const event = {
      v: '1.0.0',
      event: 'page_view',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      anonymous: false,
      timestamp: Date.now(),
      url: 'https://test.com/article',
      properties: { page_type: 'article' }
    };

    const response = await request(app)
      .post('/collect')
      .send(event)
      .expect(204);

    expect(response.body).toEqual({});
  });

  it('deve rejeitar evento sem campos obrigatórios', async () => {
    const invalidEvent = {
      v: '1.0.0',
      event: 'page_view'
      // faltando timestamp e url
    };

    const response = await request(app)
      .post('/collect')
      .send(invalidEvent)
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('deve deduplicar eventos idênticos', async () => {
    const timestamp = 1710000000000;
    const event = {
      v: '1.0.0',
      event: 'page_view',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      anonymous: false,
      timestamp,
      url: 'https://test.com/article',
      properties: {}
    };

    // Primeiro envio
    await request(app).post('/collect').send(event).expect(204);

    // Segundo envio (duplicado)
    await request(app).post('/collect').send(event).expect(204);

    // Verificar que só existe 1 registro
    const result = await pool.query(
      'SELECT COUNT(*) FROM events_raw WHERE event_timestamp = to_timestamp($1 / 1000)',
      [timestamp]
    );

    expect(parseInt(result.rows[0].count)).toBe(1);
  });

  it('deve rejeitar evento anônimo com user_id', async () => {
    const event = {
      v: '1.0.0',
      event: 'page_view',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: null,
      anonymous: true,
      timestamp: Date.now(),
      url: 'https://test.com/article',
      properties: {}
    };

    const response = await request(app)
      .post('/collect')
      .send(event)
      .expect(400);

    expect(response.body.error).toContain('anonymous');
  });
});

describe('GET /health', () => {
  it('deve retornar status ok', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected'
    });
  });
});
```

### 5.6 Teste de Carga (k6)

```javascript
// collector/tests/load/collect-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp up
    { duration: '5m', target: 100 },    // Steady state
    { duration: '2m', target: 200 },    // Spike
    { duration: '5m', target: 200 },    // Steady state spike
    { duration: '2m', target: 0 }       // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],    // 95% das requisições < 100ms
    http_req_failed: ['rate<0.01'],      // < 1% de erros
    errors: ['rate<0.01']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function generateEvent(userId) {
  return {
    v: '1.0.0',
    event: 'page_view',
    user_id: userId,
    session_id: `session-${Math.floor(Math.random() * 100000)}`,
    anonymous: false,
    timestamp: Date.now(),
    url: `https://test.com/article-${Math.floor(Math.random() * 100)}`,
    properties: {
      page_type: 'article',
      category: ['economia', 'geopolitica', 'tecnologia'][Math.floor(Math.random() * 3)]
    }
  };
}

export default function () {
  const userId = `user-${Math.floor(Math.random() * 10000)}`;
  const payload = JSON.stringify(generateEvent(userId));

  const response = http.post(`${BASE_URL}/collect`, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const success = check(response, {
    'status is 204': (r) => r.status === 204,
    'response time < 100ms': (r) => r.timings.duration < 100
  });

  errorRate.add(!success);
  sleep(1);
}
```

---

## 6. Cobertura de Código

### 6.1 Thresholds Mínimos

| Tipo | Linhas | Funções | Branches | Statements |
|------|--------|---------|----------|------------|
| Unitários | 80% | 80% | 75% | 80% |
| Integração | 60% | - | - | - |
| E2E | 40% | - | - | - |

### 6.2 Relatórios de Cobertura

```bash
# Gerar relatório completo
npm run test:coverage

# Relatório em formato LCOV (para integração com CI)
npm run test:coverage -- --reporter=lcov

# Relatório em formato JSON
npm run test:coverage -- --reporter=json

# Visualizar relatório HTML
open coverage/index.html
```

### 6.3 Integração com Codecov

```yaml
# .github/workflows/test.yml (excerpt)
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
    fail_ci_if_error: true
```

---

## 7. Mock de Dados

### 7.1 Mock Service Worker (MSW)

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase auth
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: {
        id: '123',
        email: 'test@test.com'
      }
    });
  }),

  // Mock API de notícias
  http.get('*/api/articles', () => {
    return HttpResponse.json({
      articles: [
        { id: '1', title: 'Article 1' },
        { id: '2', title: 'Article 2' }
      ]
    });
  }),

  // Mock analytics collector
  http.post('*/collect', () => {
    return new HttpResponse(null, { status: 204 });
  })
];
```

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

## 8. Checklist de Qualidade

### 8.1 Antes de Commit

- [ ] Todos os testes unitários passam
- [ ] Cobertura não diminuiu
- [ ] Não há `console.log` ou `debugger`
- [ ] Código segue padrões ESLint
- [ ] Tipagem TypeScript está correta

### 8.2 Antes de Pull Request

- [ ] Testes de integração passam
- [ ] Testes E2E passam localmente
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado
- [ ] Revisão de código feita

### 8.3 Antes de Release

- [ ] Cobertura geral > 80%
- [ ] Testes de carga aprovados
- [ ] Testes cross-browser passam
- [ ] Lighthouse score > 90

---

## 9. Troubleshooting

### Problema: Testes falham intermitentemente

**Solução:**
```typescript
// Adicionar retry para testes flaky
test('teste flaky', async () => {
  // código
}, { retry: 3 });
```

### Problema: Timeout em testes assíncronos

**Solução:**
```typescript
// Aumentar timeout
vi.setConfig({ testTimeout: 10000 });

// Ou por teste
test('teste lento', async () => {
  // código
}, 10000);
```

### Problema: Memory leak nos testes

**Solução:**
```typescript
// Limpar mocks e DOM
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

---

**Data de criação:** 2024-02-04  
**Versão:** 1.0.0  
**Próxima revisão:** 2024-03-04

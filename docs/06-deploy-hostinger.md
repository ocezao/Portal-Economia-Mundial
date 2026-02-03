# Deploy no Hostinger

## Pré-requisitos

- Conta Hostinger ativa
- Domínio configurado
- Acesso ao painel de controle

## Build para Produção

### 1. Configurar vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  base: '/', // Ajuste se necessário
});
```

### 2. Executar Build

```bash
# Instalar dependências
npm install

# Build de produção
npm run build
```

### 3. Verificar Saída

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── images/
    └── ...
```

## Upload para Hostinger

### Opção 1: File Manager

1. Acesse o **hPanel** da Hostinger
2. Navegue até **Arquivos** → **Gerenciador de Arquivos**
3. Acesse a pasta `public_html`
4. **Exclua** o conteúdo anterior (se houver)
5. **Upload** dos arquivos da pasta `dist/`

### Opção 2: FTP

```bash
# Usando FileZilla ou similar
Host: ftp.seudominio.com
Usuário: seu_usuario_ftp
Senha: sua_senha_ftp
Porta: 21
```

Upload da pasta `dist/` para `public_html/`

### Opção 3: Git (se disponível)

```bash
# Configurar repositório no Hostinger
git remote add hostinger ssh://usuario@host:porta/caminho/repo.git
git push hostinger main
```

## Configurações do Servidor

### .htaccess

Criar arquivo `dist/.htaccess`:

```apache
# Habilitar compressão
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

# Cache de assets
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
```

## Configuração de Domínio

### 1. DNS

No painel do registrador de domínio:

```
Tipo: A
Nome: @
Valor: [IP do servidor Hostinger]
TTL: 3600
```

### 2. SSL (HTTPS)

1. Acesse **SSL** no hPanel
2. Clique em **Instalar SSL**
3. Selecione **Let's Encrypt**
4. Aguarde a propagação (até 24h)

## Verificação Pós-Deploy

### Checklist

- [ ] Site acessível via HTTP
- [ ] Site acessível via HTTPS
- [ ] Todas as páginas carregam
- [ ] Imagens exibem corretamente
- [ ] Links funcionam
- [ ] Formulários funcionam
- [ ] Mobile responsivo

### Ferramentas de Teste

```bash
# Verificar SSL
curl -I https://seudominio.com

# Testar performance
curl -o /dev/null -w "%{time_total}" https://seudominio.com
```

## Troubleshooting

### 404 em rotas

Verificar se `.htaccess` está configurado para SPA routing.

### Assets não carregam

Verificar `base` no `vite.config.ts`:
- Domínio raiz: `base: '/'`
- Subdiretório: `base: '/subdiretorio/'`

### Cache antigo

Limpar cache do navegador ou adicionar query string:
```html
<script src="/assets/index.js?v=2"></script>
```

## CI/CD (Opcional)

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Hostinger

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: SamKirkland/FTP-Deploy-Action@4.3.0
        with:
          server: ftp.seudominio.com
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASS }}
          local-dir: ./dist/
          server-dir: ./public_html/
```

## Contato de Suporte

- **Hostinger**: https://support.hostinger.com
- **Documentação**: https://support.hostinger.com/pt-BR

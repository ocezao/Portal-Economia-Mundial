# 🚀 Guia de Deploy Seguro

Este guia garante que a aplicação seja implantada seguindo as melhores práticas de segurança.

---

## ✅ Checklist Pré-Deploy

### 1. Segurança do Código

- [ ] **Senha hardcoded removida** do collector (`collector/src/db/index.ts`)
- [ ] **Console.logs protegidos** - usar `logger.ts` em vez de console direto
- [ ] **Chaves de API** apenas via variáveis de ambiente
- [ ] **dangerouslySetInnerHTML** revisados e sanitizados
- [ ] **Comentários sensíveis** removidos

### 2. Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
# Supabase (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"

# APIs de Mercado (opcional)
NEXT_PUBLIC_FINNHUB_API_KEY="sua-chave"
NEXT_PUBLIC_FINNHUB_ENABLED="true"
NEXT_PUBLIC_FINNHUB_FREE_PLAN="true"

# Site
NEXT_PUBLIC_SITE_URL="https://seu-dominio.com"
```

**Para o Collector** (arquivo `.env` na pasta `collector/`):

```bash
POSTGRES_HOST="db.seu-projeto.supabase.co"
POSTGRES_PORT="5432"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="senha-forte-aqui"  # NUNCA use senha padrão!
```

### 3. Build

```bash
# Limpar build anterior
rm -rf dist/

# Instalar dependências
npm ci --production

# Build de produção
npm run build
```

### 4. Verificação do Build

```bash
# Verificar se há chaves no build
grep -r "sk-" dist/ || echo "✓ Nenhuma chave encontrada"
grep -r "password" dist/ || echo "✓ Nenhuma senha encontrada"
grep -r "token" dist/ | grep -v "node_modules" || echo "✓ Tokens verificados"
```

---

## 🔧 Configurações do Servidor

### Nginx

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    # SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://*.finnhub.io wss://*.finnhub.io; frame-ancestors 'self';" always;

    root /var/www/pem/dist;
    index index.html;

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache (.htaccess)

```apache
# Headers de segurança
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"

# Cache de assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>

# SPA fallback
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

---

## 🗄️ Configurações do Supabase

### Row Level Security (RLS)

Todas as tabelas devem ter RLS habilitado:

```sql
-- Verificar tabelas sem RLS
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    INTERSECT
    SELECT tablename FROM pg_policy
);

-- Habilitar RLS em tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### Políticas de Acesso

```sql
-- Exemplo: Apenas usuários podem ver seus próprios bookmarks
CREATE POLICY "Users can only see their own bookmarks"
ON public.bookmarks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Exemplo: Apenas admins podem criar notícias
CREATE POLICY "Only admins can create articles"
ON public.news_articles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

---

## 🧪 Testes Pós-Deploy

### 1. Testes de Segurança Básicos

```bash
# Verificar headers
curl -I https://seu-dominio.com

# Verificar SSL
nmap --script ssl-enum-ciphers -p 443 seu-dominio.com

# Verificar CSP
https://csp-evaluator.withgoogle.com/

# Verificar segurança geral
https://securityheaders.com/
```

### 2. Testes de Funcionalidade

- [ ] Login funciona
- [ ] Logout funciona
- [ ] Páginas protegidas redirecionam para login
- [ ] APIs retornam dados corretos
- [ ] Analytics está coletando dados
- [ ] Não há erros no console do navegador

### 3. Testes de Vulnerabilidade

- [ ] Tentar XSS em campos de busca
- [ ] Tentar SQL Injection em parâmetros de URL
- [ ] Verificar se dados de outros usuários estão protegidos
- [x] Testar rate limiting nas APIs (middleware implementado)

---

## 📋 Comandos Úteis

### Verificar processos rodando

```bash
# Ver quem está usando a porta 5173
lsof -i :5173

# Matar processo na porta
kill -9 $(lsof -t -i:5173)
```

### Logs

```bash
# Ver logs do nginx
sudo tail -f /var/log/nginx/error.log

# Ver logs do aplicativo
pm2 logs
```

### Backup

```bash
# Backup do banco Supabase
supabase db dump -f backup.sql

# Backup dos arquivos
tar -czf backup-$(date +%Y%m%d).tar.gz dist/
```

---

## 🚨 Em Caso de Incidente

### 1. Identificação

- Verificar logs de acesso
- Identificar dados comprometidos
- Avaliar escopo do incidente

### 2. Contenção

```bash
# Desabilitar acesso ao admin
# (adicionar IP whitelist temporariamente)

# Fazer backup dos logs
cp /var/log/nginx/access.log /backup/access-$(date +%Y%m%d).log
```

### 3. Eradicação

- Revogar tokens comprometidos
- Resetar senhas afetadas
- Aplicar patches de segurança

### 4. Recuperação

- Restaurar de backup limpo
- Verificar integridade dos dados
- Monitorar atividades suspeitas

### 5. Lições Aprendidas

- Documentar o incidente
- Atualizar procedimentos
- Treinar equipe

---

## 📞 Contatos de Emergência

- **Admin do Sistema:** [email]
- **Segurança:** [email]
- **Hospedagem:** [suporte]

---

**Última atualização:** 04/02/2026

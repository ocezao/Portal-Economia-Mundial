---
name: vps-database
description: Configuração e gerenciamento de banco de dados para o Portal Econômico Mundial na VPS. Use quando precisar configurar PostgreSQL local para analytics, realizar backups, restores, ou integrar com Supabase (banco principal que permanece externo).
---

# VPS Database

Skill especializada em configurar e gerenciar bancos de dados para o Portal Econômico Mundial.

## Arquitetura de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    DADOS DO PROJETO                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │   SUPABASE       │        │   POSTGRES LOCAL (VPS)   │  │
│  │   (Externo)      │        │   (Analytics)            │  │
│  │                  │        │                          │  │
│  │  • profiles      │        │  • page_views            │  │
│  │  • news_articles │        │  • sessions              │  │
│  │  • categories    │        │  • events                │  │
│  │  • bookmarks     │        │  • user_events           │  │
│  │  • auth          │        │                          │  │
│  │                  │        │  Dados analíticos        │  │
│  │  MANTER EXTERNO  │        │  + Metabase              │  │
│  └──────────────────┘        └──────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## PostgreSQL Local (Opcional)

### Instalação

```bash
#!/bin/bash
# install-postgres.sh

set -e

echo "🐘 Instalando PostgreSQL 15..."

# Adicionar repositório
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update

# Instalar
apt install -y postgresql-15 postgresql-client-15 postgresql-contrib

# Iniciar
systemctl enable postgresql
systemctl start postgresql

echo "✅ PostgreSQL 15 instalado"
```

### Configuração

```bash
#!/bin/bash
# configure-postgres.sh

set -e

DB_NAME="pem_analytics"
DB_USER="analytics"
DB_PASS="$(openssl rand -base64 32)"

echo "⚙️ Configurando PostgreSQL..."

# Criar usuário
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

# Criar banco
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Conceder privilégios
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Configurar acesso local
 cat > /etc/postgresql/15/main/pg_hba.conf << EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOF

# Configurar para escutar apenas localhost
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" \
    /etc/postgresql/15/main/postgresql.conf

# Reiniciar
systemctl restart postgresql

# Salvar credenciais
cat > /root/.postgres_credentials << EOF
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
EOF
chmod 600 /root/.postgres_credentials

echo "✅ PostgreSQL configurado"
echo "📄 Credenciais salvas em /root/.postgres_credentials"
```

### Migrations

```bash
#!/bin/bash
# run-migrations.sh

set -e

APP_DIR="/var/www/portal-economico"

echo "📊 Executando migrations..."

# Carregar credenciais
source /root/.postgres_credentials

# Executar migrations do collector
for file in $APP_DIR/collector/src/db/migrations/*.sql; do
    echo "▶️  Executando: $(basename $file)"
    sudo -u postgres psql -d $POSTGRES_DB -f "$file"
done

echo "✅ Migrations executadas"
```

## Backup e Restore

### Backup Automático

```bash
#!/bin/bash
# backup-database.sh

set -e

DB_NAME="pem_analytics"
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

echo "💾 Realizando backup do banco $DB_NAME..."

# Backup
pg_dump -U analytics -h localhost -Fc $DB_NAME > \
    "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"

# Comprimir
gzip -f "$BACKUP_DIR/${DB_NAME}_${DATE}.dump"

# Remover backups antigos
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

# Informações do backup
FILE_SIZE=$(du -h "$BACKUP_DIR/${DB_NAME}_${DATE}.dump.gz" | cut -f1)
echo "✅ Backup concluído: ${DB_NAME}_${DATE}.dump.gz ($FILE_SIZE)"
```

### Restore

```bash
#!/bin/bash
# restore-database.sh

set -e

BACKUP_FILE="$1"
DB_NAME="pem_analytics"

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Uso: $0 <arquivo-backup>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  Isso irá sobrescrever o banco $DB_NAME"
read -p "Continuar? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelado"
    exit 0
fi

# Backup antes do restore
echo "💾 Criando backup de segurança..."
pg_dump -U analytics -h localhost -Fc $DB_NAME > \
    "/tmp/${DB_NAME}_pre_restore_$(date +%Y%m%d).dump"

# Dropar e recriar banco
echo "🗑️  Recriando banco..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER analytics;"

# Restore
echo "📥 Restaurando backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | pg_restore -U analytics -d $DB_NAME
else
    pg_restore -U analytics -d $DB_NAME "$BACKUP_FILE"
fi

echo "✅ Restore concluído!"
```

## Supabase (Banco Principal)

### Políticas de Migração

**MANTER NO SUPABASE** - Não migrar para VPS:
- Auth/autenticação
- Perfis de usuário
- Artigos de notícias
- Categorias e tags
- Bookmarks e likes
- Edge Functions

### Conexão Segura

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

### Pool de Conexões (para alta carga)

```typescript
// src/lib/supabase-server.ts
import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.SUPABASE_DB_URL,
});
```

## Metabase (Dashboard Analytics)

### Instalação via Docker

```yaml
# Adicionar ao docker-compose.prod.yml
  metabase:
    image: metabase/metabase:latest
    container_name: pem-metabase
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      MB_DB_TYPE: postgres
      MB_DB_DBNAME: pem_analytics
      MB_DB_PORT: 5432
      MB_DB_USER: analytics
      MB_DB_PASS: ${POSTGRES_PASSWORD}
      MB_DB_HOST: postgres
    volumes:
      - metabase_data:/metabase-data
    depends_on:
      - postgres
    networks:
      - pem-network
```

### Acesso

- URL: `http://seu-vps:3002`
- Configurar conexão com PostgreSQL local
- Criar dashboards de analytics

## Scripts de Manutenção

### Limpeza de Dados Antigos

```sql
-- cleanup-old-data.sql
-- Executar mensalmente

-- Limpar eventos antigos (manter 90 dias)
DELETE FROM events
WHERE created_at < NOW() - INTERVAL '90 days';

-- Limpar sessões antigas
DELETE FROM sessions
WHERE last_active < NOW() - INTERVAL '30 days';

-- VACUUM para otimizar
VACUUM ANALYZE;
```

### Monitoramento de Saúde

```bash
#!/bin/bash
# check-db-health.sh

set -e

DB_NAME="pem_analytics"

echo "🏥 Verificando saúde do banco..."

# Tamanho do banco
DB_SIZE=$(sudo -u postgres psql -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
echo "📊 Tamanho do banco: $DB_SIZE"

# Conexões ativas
CONNECTIONS=$(sudo -u postgres psql -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';")
echo "🔗 Conexões ativas: $CONNECTIONS"

# Tabelas maiores
echo "📋 Maiores tabelas:"
sudo -u postgres psql -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"

echo "✅ Check concluído"
```

## Checklist de Database

- [ ] PostgreSQL instalado e configurado
- [ ] Usuário e banco criados
- [ ] Migrations executadas
- [ ] Backup automático configurado
- [ ] Conexão com Supabase verificada
- [ ] Pool de conexões otimizado
- [ ] Metabase configurado (opcional)
- [ ] Monitoramento ativo
- [ ] Política de retenção definida

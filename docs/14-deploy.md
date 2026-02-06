# Deploy do Analytics First-Party

## Visão Geral

O deploy do sistema Analytics é feito via Docker Compose, com 4 serviços:

1. **postgres** - Banco de dados PostgreSQL 15
2. **init-partitions** - Cria partições mensais (roda uma vez)
3. **collector** - API Fastify para coleta de eventos
4. **metabase** - Dashboard para visualização

---

## Requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+ (ou `docker-compose` legacy)
- curl (para validação)
- Portas disponíveis:
  - `3000` - Collector API
  - `5432` - PostgreSQL
  - `3001` - Metabase

---

## Deploy Rápido

```bash
# 1. Subir toda a stack
docker-compose up -d

# 2. Verificar saúde do sistema
./scripts/verify.sh
```

O script `verify.sh` valida:
- PostgreSQL healthy
- Partições criadas automaticamente
- UNIQUE INDEX(event_id) nas partições
- Collector /health respondendo
- POST /collect funcionando
- Deduplicação funcionando

---

## Ordem de Inicialização

```
postgres (healthy)
    ↓
init-partitions (completed)
    ↓
collector (started)
    ↓
metabase (started)
```

O `collector` só inicia após o `init-partitions` completar com sucesso.

---

## Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste:

```bash
# PostgreSQL
POSTGRES_PASSWORD=senha_segura_aqui

# Collector (usa mesmas credenciais)
# Não precisa configurar separadamente
```

### Docker Compose

Serviços definidos em `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    # Healthcheck para garantir disponibilidade
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U analytics -d pem_analytics"]
      interval: 5s
      timeout: 5s
      retries: 5

  init-partitions:
    image: postgres:15-alpine
    # Executa partition-manager.sh e sai
    command: ./partition-manager.sh 3
    depends_on:
      postgres:
        condition: service_healthy
    restart: "no"

  collector:
    build: ./collector
    # Só inicia após init-partitions
    depends_on:
      init-partitions:
        condition: service_completed_successfully

  metabase:
    image: metabase/metabase:latest
    ports:
      - "3001:3000"
```

---

## Validação

### Script Oficial

```bash
./scripts/verify.sh
```

### Validação Manual

```bash
# 1. Verificar PostgreSQL
docker compose ps postgres

# 2. Verificar partições
docker compose exec postgres psql -U analytics -d pem_analytics -c "
    SELECT tablename FROM pg_tables 
    WHERE tablename LIKE 'events_raw_%' 
    ORDER BY tablename;
"

# 3. Verificar collector health
curl http://localhost:3000/health
# Esperado: {"status":"ok","database":"connected"}

# 4. Testar envio de evento
curl -X POST http://localhost:3000/collect \
  -H "Content-Type: application/json" \
  -d '[{
    "v": "1.0.0",
    "event": "page_view",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "anonymous": false,
    "timestamp": 1710000000000,
    "url": "https://test.com/article",
    "properties": {"page_type": "article"}
  }]'
# Esperado: 204 No Content

# 5. Verificar evento no banco
docker compose exec postgres psql -U analytics -d pem_analytics -c "
    SELECT event_name, url FROM events_raw LIMIT 1;
"
```

---

## Troubleshooting

### Erro: "Partição não existe"

**Sintoma:** Collector não inicia, log mostra "ERRO FATAL: Partição não existe"

**Solução:**
```bash
# Recriar partições manualmente
docker compose run --rm init-partitions

# Ou verificar logs
docker compose logs init-partitions
```

### Erro: "Collector não inicia"

**Sintoma:** `docker compose ps` mostra collector com status `Restarting`

**Diagnóstico:**
```bash
# Ver logs
docker compose logs collector

# Possíveis causas:
# 1. PostgreSQL ainda não está pronto
# 2. Partições não foram criadas
# 3. Erro de conexão com banco
```

**Solução:**
```bash
# Reiniciar stack
docker compose down -v
docker compose up -d

# Aguardar e verificar
sleep 10
./scripts/verify.sh
```

### Erro: "Porta já em uso"

**Sintoma:** `bind: address already in use`

**Solução:**
```bash
# Encontrar processo usando porta 3000
lsof -i :3000

# Ou usar portas diferentes no docker-compose.yml
```

### Erro: "Permission denied" nos scripts

**Solução:**
```bash
chmod +x scripts/verify.sh
chmod +x scripts/partition-manager.sh
```

---

## Comandos Úteis

```bash
# Subir serviços
docker compose up -d

# Ver logs em tempo real
docker compose logs -f

# Ver logs de serviço específico
docker compose logs -f collector

# Reiniciar serviço
docker compose restart collector

# Parar tudo
docker compose down

# Parar e remover volumes (limpa dados!)
docker compose down -v

# Executar comando no container
docker compose exec postgres psql -U analytics -d pem_analytics

# Ver estatísticas
docker compose exec postgres psql -U analytics -d pem_analytics -c "
    SELECT 
        event_name,
        COUNT(*) 
    FROM events_raw 
    WHERE event_time > NOW() - INTERVAL '1 hour'
    GROUP BY event_name;
"
```

---

## Metabase

### Primeiro Acesso

1. Acesse: http://localhost:3001
2. Complete o setup inicial (criar conta)
3. Adicione a conexão PostgreSQL:
   - Host: `postgres`
   - Port: `5432`
   - Database: `pem_analytics`
   - Username: `analytics`
   - Password: (ver .env)

### Queries de Exemplo

```sql
-- Eventos por hora
SELECT 
    DATE_TRUNC('hour', event_time) as hour,
    event_name,
    COUNT(*)
FROM events_raw
WHERE event_time > NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY 1 DESC;

-- Top URLs
SELECT 
    url,
    COUNT(*) as views
FROM events_raw
WHERE event_name = 'page_view'
GROUP BY url
ORDER BY views DESC
LIMIT 10;
```

---

## Produção

### Checklist de Produção

- [ ] Alterar senha padrão do PostgreSQL
- [ ] Configurar backup automático do PostgreSQL
- [ ] Habilitar TLS no collector
- [ ] Configurar reverse proxy (nginx/traefik)
- [ ] Limitar acesso ao Metabase (VPN/básico auth)
- [ ] Monitoramento (logs, métricas)

### Backup

```bash
# Backup do banco
docker compose exec postgres pg_dump -U analytics pem_analytics > backup.sql

# Restore
docker compose exec -T postgres psql -U analytics -d pem_analytics < backup.sql
```

---

**Data de criação:** 2024-01-20  
**Última atualização:** 2024-02-03 (adicionado verify.sh)

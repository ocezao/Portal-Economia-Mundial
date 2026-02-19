# Runbook - Cenario Internacional

> Manual de operações para produção (Docker)

## Informações Rápidas

| Item | Valor |
|------|-------|
| **Domínio** | cenariointernacional.com.br |
| **Email** | contato@cenariointernacional.com.br |
| **VPS** | 187.77.37.175 |
| **Projeto** | /var/www/portal |
| **Porta Web** | 3000 |
| **Porta API** | 4000 |
| **Porta Collector** | 4010 |
| **Porta Metabase** | 3001 |

---

## Containers Docker

```bash
# Listar containers
docker ps

# ou usando docker compose
cd /var/www/portal
docker compose ps

# Ver logs de um serviço
docker compose logs -f web
docker compose logs -f api
docker compose logs -f collector

# Reiniciar um serviço
docker compose restart web
docker compose restart api

# Rebuild e reiniciar (após更新代码)
docker compose build web
docker compose up -d web
```

---

## Comandos Úteis

### Docker Compose

```bash
# Status de todos os serviços
cd /var/www/portal
docker compose ps

# Logs em tempo real (todos os serviços)
docker compose logs -f

# Logs de um serviço específico
docker compose logs -f web

# Reiniciar aplicação
docker compose restart web

# Rebuild completo
docker compose build web
docker compose up -d web

# Parar todos os serviços
docker compose down

# Iniciar todos os serviços
docker compose up -d

# Ver recursos usados
docker stats
```

### Nginx

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Status
sudo systemctl status nginx

# Logs de acesso
sudo tail -f /var/log/nginx/access.log

# Logs de erro
sudo tail -f /var/log/nginx/error.log
```

### Certbot (SSL)

```bash
# Renovar certificado
sudo certbot renew

# Testar renovação
sudo certbot renew --dry-run

# Verificar certificados
sudo certbot certificates
```

### Backup

```bash
# Backup completo
cd /var/www/portal
./scripts/backup.sh full

# Backup apenas banco
./scripts/backup.sh db

# Restaurar banco
./scripts/restore.sh db

# Listar backups
ls -lh /var/www/portal-backups/
```

---

## Troubleshooting

### Site fora do ar

1. Verificar status dos containers:
   ```bash
   cd /var/www/portal
   docker compose ps
   ```

2. Verificar logs:
   ```bash
   docker compose logs -f web
   ```

3. Verificar Nginx:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

4. Verificar porta 3000:
   ```bash
   curl http://localhost:3000
   ```

### Erro 502 Bad Gateway

1. Verificar se container web está rodando:
   ```bash
   docker compose ps
   ```

2. Verificar logs de erro:
   ```bash
   docker compose logs web
   ```

3. Reiniciar container:
   ```bash
   docker compose restart web
   ```

### Erro de memória

1. Verificar uso de memória:
   ```bash
   docker stats
   free -h
   ```

2. Ajustar limites no docker-compose.yml se necessário

3. Reiniciar:
   ```bash
   docker compose restart web
   ```

### Banco de dados lento

1. Verificar conexão:
   ```bash
   curl http://localhost:3000
   ```

2. Verificar logs do Supabase no dashboard

3. Verificar se há muitas conexões abertas

---

## Deploy Manual

```bash
# SSH no servidor
ssh root@187.77.37.175

# Ir para o diretório do projeto
cd /var/www/portal

# Pull das últimas alterações
git pull origin main

# Rebuild da imagem Docker
docker compose build web

# Reiniciar o container
docker compose up -d web

# Verificar se está rodando
docker compose ps
curl https://cenariointernacional.com.br
```

---

## Deploy via GitHub Actions

O deploy também pode ser feito automaticamente via GitHub Actions quando há push na branch main.

Ver workflow: `.github/workflows/deploy.yml`

---

## Endpoints Importantes

| Serviço | URL |
|---------|-----|
| **Site** | https://cenariointernacional.com.br |
| **Admin** | https://cenariointernacional.com.br/admin |
| **API** | https://cenariointernacional.com.br/api/* |
| **Metabase** | https://metabase.cenariointernacional.com.br |
| **RSS** | https://cenariointernacional.com.br/rss.xml |

---

## Variáveis de Ambiente

As variáveis de ambiente estão configuradas no arquivo `.env` local e no docker-compose.yml.

**Importante:** Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou outras chaves sensíveis.

---

## Monitoramento

### Health Checks

- Site: `https://cenariointernacional.com.br`
- API: `https://cenariointernacional.com.br/api/news`
- Metabase: `https://metabase.cenariointernacional.com.br`

### Logs

```bash
# Ver todos os logs
docker compose logs -f

# Ver apenas erros
docker compose logs web | grep -i error
```

---

**Última atualização:** 19/02/2026

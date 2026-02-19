# Runbook - Cenario Internacional

> Manual de operações para produção

## Informações Rápidas

| Item | Valor |
|------|-------|
| **Domínio** | cenariointernacional.com.br |
| **Email** | contato@cenariointernacional.com.br |
| **Produção** | /var/www/pem |
| **Porta** | 3000 |

---

## Comandos Úteis

### PM2

```bash
# Status da aplicação
pm2 status

# Logs em tempo real
pm2 logs portal-economico

# Últimas 100 linhas de log
pm2 logs portal-economico --lines 100

# Reiniciar aplicação
pm2 restart portal-economico

# Reload zero-downtime
pm2 reload portal-economico

# Parar aplicação
pm2 stop portal-economico

# Monitoramento
pm2 monit

# Salvar configuração
pm2 save

# Restaurar após reboot
pm2 resurrect
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
sudo tail -f /var/log/nginx/pem-access.log

# Logs de erro
sudo tail -f /var/log/nginx/pem-error.log
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
/var/www/pem/scripts/backup.sh full

# Backup apenas banco
/var/www/pem/scripts/backup.sh db

# Restaurar banco
/var/www/pem/scripts/restore.sh db

# Listar backups
ls -lh /var/www/pem-backups/
```

---

## Troubleshooting

### Site fora do ar

1. Verificar status do PM2:
   ```bash
   pm2 status
   ```

2. Verificar logs:
   ```bash
   pm2 logs portal-economico --lines 100
   ```

3. Verificar Nginx:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

4. Verificar porta 3000:
   ```bash
   curl http://localhost:3000/api/health
   ```

### Erro 502 Bad Gateway

1. Verificar se aplicação está rodando:
   ```bash
   pm2 status
   ```

2. Verificar logs de erro:
   ```bash
   pm2 logs portal-economico --err
   ```

3. Reiniciar aplicação:
   ```bash
   pm2 restart portal-economico
   ```

### Erro de memória

1. Verificar uso de memória:
   ```bash
   pm2 monit
   free -h
   ```

2. Se necessário, aumentar limite no `ecosystem.config.js`:
   ```javascript
   max_memory_restart: '1G' // Aumentar para 1.5G ou 2G
   ```

3. Reiniciar:
   ```bash
   pm2 restart portal-economico
   ```

### Banco de dados lento

1. Verificar conexão:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Verificar logs do Supabase no dashboard

3. Verificar se há muitas conexões abertas

---

## Deploy Manual

```bash
# SSH no servidor
ssh usuario@cenariointernacional.com.br

# Ir para o diretório
cd /var/www/pem

# Executar script de deploy
./scripts/deploy.sh main
```

## Rollback

```bash
# Listar backups disponíveis
ls -t /var/www/pem-backups/pre-deploy-*.tar.gz

# Executar rollback
./scripts/rollback.sh
```

---

## Contatos

| Role | Contato |
|------|---------|
| Desenvolvedor | contato@cenariointernacional.com.br |
| Infraestrutura | contato@cenariointernacional.com.br |

---

## Checklist de Deploy

- [ ] Verificar se há commits não publicados
- [ ] Verificar testes passando localmente
- [ ] Fazer push para main
- [ ] Aguardar CI/CD passar
- [ ] Verificar health check: https://cenariointernacional.com.br/api/health
- [ ] Verificar homepage: https://cenariointernacional.com.br
- [ ] Verificar logs: `pm2 logs`

---

## URLs Importantes

| Serviço | URL |
|---------|-----|
| Produção | https://cenariointernacional.com.br |
| Health Check | https://cenariointernacional.com.br/api/health |
| RSS | https://cenariointernacional.com.br/rss.xml |
| Sitemap | https://cenariointernacional.com.br/sitemap.xml |
| Supabase Dashboard | https://supabase.com/dashboard |
| GitHub | (configurar URL do repo) |

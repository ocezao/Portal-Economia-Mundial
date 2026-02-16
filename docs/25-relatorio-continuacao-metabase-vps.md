# Relatório de Continuação - Migração VPS e Instabilidade do Metabase

## Objetivo deste arquivo
Registrar detalhadamente:
- tudo que foi tentado na VPS;
- por que cada ação foi escolhida;
- qual era o objetivo de cada teste;
- o que foi corrigido com sucesso;
- o que voltou a falhar;
- estado atual real para retomada futura sem retrabalho.

Data de referência dos testes: **14/02/2026**.

---

## 1) Contexto operacional
- VPS Hostinger (Ubuntu 24.04), stack Docker + Nginx + Certbot.
- Projeto em `/var/www/portal`.
- Serviços esperados:
  - `web` na porta 3000
  - `api` na porta 4000
  - `collector` na porta 4010
  - `metabase` na porta 3001 (externa) / 3000 interna do container

---

## 2) Problema inicial da etapa 7 (Docker Compose)
### Sintoma
`docker compose up -d --build` não concluía de forma saudável.

### Causa encontrada
Build do `web` falhava ao copiar `.next/standalone`:
- erro: `"/app/.next/standalone": not found`

### Ação tomada
Adicionado `output: 'standalone'` no `next.config.js`.

### Motivo da ação
O Dockerfile do app espera estrutura standalone do Next.js para runtime otimizado.

### Resultado
Build de `web` e `api` passou.

---

## 3) Containers subiram, mas healthchecks falhavam
### Sintoma
`web`, `api` e `collector` ficaram como `unhealthy`.

### Causa encontrada
Healthchecks no compose usavam `localhost`; no ambiente do container o teste funcionou com `127.0.0.1`.

### Ação tomada
Ajuste em `docker-compose.prod.yml`:
- `http://localhost:3000/api/health` -> `http://127.0.0.1:3000/api/health`
- `http://localhost:4000/api/health` -> `http://127.0.0.1:4000/api/health`
- `http://localhost:4010/health` -> `http://127.0.0.1:4010/health`

### Resultado
`web`, `api`, `collector` ficaram `healthy`.

---

## 4) Nginx + SSL (Certbot)
### Sintoma
`nginx -t` falhava inicialmente com:
- `open() "/etc/letsencrypt/options-ssl-nginx.conf" failed`

### Causa
Config SSL foi aplicada antes da cadeia de arquivos do Certbot estar consistente para esse fluxo.

### Ações tomadas
1. Emissão de certificados por `certbot certonly --standalone`.
2. Remoção de includes SSL ausentes do arquivo Nginx:
   - `include /etc/letsencrypt/options-ssl-nginx.conf;`
   - `ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;`
3. Ajuste da regra HTTP do `www` para redirecionar corretamente para domínio sem www.

### Resultado
- `nginx -t` OK;
- `systemctl restart nginx` OK;
- redirects principais OK.

---

## 5) Validações concluídas com sucesso
### Site principal
- `https://cenariointernacional.com.br` -> **200**

### Redirect de www
- `https://www.cenariointernacional.com.br/teste?x=1` -> **301** para domínio sem www

### API
- `https://api.cenariointernacional.com.br/api/health` -> **308**
- `curl -L` no mesmo endpoint -> **200**

### Collector
- POST em `http://127.0.0.1:4010/collect` -> **204**
- Log confirmou persistência:
  - `Eventos recebidos e gravados no Supabase: 1`

### Certbot
- `certbot.timer` ativo (`active (waiting)`).

---

## 6) Metabase: histórico de falhas e correções
## 6.1 Falha 1: conexão em endpoint sem rota IPv6
### Sintoma
`metabase` retornando 502 no Nginx.

### Evidência de log
- `java.net.SocketException: Network unreachable`

### Causa
Conexão ao banco usando host que resolve para IPv6 sem rota funcional na VPS.

### Ação
Migração para endpoint de pooling IPv4 (`pooler`), porta `6543`.

---

## 6.2 Falha 2: credencial incorreta do pooler
### Sintoma
Erro de autenticação no teste via `psql`.

### Evidência
- `FATAL: Tenant or user not found`
- depois `password authentication failed for user "postgres"`

### Causa
Combinação `host/user/pass` do pooler ainda inconsistente.

### Ação
Correção de `MB_DB_HOST`, `MB_DB_PORT`, `MB_DB_USER` e atualização da senha de banco no Supabase.

### Resultado parcial
Teste `psql` manual validou com sucesso:
- `select current_user;` retornou `postgres`.

---

## 6.3 Falha 3: lock de migração
### Sintoma
Metabase caiu com erro de lock de migração.

### Evidência
- `Database has migration lock; cannot run migrations`

### Ação
Liberação do lock no SQL Editor do Supabase:
- `databasechangeloglock` com `locked=false`.

### Resultado parcial
Houve momento de recuperação com `curl -I https://metabase...` retornando **200**.

---

## 6.4 Regressão atual do Metabase
### Sintoma atual
`https://metabase.cenariointernacional.com.br` voltou para **502** intermitente.

### Evidência mais recente de log
- novamente `Network unreachable`
- stack JDBC/Postgres no container `portal-metabase`.

### Interpretação técnica
Mesmo após ajustes, o container ainda entra em ciclos de restart e em parte dos boots tenta rota/host sem conectividade estável para o DB do Metabase.

---

## 7) O que foi corrigido e permaneceu estável
- Build web/api/collector.
- Healthchecks web/api/collector.
- Rotas Nginx de site/api/www.
- SSL funcional dos domínios.
- Collector com gravação real no Supabase.

---

## 8) O que foi corrigido e voltou a falhar
- Metabase:
  - já respondeu 200 em alguns momentos;
  - voltou a 502 com logs de `Network unreachable` para conexão de banco.

---

## 9) Estado atual consolidado
- `web`: estável
- `api`: estável
- `collector`: estável e gravando
- `metabase`: instável/intermitente por conectividade de banco no startup

---

## 10) Próxima retomada recomendada (ordem objetiva)
1. Confirmar valores atuais de `.env` do Metabase:
   - `MB_DB_HOST`
   - `MB_DB_PORT`
   - `MB_DB_USER`
2. Confirmar resolução DNS do host escolhido (se retorna IPv4 de forma consistente).
3. Testar conexão `psql` com os mesmos parâmetros do Metabase.
4. Reiniciar apenas `metabase` e observar logs curtos (`--since 3m`).
5. Validar endpoint:
   - `curl -I https://metabase.cenariointernacional.com.br`

---

## 11) Observações de processo
- Boa parte do tempo foi consumida por comandos quebrados por multiline no terminal.
- Para continuidade, priorizar comandos curtos (uma linha) e verificações pontuais.
- Não houve invenção de credenciais: todos os ajustes sensíveis dependeram de dados confirmados no Supabase.


---

## 12) Atualizacao posterior (2026-02-16)

Status apos retomada:

- Metabase operacional em `https://metabase.cenariointernacional.com.br`.
- Dashboard principal de analytics/tracking definido:
  - `Tracking Completo - Executivo` (ID `3`)
- Filtro global de dias ativo no dashboard principal:
  - Parametro `periodo_global`
  - Mapeamento confirmado em `20/20` cards

Observacao:
- Este arquivo permanece como historico da fase de instabilidade de 14/02/2026.
- Estado atual do dashboard foi consolidado em `docs/27-metabase-dashboard-principal.md`.

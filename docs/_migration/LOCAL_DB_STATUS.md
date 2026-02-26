# Status da Migração - Banco Local PostgreSQL

**Última Atualização:** 26/02/2026
**Status:** 🟢 Concluído (Leitura de Notícias + Cache Finnhub)

---

## 📊 Resumo Executivo

O projeto está em processo de migração do Supabase (banco remoto) para PostgreSQL local na VPS. A estrutura base do banco local está criada e funcional. O sistema de cache para APIs externas (Finnhub) está implementado.

---

## 🎯 Objetivos da Migração

1. **Manter Supabase para:**
   - 🔐 Autenticação (Auth)
   - 🖼️ Storage de imagens

2. **Migrar para PostgreSQL local:**
   - 📰 Artigos e conteúdo
   - 👥 Perfis de usuários
   - 📈 Analytics e eventos
   - 💬 Comentários
   - 🔖 Bookmarks e histórico
   - 💾 **Cache de APIs externas (Finnhub)**

---

## ✅ Tarefas Concluídas

### Infraestrutura
- [x] Criar container PostgreSQL no docker-compose
- [x] Configurar variáveis de ambiente (DB_NAME, DB_USER, DB_PASSWORD)
- [x] Deploy do docker-compose.yml para VPS
- [x] Iniciar container `portal-database` (saudável)

### Banco de Dados
- [x] Executar SQL migration (19 tabelas)
- [x] Criar schema `auth` com roles
- [x] Criar função `auth.uid()`
- [x] Criar tabelas:
  - [x] news_articles
  - [x] categories
  - [x] authors
  - [x] profiles
  - [x] job_applications
  - [x] contact_messages
  - [x] leads
  - [x] comments
  - [x] post_actions
  - [x] bookmarks
  - [x] reading_history
  - [x] reading_progress
  - [x] news_article_categories
  - [x] news_article_tags
  - [x] tags
  - [x] news_slug_redirects
  - [x] analytics_events
  - [x] analytics_sessions
  - [x] app_errors
  - [x] external_snapshots

### Correções na Aplicação
- [x] Corrigir encoding dos arquivos admin (mojibake)
- [x] Criar API route `/api/articles` com Service Role Key
- [x] Fix Nginx config (client_max_body_size 10M)
- [x] Corrigir variáveis de ambiente no supabaseAdmin.ts
- [x] Criar lib `src/lib/db.ts` para conexão PostgreSQL
- [x] Modificar `newsManager.ts` para usar PostgreSQL local (leitura)
- [x] Adicionar pacote `pg` para conexão PostgreSQL
- [x] Manter Supabase para Auth e Storage
- [x] Implementar fallback para Supabase se local DB não disponível
- [x] **Implementar sistema de cache para Finnhub API**
- [x] **Modificar useMarketTicker para usar snapshots (cache)**
- [x] **Configurar intervalo de refresh de 30s para 5 minutos**

---

## 🔄 Tarefas em Andamento

### Migração de Dados
- [x] Usuário admin já existe localmente (cezaomachado@gmail.com)
- [x] Migrar 10 artigos para PostgreSQL local
- [x] Configurar `DATABASE_URL` no .env da VPS

### Funcionalidades Migradas
- [x] `getLatestArticles()` - lista de notícias
- [x] `getFeaturedArticles()` - notícias em destaque
- [x] `getBreakingNews()` - notícias urgentes
- [x] `getTrendingArticles()` - notícias mais lidas
- [ ] Escrita de artigos (ainda via Supabase)
- [ ] Edição de artigos (ainda via Supabase)
- [ ] Deleção de artigos (ainda via Supabase)

---

## 📋 Tarefas Pendentes

### Robustez
- [ ] Implementar backups automatizados
- [ ] Adicionar índices para otimização
- [ ] Reforçar políticas RLS
- [ ] Criar stored procedures para operações complexas
- [ ] Configurar monitoring de banco

### Validação
- [ ] Testar publicação de artigos
- [ ] Testar edição de artigos
- [ ] Testar login/auth
- [ ] Testar upload de imagens
- [ ] Verificar logs de erros
- [ ] Testar endpoints de API

---

## 🔗 Conexões

### VPS
- **IP:** 187.77.37.175
- **Container:** portal-database
- **Porta:** 5432
- **Database:** portal
- **User:** portal_user

### Credenciais (variáveis de ambiente)
```
DB_NAME=portal
DB_USER=portal_user
DB_PASSWORD=Pt8Kq2mVxL9nR4wY7jF3hN6sC0bV5dE
DATABASE_URL=postgresql://portal_user:Pt8Kq2mVxL9nR4wY7jF3hN6sC0bV5dE@database:5432/portal
```

### Supabase (mantido)
- **URL:** https://aszrihpepmdwmggoqirw.supabase.co
- **Uso:** Auth + Storage

---

## 🛠️ Comandos Úteis

### Conectar ao banco
```bash
ssh root@187.77.37.175 "docker exec -it portal-database psql -U portal_user -d portal"
```

### Ver tabelas
```bash
docker exec portal-database psql -U portal_user -d portal -c '\dt'
```

### Ver usuário admin
```bash
docker exec portal-database psql -U portal_user -d portal -c 'SELECT * FROM auth.users;'
```

### Verificar função auth.uid()
```bash
docker exec portal-database psql -U portal_user -d portal -c "SELECT proname FROM pg_proc WHERE proname = 'uid';"
```

### Reiniciar container
```bash
docker restart portal-database
```

### Ver logs
```bash
docker logs portal-database
docker logs portal-web
```

---

## ⚠️ Problemas Conhecidos

1. **portal-web unhealthy**: O container web está com status unhealthy. Precisa investigação.

---

## 📝 Notas

- O banco local NÃO tem sistema de auth próprio - usa Supabase para autenticação
- A função `auth.uid()` foi criada para simular comportamento do Supabase
- O usuário admin foi criado manualmente no banco local com ID igual ao do Supabase
- O collector de analytics ainda não está configurado para usar o banco local

---

## 🔜 Próximos Passos

1. Resolver problema do portal-web (unhealthy) - healthcheck com redirect
2. Testar publicação de artigos no admin
3. Conectar aplicação ao banco local (CRUD de artigos)
4. Implementar backups automatizados
5. Validação completa do sistema

---

## ✅ Concluído em 20/02/2026

### Testes Realizados
- [x] Homepage retorna HTTP 200
- [x] Admin page retorna HTTP 200
- [x] Admin News retorna HTTP 200
- [x] Health endpoint retorna HTTP 200
- [x] Banco local com 19 tabelas funcionando
- [x] Função auth.uid() operacional
- [x] Backup automatizado criado e testado
- [x] Índices de performance criados
- [x] Função de verificação de integridade criada

### Melhorias Implementadas
- [x] Script de backup: `scripts/backup-local-db.sh`
- [x] Função de integridade: `check_database_integrity()`
- [x] Índices adicionais para otimização
- [x] docker-compose.yml atualizado com healthchecks corrigidos

### Status Final
| Item | Status |
|------|--------|
| Container portal-database | 🟢 Healthy |
| Container portal-web | (unhealthy no 🟡 Running docker, mas funcional) |
| Container portal-api | 🟢 Healthy |
| Homepage | 🟢 200 OK |
| Admin | 🟢 200 OK |
| API Health | 🟢 200 OK |
| Backup | 🟢 Criado e testado |

---

## 📈 Sistema de Cache Finnhub (26/02/2026)

### Problema Original
- O hook `useMarketTicker` fazia chamadas **diretas** à Finnhub API a cada **30 segundos**
- Isso resultava em ~2.880 chamadas/dia à API
- Mesmo com limite de 86.400/dia, era um desperdício de recursos

### Solução Implementada

#### 1. Arquitetura de Cache
```
Cron Job (a cada 15min) → Finnhub API → PostgreSQL local (external_snapshots)
                                    ↓
useMarketTicker → PostgreSQL local → Display
```

#### 2. Limites de API Finnhub
- **Plano Gratuito:** 60 chamadas/minuto (~86.400/dia)
- **Após correção:** ~96-288 chamadas/dia (cron job + fallback)

#### 3. Alterações de Código
- `src/hooks/economics/useFinnhub.ts`:
  - Modificado `useMarketTicker` para usar `getGlobalIndicesSnapshot()` e `getCommoditiesSnapshot()`
  - Intervalo alterado de 30s para 5 minutos (300000ms)
- `src/services/economics/snapshots.ts`:
  - TTL de 5 minutos para dados de índices e commodities

#### 4. Endpoints de Refresh (CRON)
- `POST /api/cron?type=indices` - Atualiza índices
- `POST /api/cron?type=commodities` - Atualiza commodities
- `POST /api/cron?type=all` - Atualiza tudo

#### 5. Configuração do Cron na VPS
```bash
# No servidor, executar:
cd /var/www/portal
./scripts/cron-refresh.sh install
```

### Tabela de Chamadas de API

| Cenário | Intervalo | Chamadas/Dia |
|---------|-----------|--------------|
| **Antes (ERRADO)** | 30s | ~2.880 |
| **Depois (CORRETO)** | 15min (cron) | ~96-288 |
| **Limite Finnhub** | - | 86.400 |
| **Margem de segurança** | - | 99% |

### Variáveis de Ambiente
```env
NEXT_PUBLIC_FINNHUB_ENABLED=true
NEXT_PUBLIC_FINNHUB_FREE_PLAN=true
NEXT_PUBLIC_FINNHUB_API_KEY="d5vkelhr01qqiqhvfcr0d5vkelhr01qqiqhvfcrg"
FINNHUB_API_KEY=SEU_VALOR  # Remover se vazio!
```

### Fluxo de Dados
1. **Cron job** chama endpoints `/api/cron?type=...`
2. **Endpoint** busca dados da Finnhub API
3. **Salva** no banco local (tabela `external_snapshots`)
4. **useMarketTicker** lê do banco local
5. **Fallback**: Se banco vazio, chama API direta

### Próximos Passos
- [ ] Configurar cron na VPS
- [ ] Testar ticker no header
- [ ] Monitorar consumo de API

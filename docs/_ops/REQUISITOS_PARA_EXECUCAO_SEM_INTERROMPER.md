# Requisitos Para Execucao Sem Interrupcoes (Checklist de Inputs)

Este documento lista exatamente o que precisa estar disponivel para eu conseguir executar as tarefas de infraestrutura e produto sem bloqueios, e aponta o que ja existe no repositorio.

Data: 2026-02-15

## 1) Acesso a VPS (obrigatorio)

### O que ja existe no repositorio
- IP/dominio e roteiro de provisionamento: `scripts/vps-provision.sh` (inclui `187.77.37.175` e `cenariointernacional.com.br`).
- Nginx (template): `deploy/nginx/portal.conf`.
- Compose de producao: `docker-compose.prod.yml`.
- Guia de execucao manual: `docs/24-deploy-vps-execucao-manual.md`.

### O que falta voce fornecer/autorizar
- Acesso SSH funcional a VPS neste ambiente (uma destas opcoes):
  - Liberar minha chave publica no `authorized_keys` do usuario que sera usado; ou
  - Me fornecer uma chave privada SSH que tenha acesso; ou
  - Me dizer qual usuario/porta/cadeia (ex.: bastion) deve ser usado.

Observacao (atualizado): acesso SSH via chave para `root@187.77.37.175:22` esta funcionando.

Nota: o MCP `vps-admin` depende de SSH. Se o ambiente onde o Codex esta rodando estiver sem rede/SSH (sandbox),
o MCP pode falhar com erro de transporte. Nesses casos, use SSH direto a partir da sua maquina para executar as acoes na VPS.

## 2) DNS / Controle do dominio

### O que ja existe no repositorio
- Dominios/subdominios usados (web/api/metabase) em `deploy/nginx/portal.conf` e `docs/24-deploy-vps-execucao-manual.md`.

### O que falta voce fornecer
- Provedor que controla o DNS (Cloudflare/Registro.br/Hostinger/etc) e acesso para ajustes se necessario.
- Confirmacao de registros esperados (A/AAAA/CNAME) e se usamos proxy (Cloudflare) ou direto.

## 3) Variaveis de ambiente e segredos (producao)

### O que ja existe no repositorio
- Template: `.env.example`.
- `.env` local preenchido com Supabase/Finnhub/OneSignal etc (nao deve ser enviado ao git).
- Chaves vazias no `.env` local:
  - `BREVO_API_KEY`, `RESEND_API_KEY`, `SENDGRID_API_KEY`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Chaves ausentes no `.env` local (importantes para prod):
  - `METABASE_DB_PASSWORD`
  - `FINNHUB_API_KEY` (existe `NEXT_PUBLIC_FINNHUB_API_KEY`, mas o server tenta usar `FINNHUB_API_KEY` tambem).

### O que falta voce fornecer/confirmar
- Qual e a fonte de verdade do `.env` de producao (arquivo na VPS vs este `.env` local).
- Credenciais do provedor de email/newsletter (se for requisito agora).
  - Status atual: Hostinger SMTP definido como padrao.
  - Variaveis necessarias: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURITY`, `FROM_EMAIL`, `FROM_NAME`, `REPLY_TO`.
- Chaves VAPID se push web for requisito agora.

## 4) Contas de terceiros (quando aplicavel)

### O que ja existe no repositorio
- OneSignal (init): `src/components/push/OneSignalInit.tsx` + `src/components/push/OneSignalHeadScript.tsx` (head script).
- Documentacao de CI/CD e secrets: `docs/17-cicd-pipeline.md`.

### O que falta voce fornecer/confirmar
- Sentry: DSN (e organizacao/projeto) se for obrigatorio.
- Newsletter: qual provedor (Brevo/Resend/SendGrid/outro) e credenciais.
- ✅ OneSignal: CONFIGURADO e FUNCIONAL (App ID: NEXT_PUBLIC_ONESIGNAL_APP_ID)

## 5) Criterio de pronto (escopo e prioridade)

### O que ja existe no repositorio
- Checklists e roadmap: `docs/22-deploy-producao-checklist.md`, `docs/ops/ROADMAP_ESCALA_SEM_VPS.md`.

### O que falta voce definir
- Itens obrigatorios agora vs depois (ex.: PWA, comentarios, newsletter, Sentry, hardening completo).
- Meta de estabilidade (ex.: 99.9%), e o que e aceitavel de downtime na manutencao.

## 6) Janela de manutencao e rollback

### O que falta voce definir
- Horario permitido para restart/downtime.
- Estrategia de rollback (voltar compose anterior, voltar imagem anterior, voltar config Nginx, etc).

## 7) CI/CD e deploy (GitHub)

### O que ja existe no repositorio
- Workflows de CI/testes: `.github/workflows/ci.yml`, `.github/workflows/e2e.yml`, `.github/workflows/tests.yml`.
- Documentacao de pipeline: `docs/17-cicd-pipeline.md`.

### O que falta voce fornecer/autorizar
- Se podemos criar/ativar workflow de deploy (e configurar `secrets` no GitHub).
- Alternativa: deploy manual controlado via `ssh/scp` (se preferir).

## 8) Backups (e destino offsite)

### O que ja existe no repositorio
- Documentacao: `docs/ops/BACKUP_SEM_VPS.md` e itens no checklist `docs/22-deploy-producao-checklist.md`.

### O que falta (implementacao real)
- Scripts `scripts/backup.sh` e `scripts/restore.sh` (nao existem hoje).
- Destino offsite (S3/Backblaze/R2/Drive) e credenciais/rota de upload.
- Politica de retencao (ex.: 7 diarios + 4 semanais) e canal de alerta (email/telegram).

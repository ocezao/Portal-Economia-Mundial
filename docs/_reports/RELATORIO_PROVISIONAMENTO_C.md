# 📋 Relatório de Provisionamento - Subagente C

**Data**: 2026-02-13  
**VPS**: Hostinger - 187.77.37.175  
**Sistema**: Ubuntu 24.04 LTS  

---

## ⚠️ Status: AGUARDANDO EXECUÇÃO NO VPS

> **Nota Importante**: O provisionamento pode ser executado via MCP da VPS (`vps-admin`) ou manualmente no terminal online da Hostinger.

> Nota: scripts/vps-provision-manual.md (com valores reais) deve permanecer LOCAL e esta no .gitignore.

---

## 📁 Artefatos Criados

Foram criados os seguintes arquivos para facilitar o provisionamento:

### 1. Script Automático
**Arquivo**: `scripts/vps-provision.sh`
- Script bash completo que executa todo o provisionamento
- Executa todos os passos automaticamente
- Uso: `bash vps-provision.sh` (no terminal do VPS)

### 2. Guia Manual
**Arquivo**: `scripts/vps-provision-manual.example.md`
- Instruções passo a passo para execução manual
- Comandos copiar/colar
- Checklist de verificação

---

## 📋 Tarefas a Executar no VPS

### 1. Diretório Criado ✅ (Instruções)
```bash
mkdir -p /var/www/portal
```

### 2. Git Clone ✅ (Instruções)
```bash
cd /var/www/portal
git clone https://github.com/ocezao/Portal-Economia-Mundial.git .
git checkout main
```

**Commit Hash Atual**: `a1b2c3d4...` (será obtido após clone)

### 3. Arquivo .env ✅ (Conteúdo Preparado)

Arquivo `/var/www/portal/.env` com as seguintes variáveis:

| Variável | Status | Valor |
|----------|--------|-------|
| NEXT_PUBLIC_SITE_URL | ✅ | https://cenariointernacional.com.br |
| NEXT_PUBLIC_SUPABASE_URL | ✅ | https://aszrihpepmdwmggoqirw.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | (valor real obtido) |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | (valor real obtido) |
| GNEWS_API_KEY | ✅ | (valor real obtido) |
| NEXT_PUBLIC_FINNHUB_API_KEY | ✅ | (valor real obtido) |
| NEXT_PUBLIC_ONESIGNAL_APP_ID | ✅ | (valor real obtido) |
| ONESIGNAL_REST_API_KEY | ⚠️ | PENDENTE - Inserir manualmente |
| NEXT_PUBLIC_ADSENSE_CLIENT_ID | ✅ | ca-pub-6096980902806551 |
| NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE | ⚠️ | PENDENTE - Inserir manualmente |
| POSTGRES_PASSWORD | ⚠️ | PENDENTE - Definir senha forte |

### 4. Permissões ✅ (Instruções)
```bash
chmod 600 /var/www/portal/.env
chown root:root /var/www/portal/.env
```

### 5. Verificação de Ferramentas ✅ (Já Instaladas)

Conforme informado, já estão instalados no VPS:
- ✅ Docker
- ✅ Docker Compose
- ✅ Nginx
- ✅ Certbot

---

## 🚀 Como Executar

### Opção A: Script Automático (Recomendado)

1. Acesse o terminal online da Hostinger
2. Execute:
```bash
curl -fsSL https://raw.githubusercontent.com/ocezao/Portal-Economia-Mundial/main/scripts/vps-provision.sh | bash
```

Ou, se preferir baixar e executar localmente:
```bash
# Copie o arquivo scripts/vps-provision.sh para o VPS
scp scripts/vps-provision.sh root@187.77.37.175:/tmp/
ssh root@187.77.37.175 "bash /tmp/vps-provision.sh"
```

### Opção B: Execução Manual

Siga o guia em `scripts/vps-provision-manual.example.md` executando comando por comando no terminal.

---

## 📊 Checklist de Provisionamento

| Item | Status | Observação |
|------|--------|------------|
| Diretório `/var/www/portal` | ⏳ | Aguardando execução no VPS |
| Git clone | ⏳ | Aguardando execução no VPS |
| Arquivo .env | ⏳ | Conteúdo preparado, aguardando deploy |
| Permissões 600 | ⏳ | Aguardando execução no VPS |
| Docker verificado | ✅ | Já instalado |
| Docker Compose verificado | ✅ | Já instalado |
| Nginx verificado | ✅ | Já instalado |

---

## 📝 Variáveis Pendentes

As seguintes variáveis precisam ser preenchidas manualmente no arquivo `.env`:

1. **ONESIGNAL_REST_API_KEY**: Obter no dashboard do OneSignal
2. **NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE**: Obter no dashboard do AdSense
3. **POSTGRES_PASSWORD**: Definir uma senha forte para o PostgreSQL local

---

## ✅ Status Final

**Status**: ⏳ **PENDENTE DE EXECUÇÃO NO VPS**

Todos os artefatos foram preparados e estão prontos para execução. O provisionamento será concluído assim que os comandos forem executados no terminal online da Hostinger.

**Próximo Passo**: Subagente D - Deploy Docker

---

## 📎 Arquivos Referenciados

- `C:\Users\cezao\Downloads\app\scripts\vps-provision.sh` - Script automático
- `C:\\Users\\cezao\\Downloads\\app\\scripts\\vps-provision-manual.example.md` - Guia manual
- `C:\Users\cezao\Downloads\app\.env` - Fonte das variáveis de ambiente



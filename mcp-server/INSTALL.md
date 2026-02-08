# 🚀 Guia de Instalação do MCP Server

Guia passo-a-passo para instalar e configurar o MCP Server no seu servidor.

---

## 📋 Pré-requisitos

- **Node.js 18+** instalado
- Acesso SSH ao servidor
- Variáveis de ambiente do projeto configuradas

---

## 🛠️ Instalação

### 1. Acesse o servidor via SSH

```bash
ssh usuario@seu-servidor.com
cd /var/www/seu-projeto  # ou onde o projeto está
```

### 2. Execute o script de instalação

```bash
cd mcp-server
chmod +x setup.sh
./setup.sh
```

O script irá:
- ✅ Verificar o Node.js
- 📦 Instalar dependências
- 🔨 Compilar o código
- ⚙️  Verificar variáveis de ambiente

### 3. Verifique as variáveis de ambiente

Certifique-se de que o arquivo `.env` na raiz do projeto contém:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_FINNHUB_API_KEY=sua-chave-finnhub
```

> ⚠️ **IMPORTANTE**: Use a `SUPABASE_SERVICE_ROLE_KEY`, não a anon key!

### 4. Teste o servidor

```bash
npm start
```

Você deve ver:
```
✅ Servidor MCP PEM iniciado via stdio
```

Pressione `Ctrl+C` para parar.

---

## 🔧 Configuração do Codex CLI

### No seu computador local

Edite o arquivo `~/.codex/config.toml`:

```bash
nano ~/.codex/config.toml
```

Adicione:

```toml
[[servers]]
name = "pem"
type = "stdio"
command = "ssh"
args = [
  "usuario@seu-servidor.com",
  "cd /var/www/seu-projeto/mcp-server && node dist/index.js"
]
```

Ajuste o caminho `/var/www/seu-projeto` para onde seu projeto está no servidor.

### Teste a conexão

```bash
codex
```

No prompt do Codex, digite:

```
"Quais as 5 notícias mais lidas esta semana?"
```

O Codex deve responder usando o MCP Server.

---

## 🔄 Atualização

Para atualizar o MCP Server após mudanças:

```bash
cd /var/www/seu-projeto/mcp-server
git pull origin main  # se usar git
npm install           # se houver novas dependências
npm run build         # recompila
```

---

## 🐛 Troubleshooting

### Erro: "Node.js não encontrado"

Instale o Node.js 18+:

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifique
node --version  # Deve mostrar v20.x.x ou superior
```

### Erro: "SUPABASE_SERVICE_ROLE_KEY não configurado"

1. Acesse o dashboard do Supabase
2. Vá em Project Settings > API
3. Copie a "service_role key" (não a anon key!)
4. Adicione ao `.env`:

```bash
echo 'SUPABASE_SERVICE_ROLE_KEY="sua-chave-aqui"' >> ../.env
```

### Erro: "Erro ao buscar cotação"

A Finnhub API key pode estar:
- Inválida
- Sem créditos (plano gratuito: 60 calls/min)

Verifique em: https://finnhub.io/dashboard

### Erro de permissão ao executar setup.sh

```bash
chmod +x setup.sh
./setup.sh
```

---

## 📊 Verificação da Instalação

Após instalar, verifique se tudo funciona:

```bash
# Teste de analytics
codex -c "Quantos pageviews tivemos nos últimos 7 dias?"

# Teste de conteúdo
codex -c "Liste os artigos publicados hoje"

# Teste de mercado
codex -c "Qual a cotação do Bitcoin agora?"
```

---

## 📝 Checklist Pós-Instalação

- [ ] Node.js 18+ instalado
- [ ] `npm install` executado sem erros
- [ ] `npm run build` gerou a pasta `dist/`
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] Configuração do Codex CLI criada
- [ ] Teste de conexão realizado com sucesso
- [ ] Comandos de analytics funcionando
- [ ] Comandos de conteúdo funcionando

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs de erro do servidor
2. Confira a documentação completa: `docs/20-mcp-server.md`
3. Verifique se as variáveis de ambiente estão corretas
4. Teste manualmente: `cd mcp-server && npm start`

---

**Versão:** 1.0.0  
**Última atualização:** 07/02/2026

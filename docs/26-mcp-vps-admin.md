# MCP da VPS (Administracao) - vps-admin

Este documento descreve o MCP EXCLUSIVO da VPS para administracao do servidor.
Nao confundir com o MCP do projeto em `mcp-server/`.

## Objetivo

Permitir operacoes de administracao via Codex usando `stdio` sobre SSH, sem expor HTTP publico.

## Componentes

- VPS: `/opt/vps-mcp` (Node.js + TypeScript)
- Tool principal: `run_command` (executa comandos via `bash -lc`)
- Windows (launcher): `C:\Servidor MCP - OPENAI\VPS_Admin_MCP\run-mcp.ps1`
- Codex: servidor MCP chamado `vps-admin`

## Pre-requisitos (VPS)

- Node.js 20 LTS
- SSH funcionando (chave)

## Pre-requisitos (Windows)

- OpenSSH Client
- Chave em `C:\Users\cezao\.ssh\id_ed25519`

## Configuracao Codex

O `vps-admin` e configurado como `stdio` e executa o launcher PowerShell, que abre SSH para a VPS e roda:

- `node /opt/vps-mcp/dist/index.js`

## Troubleshooting (Transport Closed)

Se o MCP falhar com `Transport closed`, isso normalmente significa que o processo `ssh` caiu ou que o ambiente onde o Codex/MCP esta rodando nao tem acesso de rede/SSH (restricao de sandbox).

Checklist rapido:
- Valide o SSH direto (fora do MCP) no Windows: `ssh -vvv root@<ip> "echo ok"`.
- Confirme que o launcher `run-mcp.ps1` aponta para usuario/host/porta corretos e usa a chave certa.
- Se o SSH funcionar no seu PC mas o MCP continuar falhando, execute as acoes criticas via SSH diretamente (sem MCP) ou rode o MCP em um ambiente sem restricao de rede.

## Seguranca

- Nao exponha MCP por HTTP.
- Prefira chave SSH (sem senha).
- Mantenha UFW ativo (22/80/443) e desabilite root por senha.
- Segredos nunca devem estar em arquivos versionados.

## Smoke test

No Codex:

- `Use the vps-admin tool system_info and return the raw JSON.`

Esperado: JSON com `ok: true`.

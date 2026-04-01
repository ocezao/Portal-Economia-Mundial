# Plano de Execucao - Operacao Editorial por LLM com Subagentes

## Objetivo

Transformar a operacao editorial por LLM em um fluxo confiavel para:

- criar artigos
- editar artigos
- enriquecer SEO/AEO/GEO
- validar prontidao editorial
- aprovar
- agendar
- publicar
- monitorar jobs e falhas

O foco deste plano nao e apenas adicionar endpoints. O foco e fechar o sistema completo para uma LLM operar com previsibilidade, baixo atrito e risco controlado.

## Time de Subagentes

### Coordenacao principal

- **Agente principal**: integra achados, prioriza execucao, valida consistencia tecnica e fecha a revisao final da checklist.

### Subagente 1 - API Editorial

- Responsabilidade:
  - auditar e executar melhorias na camada `/api/v1/editorial`
  - revisar contratos, envelopes de resposta, validacoes, erros estaveis e cobertura funcional
- Escopo:
  - endpoints
  - contratos OpenAPI
  - fluxo create/edit/enrich/validate/approve/schedule/publish
  - jobs editoriais

### Subagente 2 - Operacao e Infra

- Responsabilidade:
  - mapear e fechar dependencias fora da API
  - garantir que a LLM tenha um caminho operacional confiavel para usar a API
- Escopo:
  - autenticacao
  - segredos
  - cron/jobs
  - banco
  - uploads
  - deploy
  - VPS
  - observabilidade

### Subagente 3 - Qualidade, Testes e Documentacao

- Responsabilidade:
  - garantir que a operacao por LLM esteja comprovada e documentada
- Escopo:
  - testes de integracao
  - docs centrais
  - runbooks
  - checklist de aceite
  - revisao final da execucao

## Sequencia de Execucao

### Fase 1 - Base operacional minima

Objetivo:
- permitir que uma LLM descubra a API, valide credencial e execute o fluxo principal sem improviso

Entregas:
- endpoint de discovery
- endpoint de auth check
- OpenAPI atualizado
- `meta`, `slug`, `articles`, `uploads`
- respostas padronizadas

Resultado esperado:
- a LLM consegue entender a API e testar a credencial antes de operar

### Fase 2 - Workflow editorial completo

Objetivo:
- tornar o fluxo editorial completo e controlado

Entregas:
- `enrich`
- `validate`
- `approve`
- `sources`
- `publish`
- `schedule`
- `jobs`
- `jobs/dispatch`

Resultado esperado:
- a LLM consegue executar a jornada editorial completa sem depender de atalhos manuais

### Fase 3 - Operacao segura

Objetivo:
- garantir que o sistema seja operavel fora do codigo

Entregas:
- politica de provisionamento de `EDITORIAL_API_KEY`
- documentacao de cron
- runbook de falhas
- logs e rastreabilidade minima

Resultado esperado:
- a operacao deixa de depender de conhecimento tribal

### Fase 4 - Prova de confiabilidade

Objetivo:
- comprovar que o fluxo suporta uso real por agente

Entregas:
- testes de integracao
- checklist de aceite
- revisao final da checklist

Resultado esperado:
- existe evidencia objetiva de que a operacao esta pronta

## Checklist Executavel

Marcar cada item com:

- `[ ]` nao iniciado
- `[~]` em andamento
- `[x]` concluido
- `[!]` bloqueado

### A. API Editorial

- [ ] Existe endpoint de discovery em `/api/v1/editorial`
- [ ] Existe endpoint de verificacao de credencial em `/api/v1/editorial/auth`
- [ ] Existe OpenAPI atualizado em `/api/v1/editorial/openapi`
- [ ] Todas as rotas editoriais retornam envelope padrao com `ok`, `data|error`, `meta`
- [ ] Existe `GET /meta` para autores e categorias validos
- [ ] Existe helper de slug com validacao
- [ ] Existe listagem paginada de artigos
- [ ] Existe criacao de artigo por API
- [ ] Existe atualizacao de artigo por API
- [ ] Existe upload editorial autenticado por API key
- [ ] Existe enriquecimento de artigo
- [ ] Existe validacao editorial antes de publicar
- [ ] Existe aprovacao editorial explicita
- [ ] Existe gerenciamento dedicado de fontes
- [ ] Existe publicacao imediata
- [ ] Existe agendamento com `publishedAt`
- [ ] Existe listagem de jobs editoriais
- [ ] Existe dispatch de jobs editoriais

### B. Contrato e previsibilidade

- [ ] Erros retornam `code` estavel
- [ ] Erros retornam `message` clara
- [ ] Respostas retornam `requestId`
- [ ] Respostas retornam `timestamp`
- [ ] A OpenAPI cobre endpoints realmente existentes
- [ ] A documentacao de uso da API nao contradiz o codigo

### C. Autenticacao e segredos

- [ ] Esta documentado que a API nao emite credenciais automaticamente
- [ ] Existe processo claro para provisionar `EDITORIAL_API_KEY`
- [ ] Existe processo claro para rotacionar a chave
- [ ] Existe local correto para injetar o segredo no executor/agente
- [ ] Existe forma de a LLM testar se a credencial recebida funciona

### D. Dependencias operacionais fora da API

- [ ] `DATABASE_URL` esta no caminho critico e documentado
- [ ] O storage de uploads esta documentado corretamente
- [ ] O cron editorial necessario esta documentado
- [ ] O fluxo de jobs esta documentado
- [ ] O comportamento do ambiente de producao esta documentado
- [ ] Existe runbook minimo de falha operacional

### E. Qualidade editorial

- [ ] `validate` bloqueia erros estruturais
- [ ] `validate` sinaliza warnings de SEO/editorial
- [ ] O fluxo recomendado para a LLM exige `validate` antes de `publish`
- [ ] O fluxo recomendado para a LLM exige fontes quando necessario
- [ ] O fluxo recomendado para a LLM deixa claro quando usar `approve`

### F. Testes e prova de confiabilidade

- [ ] Existe teste de auth editorial
- [ ] Existe teste de create
- [ ] Existe teste de add source
- [ ] Existe teste de enrich
- [ ] Existe teste de validate
- [ ] Existe teste de approve
- [ ] Existe teste de schedule
- [ ] Existe teste de dispatch job
- [ ] Existe teste de publish
- [ ] Existe teste de falha com credencial invalida
- [ ] Existe teste de idempotencia de job

### G. Documentacao central

- [ ] `README.md` nao contradiz o estado real da operacao
- [ ] `docs/README.md` indexa a documentacao editorial correta
- [ ] `docs/16-api-rest.md` cobre a API editorial v1 real
- [ ] `docs/api-editorial-llm.md` descreve o fluxo real recomendado
- [ ] `docs/01-arquitetura.md` reflete a arquitetura atual
- [ ] `docs/21-image-processing.md` reflete uploads locais
- [ ] `docs/30-automacao-editorial-seo-aeo-geo.md` separa o que ja foi feito do que ainda falta
- [ ] Existe auditoria atual de aderencia entre codigo e documentacao

## Como executar o plano

### Passo 1

Subagente 1 valida o estado funcional da API editorial e fecha gaps de contrato.

### Passo 2

Subagente 2 valida autenticacao, cron, segredos, banco, uploads e operacao em producao.

### Passo 3

Subagente 3 valida testes, docs e evidencias de prontidao.

### Passo 4

O agente principal cruza os resultados, marca a checklist e decide:

- o que esta realmente concluido
- o que esta parcialmente concluido
- o que ainda esta bloqueado

## Revisao final da checklist

Ao final da execucao, a checklist so pode ser considerada correta se todas as regras abaixo forem verdadeiras.

## Preenchimento inicial - 2026-04-01

### A. API Editorial

- `[x]` Existe endpoint de discovery em `/api/v1/editorial`
- `[x]` Existe endpoint de verificacao de credencial em `/api/v1/editorial/auth`
- `[x]` Existe OpenAPI atualizado em `/api/v1/editorial/openapi`
- `[x]` Todas as rotas editoriais novas retornam envelope padrao com `ok`, `data|error`, `meta`
- `[x]` Existe `GET /meta` para autores e categorias validos
- `[x]` Existe helper de slug com validacao
- `[x]` Existe listagem paginada de artigos
- `[x]` Existe criacao de artigo por API
- `[x]` Existe atualizacao de artigo por API
- `[x]` Existe upload editorial autenticado por API key
- `[x]` Existe enriquecimento de artigo
- `[x]` Existe validacao editorial antes de publicar
- `[x]` Existe aprovacao editorial explicita
- `[x]` Existe gerenciamento dedicado de fontes
- `[x]` Existe publicacao imediata
- `[x]` Existe agendamento com `publishedAt`
- `[x]` Existe listagem de jobs editoriais
- `[x]` Existe dispatch de jobs editoriais

### B. Contrato e previsibilidade

- `[~]` Erros retornam `code` estavel
- `[x]` Erros retornam `message` clara
- `[x]` Respostas retornam `requestId`
- `[x]` Respostas retornam `timestamp`
- `[~]` A OpenAPI cobre endpoints realmente existentes
- `[~]` A documentacao de uso da API nao contradiz o codigo

### C. Autenticacao e segredos

- `[x]` Esta documentado que a API nao emite credenciais automaticamente
- `[x]` Existe processo claro para provisionar `EDITORIAL_API_KEY`
- `[x]` Existe processo claro para rotacionar a chave
- `[x]` Existe local correto para injetar o segredo no executor/agente
- `[x]` Existe forma de a LLM testar se a credencial recebida funciona

### D. Dependencias operacionais fora da API

- `[~]` `DATABASE_URL` esta no caminho critico e documentado
- `[~]` O storage de uploads esta documentado corretamente
- `[x]` O cron editorial necessario esta documentado
- `[x]` O fluxo de jobs esta documentado
- `[ ]` O comportamento do ambiente de producao esta documentado
- `[x]` Existe runbook minimo de falha operacional

### E. Qualidade editorial

- `[x]` `validate` bloqueia erros estruturais
- `[x]` `validate` sinaliza warnings de SEO/editorial
- `[x]` O fluxo recomendado para a LLM exige `validate` antes de `publish`
- `[x]` O fluxo recomendado para a LLM exige fontes quando necessario
- `[x]` O fluxo recomendado para a LLM deixa claro quando usar `approve`

### F. Testes e prova de confiabilidade

- `[x]` Existe teste de auth editorial
- `[x]` Existe teste de create
- `[x]` Existe teste de add source
- `[x]` Existe teste de enrich
- `[x]` Existe teste de validate
- `[x]` Existe teste de approve
- `[x]` Existe teste de schedule
- `[x]` Existe teste de dispatch job
- `[x]` Existe teste de publish
- `[x]` Existe teste de falha com credencial invalida
- `[x]` Existe teste de idempotencia de job

### G. Documentacao central

- `[~]` `README.md` nao contradiz o estado real da operacao
- `[x]` `docs/README.md` indexa a documentacao editorial correta
- `[x]` `docs/16-api-rest.md` cobre a API editorial v1 real
- `[x]` `docs/api-editorial-llm.md` descreve o fluxo real recomendado
- `[x]` `docs/01-arquitetura.md` reflete a arquitetura atual
- `[x]` `docs/21-image-processing.md` reflete uploads locais
- `[x]` `docs/30-automacao-editorial-seo-aeo-geo.md` separa o que ja foi feito do que ainda falta
- `[x]` Existe auditoria atual de aderencia entre codigo e documentacao

### Parecer inicial sobre o preenchimento

- **Completude**: parcial
- **Consistencia**: boa na camada editorial, incompleta na camada operacional e documental estrutural
- **Operabilidade para LLM**: parcial

Conclusao desta rodada:

- a checklist esta preenchida de forma coerente com o estado atual do repositorio
- ela ainda nao autoriza chamar a operacao de “tranquila” para uma LLM sem supervisao
- os maiores bloqueios atuais sao:
- comprovacao real na VPS
- cron editorial em producao ainda nao validado nesta rodada
- `README.md` principal ainda carrega passivos historicos fora do escopo editorial

### Atualizacao da rodada - endurecimento de workflow

Evidencias adicionadas nesta etapa:

- `src/lib/server/editorialAdmin.ts`
  - criacao inicial agora exige `draft`
  - `approve` agora exige artigo validado sem erros
  - `publish` e `schedule` agora exigem validacao sem erros e status aprovado
  - ausencia de fontes passou a bloquear prontidao de publicacao
- `src/lib/server/adminApi.ts`
  - `CRON_API_SECRET` deixou de autenticar como credencial editorial
- `src/lib/server/editorialHttp.ts`
  - conflitos de workflow e validacao ganharam mapeamento de erro mais estavel
- rotas:
  - `src/app/api/v1/editorial/articles/route.ts`
  - `src/app/api/v1/editorial/articles/[id]/approve/route.ts`
  - `src/app/api/v1/editorial/articles/[id]/publish/route.ts`
  - `src/app/api/v1/editorial/articles/[id]/schedule/route.ts`
  - agora retornam conflito de workflow em vez de mascarar tudo como `500`

### Atualizacao da rodada - testes e operacao

Evidencias adicionadas nesta etapa:

- `tests/integration/editorialApi.test.ts`
  - cobre `auth`, `create`, `add source`, `validate`, `approve`, `publish`, `schedule`, `jobs` e `jobs/dispatch`
  - cobre falha de credencial invalida
- `docs/api-editorial-llm.md`
  - agora documenta provisionamento, rotacao, cron, codigos de erro e fluxo obrigatorio
- `docs/ops/RUNBOOK_EDITORIAL_LLM.md`
  - agora existe runbook minimo de operacao, segredos, cron, falhas e monitoramento
- `src/app/api/v1/editorial/openapi/route.ts`
  - agora documenta melhor respostas, conflitos de workflow e sequencia recomendada

### Regra 1 - Evidencia

Cada item marcado como `[x]` precisa ter evidencia objetiva:

- arquivo de codigo
- endpoint implementado
- teste existente
- build validado
- documento atualizado

Se nao houver evidencia, o item deve voltar para `[ ]` ou `[~]`.

### Regra 2 - Nao aceitar “quase pronto” como concluido

Itens parcialmente implementados nao podem ser marcados como `[x]`.

Exemplos:
- endpoint existe, mas nao esta documentado corretamente
- endpoint existe, mas nao retorna envelope padrao
- doc existe, mas contradiz o comportamento real

Nesses casos, marcar `[~]`.

### Regra 3 - Dependencias externas importam

Um item nao esta concluido se depender de algo fora do codigo e isso nao estiver fechado.

Exemplos:
- cron nao configurado
- segredo nao provisionado
- runbook ausente
- deploy nao comprovado

Nesses casos, marcar `[!]` ou `[~]`.

### Regra 4 - Revisao cruzada

A checklist final precisa ser revisada contra:

- codigo atual
- docs atuais
- build
- testes existentes
- runbooks operacionais

### Regra 5 - Criterio para “operacao tranquila por LLM”

So considerar que a LLM consegue operar “de forma tranquila” quando:

- consegue validar credencial
- consegue descobrir autores/categorias
- consegue criar/editar/subir imagem/anexar fontes
- consegue enriquecer e validar
- consegue aprovar e publicar/agendar
- consegue monitorar jobs
- recebe respostas previsiveis
- existe documentacao suficiente para operar sem ler codigo
- existe suporte operacional para segredo e cron
- existe evidencia tecnica da jornada principal

## Resultado esperado deste plano

Quando a checklist estiver corretamente preenchida e aprovada na revisao final, o projeto tera:

- API editorial realmente amigavel para LLM
- operacao editorial menos dependente de humano
- menos improviso na integracao
- menor risco de falha silenciosa
- melhor previsibilidade de publicacao
- base tecnica mais segura para automacao em producao

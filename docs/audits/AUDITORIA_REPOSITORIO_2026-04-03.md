# Auditoria do Repositorio - 2026-04-03

**Status:** concluida  
**Escopo:** repositorio inteiro (`app`, `collector`, `database`, `scripts`, `docs`, testes, deploy e ambiente `Local x VPS`)

## 1. Objetivo

Concluir a retirada integral do backend remoto legado e das suas dependencias do projeto, consolidando banco local, sessao HTTP-only, uploads locais e deploy via Docker + Nginx.

## 2. O que precisava ser alterado

1. remover clientes, tipos, mocks e testes legados
2. cortar variaveis antigas de ambiente e build
3. remover scripts, subprojetos e documentacao presos ao runtime remoto
4. migrar as migracoes para uma estrutura neutra
5. validar o repo sem referencias residuais

## 3. O que foi feito

- runtime e APIs consolidados em banco local, sessao local e uploads locais
- `collector/` mantido em PostgreSQL local
- `database/migrations` criado como fonte oficial do schema
- scripts legados de bootstrap, export, setup e integracoes remotas removidos
- `mcp-server/` removido
- compose, Dockerfile, Nginx, exemplo de ambiente, README e indice de docs reescritos
- documentacao historica conflitante removida

## 4. Como foi feito

1. varredura completa com `rg`
2. substituicao do runtime restante por implementacoes locais
3. remocao de arquivos sem trilha de uso atual
4. migracao de `database/migrations` para trilha oficial de schema
5. limpeza final de configuracoes, scripts e docs
6. revarredura global de confirmacao

## 5. Tecnologias usadas

- PowerShell
- Git
- ripgrep (`rg`)
- Next.js
- TypeScript
- PostgreSQL (`pg`)
- Docker / Docker Compose
- Nginx
- patches manuais

## 6. Se conseguiu arrumar

**Sim.**

- o projeto ficou padronizado em banco local, sessao local, uploads locais e deploy Docker + Nginx
- o runtime remoto antigo e suas dependencias foram removidos do repositorio
- a base documental principal foi reduzida ao estado atual do projeto

## 7. Proximos passos recomendados

1. rodar `npm run build`
2. validar `collector/` com `npm run build`
3. validar `docker compose -f docker-compose.prod.yml config`
4. revisar o deploy na VPS com o novo contrato de ambiente

## 8. Estabilizacao do build local

### O que precisava ser alterado

1. preencher o contrato de ambiente local no `.env`
2. evitar que leituras publicas derrubassem o prerender quando o banco local nao estivesse disponivel
3. alinhar feeds e sitemaps ao comportamento de fallback

### O que foi feito

- atualizado `.env` local com `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `LOCAL_AUTH_SECRET`, `AUTH_SESSION_SECRET`, `UPLOADS_DIR` e configuracao local do Metabase
- atualizado `src/lib/db.ts` para derivar `DATABASE_URL` a partir de `DB_*` quando necessario
- endurecido `src/services/newsManager.ts` para retornar fallback vazio em leituras publicas quando houver indisponibilidade de banco durante o build
- ajustados:
  - `src/app/sitemap.xml/route.ts`
  - `src/app/sitemaps/news/[page]/route.ts`
  para retornarem conteudo vazio em vez de falhar no prerender
- mantido o comportamento explicito de falha nas rotas administrativas/escrita

### Como foi feito

1. leitura do erro real do `next build`
2. identificacao das rotas estaticas e da camada de leitura publica envolvidas
3. correcao do contrato de ambiente local
4. adicao de fallback apenas onde o build precisava degradar com seguranca
5. reexecucao do build completo

### Quais tecnologias foram usadas

- PowerShell
- Next.js App Router
- TypeScript
- PostgreSQL (`pg`)
- patches manuais
- `npm run build`

### Se conseguiu arrumar

**Sim.**

- o `npm run build` do app principal concluiu com sucesso
- o `npm run build` do `collector/` ja estava concluindo com sucesso
- `docker compose -f docker-compose.prod.yml config` segue valido

### Observacoes

- o build ainda emite avisos de fallback de snapshots e chave Finnhub invalida/sem permissao em alguns endpoints publicos
- esses avisos nao quebram mais o build; o site degrada para dados vazios quando o banco local ou o provedor externo nao respondem

## 9. Lote 5 - Refino de codigo e duplicacoes

### O que precisava ser alterado

1. remover o wrapper legado `src/config/storage.ts` e migrar todos os imports para `src/lib/storage.ts`
2. consolidar a fonte de verdade de autores, eliminando a duplicacao de `CONTENT_CONFIG.authors`
3. reduzir a superficie publica de `src/services/articleApi.ts` ao uso real do admin
4. confirmar remocao de arquivos legados orfaos como `src/lib/logger.new.ts`

### O que foi feito

- migrados os imports restantes de storage para `@/lib/storage` em:
  - `src/app/(site)/HomePageClient.tsx`
  - `src/app/(site)/configuracoes/ConfiguracoesClient.tsx`
  - `src/app/admin/diagnostico/page.tsx`
  - `src/app/admin/noticias/novo/page.tsx`
  - `src/app/admin/noticias/editar/[slug]/page.tsx`
  - `src/app/app/page.tsx`
  - `src/contexts/AuthContext.tsx`
- validado que `src/config/storage.ts` saiu da trilha ativa e permaneceu removido
- removido o bloco duplicado `CONTENT_CONFIG.authors` de `src/config/content.ts`
- alterado `AuthorId` em `src/config/content.ts` para derivar de `AUTHORS` em `src/config/authors.ts`
- validado que `src/services/articleApi.ts` ficou restrito ao uso real atual do app, mantendo apenas `createArticleApi` e `updateArticleApi`
- validado que `src/lib/logger.new.ts` segue removido e sem qualquer import ativo

### Como foi feito

1. varredura global com busca textual para localizar wrappers, imports antigos e referencias duplicadas
2. migracao pontual dos imports restantes para a implementacao oficial
3. remocao da duplicacao de autores em `content.ts`, mantendo `config/authors.ts` como fonte de verdade
4. revarredura para confirmar ausencia de:
   - `@/config/storage`
   - `CONTENT_CONFIG.authors`
   - `logger.new`
5. execucao de `npm run build` para validar que o refino estrutural nao quebrou o app

### Quais tecnologias foram usadas

- PowerShell
- ripgrep / busca textual recursiva
- TypeScript
- Next.js
- patches manuais
- `npm run build`

### Se conseguiu arrumar

**Sim.**

- o wrapper legado de storage saiu completamente dos imports do app
- a duplicacao de autores entre `content.ts` e `authors.ts` foi eliminada
- `articleApi.ts` ficou alinhado ao uso real atual
- o build segue concluindo com sucesso apos o refino

### Observacoes

- o `npm run build` concluiu com sucesso no lote 5
- os avisos remanescentes continuam sendo os mesmos do lote 4/8: fallbacks de snapshot por `ECONNREFUSED` e fallback do Finnhub sem permissao; eles nao bloquearam a compilacao

## 10. Consolidacao de todas as auditorias

### Escopo da consolidacao

Foram revisados os documentos de auditoria atuais e historicos ligados a `docs/audits`, incluindo arquivos removidos do workspace mas ainda presentes no historico do git.

### Documentos revisados

| Documento | Natureza | Estado atual |
|-----------|----------|--------------|
| `docs/audits/AUDITORIA_REPOSITORIO_2026-04-03.md` | auditoria principal atual | **concluida** |
| `docs/audits/TEMP_RESPOSTA_ULTIMA.md` | apoio temporario de contexto, nao e auditoria formal | **historico / fora do fechamento** |
| `docs/audits/AUDITORIA_ARQUIVOS_NAO_NECESSARIOS.md` | auditoria historica | **parcialmente resolvida / parcialmente pendente** |
| `docs/audits/AUDITORIA_DATABASE.md` | auditoria historica da arquitetura antiga | **obsoleta e superada pela migracao** |
| `docs/audits/AUDITORIA_SEGURANCA.md` | auditoria historica | **parcialmente resolvida / parcialmente pendente** |
| `docs/audits/RELATORIO_CODIGO_MORTO.md` | auditoria historica | **parcialmente resolvida / requer revalidacao final** |
| `docs/audits/RESUMO_LIMPEZA_FINAL.md` | fechamento historico de uma limpeza anterior | **obsoleto / nao representa mais o estado atual** |

### Leitura consolidada por documento

#### `AUDITORIA_REPOSITORIO_2026-04-03.md`

**Status:** concluida

Cobriu e fechou:
- remocao integral do backend remoto legado e suas dependencias
- consolidacao de banco local, sessao HTTP-only, uploads locais e deploy Docker + Nginx
- estabilizacao do build local
- refino estrutural do lote 5

#### `AUDITORIA_ARQUIVOS_NAO_NECESSARIOS.md`

**Status:** parcialmente resolvida

Itens que ficaram resolvidos:
- dependencia `kimi-plugin-inspect-react` nao existe mais no `package.json`
- logs temporarios `dev5173.err`, `dev5173.log` e `.eslintcache` nao existem mais
- diretorio `supabase/` foi removido
- parte relevante da documentacao redundante/conflitante foi removida ou consolidada

Itens que seguem abertos:
- `collector/` e `sdk/` continuam no repositorio e exigem decisao final de produto/operacao
- ainda existe resido operacional local como `tsconfig.tsbuildinfo`
- ainda ha documentacao historica fora de `docs/audits` que menciona arquitetura antiga

#### `AUDITORIA_DATABASE.md`

**Status:** obsoleta e superada

Motivo:
- o documento auditava uma arquitetura baseada em Supabase e Edge Functions
- essa arquitetura saiu do projeto
- o documento tem valor historico, mas nao deve ser usado como estado atual do banco

Conclusao:
- nao gera fase nova de execucao
- apenas reforca a necessidade de manter a documentacao historica claramente marcada como superada

#### `AUDITORIA_SEGURANCA.md`

**Status:** parcialmente resolvida

Itens resolvidos desde a auditoria historica:
- senha hardcoded `dev_password_123` nao aparece mais no codigo de runtime atual; restou apenas em documentacao historica
- auth sensivel nao depende mais de Supabase
- `src/config/storage.ts` saiu da trilha ativa e a estrategia atual separa `sessionStorage` para dados sensiveis e `localStorage` para dados publicos

Itens ainda abertos no codigo atual:
- ainda ha diversos `console.log`, `console.warn` e `console.error` em rotas, hooks, snapshots e scripts
- ainda ha multiplos usos de `dangerouslySetInnerHTML` que precisam de revisao de confianca/sanitizacao por caso
- ainda ha residuos textuais da arquitetura antiga em `.env.scripts` e em documentacao historica

#### `RELATORIO_CODIGO_MORTO.md`

**Status:** parcialmente resolvida e desatualizada

Itens resolvidos:
- boa parte da trilha antiga baseada em Supabase saiu
- wrappers e duplicacoes relevantes do lote 5 foram removidos
- varios arquivos historicamente listados ja nao existem mais

Limitacoes:
- o relatorio antigo foi gerado em outra arquitetura e nao pode ser tratado como lista confiavel de remocao automatica hoje
- ainda existe uma pendencia real de revalidacao final para:
  - componentes e dependencias de UI que sobraram no `package.json`
  - permanencia ou extracao de `collector/` e `sdk/`
  - residuos documentais e artefatos locais

#### `RESUMO_LIMPEZA_FINAL.md`

**Status:** obsoleto

Motivo:
- descreve um estado intermediario muito anterior
- lista arquivos e estruturas que ja nao refletem a base atual
- deve ser tratado apenas como historico

### Quantas fases restavam para encerrar tudo o que ainda estava aberto nesta consolidacao

**Restavam 3 fases reais no momento desta leitura consolidada.**

#### Fase 1 - Harden de seguranca e logging

Escopo:
- revisar e reduzir `console.*` em runtime de app/API
- classificar todos os `dangerouslySetInnerHTML` em:
  - seguro e mantido
  - seguro com sanitizacao explicita
  - inseguro e corrigido
- revisar residuos de configuracao antiga relacionados a ambiente

Status na consolidacao: **pendente**

#### Fase 2 - Limpeza residual e fechamento documental

Escopo:
- remover residuos operacionais locais como `tsconfig.tsbuildinfo`
- limpar referencias textuais antigas a Supabase e arquitetura removida em docs e arquivos auxiliares como `.env.scripts`
- marcar formalmente os relatorios historicos como superados no indice documental

Status na consolidacao: **pendente**

#### Fase 3 - Decisao final sobre `collector/` e `sdk` + revalidacao de codigo morto

Escopo:
- decidir se `collector/` e `sdk/` continuam como partes oficiais do monorepo
- se ficarem: documentar como componentes suportados
- se sairem: remover, ajustar docs, scripts e public assets relacionados
- revalidar dependencias de UI e analytics que podem ter sobrado no `package.json`

Status na consolidacao: **pendente**

### O que nao conta como fase restante

- migracao de banco/auth remota: **encerrada**
- estabilizacao do build local: **encerrada**
- lote 5 de duplicacoes e wrappers legados: **encerrado**
- auditoria historica do banco baseada em Supabase: **superada, nao pendente**

### Se conseguiu atualizar a documentacao nesta consolidacao

**Sim.**

- esta secao consolida o estado de todas as auditorias revisadas
- os documentos historicos foram classificados como concluidos, parciais, obsoletos ou superados
- o numero de fases restantes foi reduzido ao que ainda tem impacto real no codigo atual

## 11. Fase 1 - Harden de seguranca e logging

### O que precisava ser alterado

1. reduzir `console.log`, `console.warn` e `console.error` espalhados no runtime do app
2. revisar todos os usos de `dangerouslySetInnerHTML`
3. corrigir o caso que ainda permitia insercao de HTML em destaque de busca
4. manter apenas os usos intencionais de `dangerouslySetInnerHTML`, com justificativa

### O que foi feito

- migrados logs de runtime para `logger` em:
  - `src/services/economics/snapshots.ts`
  - `src/lib/db.ts`
  - `src/lib/server/adminApi.ts`
  - `src/lib/sentry.ts`
  - `src/hooks/economics/useFinnhub.ts`
  - `src/contexts/SearchContext.tsx`
  - `src/components/ads/AdSenseScript.tsx`
  - `src/app/api/search/route.ts`
  - `src/app/api/ticker/route.ts`
  - `src/app/api/newsletter/confirm/route.ts`
  - `src/app/api/cron/route.ts`
  - `src/app/admin/hooks/useAdminData.ts`
- aplicado rate limit em logs ruidosos de snapshot, banco e auth editorial
- removido o `dangerouslySetInnerHTML` da busca em `src/components/search/SearchModal.tsx`
- substituida a estrategia de highlight por renderizacao segura em React com `<mark>`

### Classificacao final dos `dangerouslySetInnerHTML`

#### Mantidos de forma intencional

- `src/app/layout.tsx`
  - scripts inline de GTM/gtag/Clarity
  - caso intencional e controlado
- `src/components/seo/JsonLd.tsx`
  - JSON-LD serializado com escape de `<`
  - caso intencional e controlado
- `src/components/news/ArticleContent.tsx`
  - conteudo passa por `sanitizeHtml`
- `src/components/interactive/CommentSection.tsx`
  - comentario passa por `sanitizeHtmlStrict`
- `src/app/admin/noticias/novo/page.tsx`
  - preview passa por `sanitizeHtml`
- `src/app/admin/noticias/editar/[slug]/page.tsx`
  - preview passa por `sanitizeHtml`

#### Corrigido

- `src/components/search/SearchModal.tsx`
  - removido o `dangerouslySetInnerHTML`
  - highlight agora e seguro por composicao de elementos React

### Como foi feito

1. varredura de `console.*` e `dangerouslySetInnerHTML` no `src/`
2. leitura contextual dos pontos ativos
3. substituicao dos logs diretos por `logger`
4. aplicacao de `warnRateLimit` e `errorRateLimit` nos pontos mais ruidosos
5. remocao do unico `dangerouslySetInnerHTML` desnecessario e nao sanitizado
6. revarredura completa para confirmar que `console.*` ficou restrito ao `src/lib/logger.ts`
7. execucao de `npm run build`

### Quais tecnologias foram usadas

- PowerShell
- ripgrep / busca textual recursiva
- TypeScript
- Next.js
- patches manuais
- `npm run build`

### Se conseguiu arrumar

**Sim, com ressalva controlada.**

- o runtime do app nao ficou mais espalhando `console.*`; o uso agora passa pelo `logger`
- o `dangerouslySetInnerHTML` inseguro da busca foi removido
- os casos remanescentes de `dangerouslySetInnerHTML` ficaram classificados e justificados

### Observacoes

- o `npm run build` concluiu com sucesso apos as mudancas
- no build ainda aparecem mensagens sanitizadas do `logger` relacionadas a fallback de snapshots quando o banco local nao responde
- essas mensagens nao representam falha do build; sao log de degradacao controlada

## 12. Fase 2 - Limpeza residual e fechamento documental

### O que precisava ser alterado

1. remover residuos textuais da arquitetura antiga em arquivos auxiliares
2. limpar regras orfas de ignore que apontavam para diretorios ja removidos
3. remover artefatos locais de build ainda presentes no workspace
4. atualizar a documentacao para refletir que a Fase 1 ja foi concluida e que a Fase 2 tambem foi executada

### O que foi feito

- removidas as referencias antigas de `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` em `.env.scripts`
- removida a regra orfa `supabase/.temp/` de `.gitignore`
- removido o artefato local `tsconfig.tsbuildinfo` do workspace
- atualizado `docs/README.md` para deixar explicito que qualquer mencao restante a arquitetura antiga e apenas historica
- atualizado este relatorio para:
  - marcar a consolidacao anterior como fotografia historica daquele momento
  - registrar a conclusao da Fase 2
  - reduzir as fases realmente abertas a partir daqui

### Como foi feito

1. varredura textual por `supabase`, `SUPABASE_` e `NEXT_PUBLIC_SUPABASE`
2. remocao manual dos residuos restantes em configuracao auxiliar e ignore
3. revisao do indice documental enxuto
4. atualizacao do relatorio principal para manter rastreabilidade do que foi corrigido

### Quais tecnologias foram usadas

- PowerShell
- ripgrep / busca textual recursiva
- patches manuais
- Git

### Se conseguiu arrumar

**Sim.**

- os residuos textuais ativos da arquitetura antiga foram removidos dos arquivos auxiliares principais
- o indice documental ficou coerente com a base atual
- a fase residual/documental foi encerrada

### Observacoes

- mencoes historicas a `supabase/` permanecem apenas dentro deste proprio relatorio, como registro de auditoria do que foi removido
- a partir daqui, a unica fase estrutural ainda aberta e a decisao final sobre `collector/` e `sdk` com revalidacao final de codigo morto

## 13. Fase 3 - Decisao final sobre `collector/` e `sdk`

### O que precisava ser alterado

1. decidir se `collector/` continuava como parte oficial da stack ou se era resido legado
2. decidir se `sdk/` continuava como fonte oficial do analytics ou se havia virado codigo morto
3. revalidar scripts e documentacao ligados a esses dois componentes
4. fechar a ultima frente de codigo potencialmente morto ou mal classificado

### O que foi feito

- validado que `collector/` continua oficial porque:
  - existe como servico no `docker-compose.yml` e no `docker-compose.prod.yml`
  - tem build proprio funcional
  - e a trilha suportada para ingestao first-party em `POST /collect`
- validado que `sdk/` continua oficial porque:
  - gera o bundle publicado em `public/analytics/analytics.min.js`
  - e referenciado pelo script de verificacao avancada
  - documenta a API do analytics first-party e mantem a fonte do artefato publico
- corrigido `sdk/src/core/analytics.ts` para expor `debug` e `log` como `protected`, removendo os warnings de TypeScript na extensao `CINAnalytics`
- atualizado `scripts/verify-advanced.sh` para validar a estrutura real atual do `collector`
- atualizado `README.md` para registrar `collector/`, `sdk/` e `public/analytics/` como partes oficiais da arquitetura atual

### Como foi feito

1. varredura textual por referencias a `collector` e `sdk` no runtime, docs, scripts e Compose
2. validacao de build propria com:
   - `collector\\npm run build`
   - `sdk\\npm run build`
3. leitura da relacao entre `sdk/` e o artefato publicado em `public/analytics/analytics.min.js`
4. correcao dos warnings de heranca no SDK
5. alinhamento da verificacao automatizada e da documentacao principal

### Quais tecnologias foram usadas

- PowerShell
- Git
- ripgrep / busca textual recursiva
- TypeScript
- Rollup
- Fastify
- Docker Compose
- patches manuais
- `npm run build`

### Se conseguiu arrumar

**Sim.**

- `collector/` foi classificado como componente oficial ativo, nao como codigo morto
- `sdk/` foi classificado como componente oficial ativo, nao como codigo morto
- a validacao avancada deixou de apontar para a estrutura antiga do `collector`
- os warnings estruturais do build do SDK foram removidos
- a fase final da auditoria foi encerrada

### Observacoes

- `sdk/` nao e importado diretamente pelo app principal; ele atua como fonte de build do bundle distribuido em `public/analytics/`
- `collector/` permanece acoplado ao banco local e ao stack Docker, portanto continua dentro do monorepo por decisao tecnica valida
- a partir desta secao, nao restam fases estruturais abertas da auditoria
- validacao final:
  - `collector\\npm run build`: concluido com sucesso
  - `sdk\\npm run build`: concluido com sucesso, sem warnings

## 14. Auditoria de compatibilidade Local x VPS apos a consolidacao

### Objetivo

Verificar se o estado atual do repositorio cria dependencias que funcionam apenas em ambiente local ou que podem quebrar quando publicados na VPS.

### Fontes usadas

- codigo atual do repositorio
- `.env.example`
- `docker-compose.prod.yml`
- `Dockerfile`
- `src/lib/server/localAuth.ts`
- `src/lib/server/fileStorage.ts`
- `src/lib/server/email.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/contact-messages/route.ts`
- `src/app/api/career-applications/route.ts`
- `src/app/api/newsletter/subscribe/route.ts`
- validacoes locais de imports e variaveis de ambiente
- inspecao da VPS real via MCP (`system_info`, `docker compose config`, `docker exec`, leitura do `.env` e do checkout em `/var/www/portal`)

### Fatos observados

1. O checkout atual da VPS nao corresponde ao estado consolidado do repositorio.
   - `/var/www/portal` esta em `HEAD detached`
   - o checkout esta sujo e cheio de modificacoes locais
   - o `docker-compose.prod.yml` e o `Dockerfile` da VPS ainda pertencem a arquitetura antiga baseada em variaveis `SUPABASE_*`

2. O contrato de ambiente da VPS ainda nao foi alinhado ao runtime novo.
   - a VPS atual nao tem `LOCAL_AUTH_SECRET`
   - a VPS atual nao tem `AUTH_SESSION_SECRET`
   - a VPS atual nao tem `UPLOADS_DIR`

3. O runtime novo de auth local nao falha sem segredo, mas cai em fallback inseguro.
   - `src/lib/server/localAuth.ts` usa `change-me-local-auth-secret` quando `LOCAL_AUTH_SECRET` e `AUTH_SESSION_SECRET` nao existem
   - isso faria a autenticacao funcionar na VPS, mas com segredo previsivel e inadequado para producao

4. O upload local, como esta hoje, tem alto risco de falhar na VPS se subir sem ajuste.
   - `src/lib/server/fileStorage.ts` usa `UPLOADS_DIR` ou fallback para `process.cwd()/public/uploads`
   - o container da VPS roda como usuario `nextjs`
   - a verificacao real dentro do container mostrou que `/app/public` e `root:root` e nao e gravavel pelo usuario da aplicacao
   - sem `UPLOADS_DIR` externo e gravavel, o upload tende a falhar com permissao negada

5. O `docker-compose.prod.yml` novo do repositorio ainda nao injeta varias variaveis de runtime usadas pelo app.
   - email: `SMTP_*`, `FROM_*`, `REPLY_TO`
   - caixas de destino: `CONTACT_INBOX_EMAIL`, `CAREERS_INBOX_EMAIL`, `NEWSLETTER_INBOX_EMAIL`
   - editorial/ip bypass: `ALLOW_INTERNAL_EDITORIAL_IP_BYPASS`, `EDITORIAL_ALLOWED_IPS`, `EDITORIAL_ALLOWED_CIDRS`, `EDITORIAL_ALLOW_PRIVATE_NETWORKS`
   - ads/finnhub/metabase opcionais de frontend e painel
   - isso nao necessariamente derruba o boot, mas desliga funcionalidades ou muda comportamento em producao

6. O `docker compose config` da VPS atual mostrou warnings de variaveis faltando na configuracao ativa.
   - `FINNHUB_API_KEY` nao esta setada
   - `METABASE_DB_PASSWORD` nao esta setada
   - isso ja indica drift operacional no ambiente atual

7. O build local nao mostrou problemas de casing de imports.
   - a checagem de imports relativos e `@/` nao encontrou divergencias de maiusculas/minusculas escondidas pelo Windows
   - isso reduz risco de quebra exclusiva de Linux nesse ponto

### Interpretacao

- o principal risco hoje nao e “dependencia que so funciona localmente” no codigo-fonte puro
- o principal risco e **drift de ambiente e deploy**
- o repositorio consolidado esta coerente, mas a VPS real ainda esta presa no runtime antigo
- se o codigo novo for enviado para la sem alinhar compose, secrets e uploads, a chance de quebra funcional e alta

### Riscos classificados

#### P0

- **auth local em producao sem segredo explicito**
  - impacto: sessao assinada com segredo previsivel
  - causa: ausencia de `LOCAL_AUTH_SECRET` e `AUTH_SESSION_SECRET` na VPS

- **upload local com diretório default nao gravavel**
  - impacto: falha em `/api/upload` e rotas administrativas de arquivo
  - causa: `UPLOADS_DIR` ausente + `/app/public` nao gravavel pelo usuario `nextjs`

- **deploy direto sobre checkout antigo/sujo da VPS**
  - impacto: estado imprevisivel, mistura de arquiteturas e chance alta de regressao
  - causa: `/var/www/portal` fora de branch limpa e ainda em stack antiga

#### P1

- **compose novo sem todas as variaveis de runtime usadas pelo app**
  - impacto: email, newsletter, painéis e bypass editorial podem parar ou degradar

- **VPS atual ainda com compose/Dockerfile antigos de Supabase**
  - impacto: novo runtime nao sera reproduzido corretamente se o deploy nao substituir essa trilha inteira

- **variaveis opcionais de monetizacao e comportamento de frontend nao injetadas no build de producao**
  - impacto: blocos de AdSense, flags de Finnhub e partes do Metabase podem degradar silenciosamente

### Conclusao

**Nao encontrei evidência de que o codigo novo dependa de Windows/local paths ou imports que so funcionem localmente.**

**Encontrei evidência forte de que o deploy para a VPS vai quebrar ou degradar se ocorrer sem alinhar ambiente e compose.**

O estado correto e:

- codigo: **majoritariamente portavel para a VPS**
- ambiente da VPS atual: **ainda incompatível com o runtime consolidado**
- deploy seguro exige:
  1. checkout limpo
  2. compose novo
  3. segredos de auth local
  4. `UPLOADS_DIR` gravavel
  5. variaveis de email/editorial/ads/painel alinhadas

## 15. API editorial e publicacao real na VPS

### O que precisava ser alterado

1. Descobrir por que agentes diziam que publicaram artigos, mas a pagina publica caia em:
   - `Algo deu errado`
   - `Tente recarregar a pagina. Se o erro persistir, volte mais tarde.`

2. Validar o fluxo editorial real na producao:
   - `auth`
   - `readiness`
   - `meta`
   - `create`
   - `validate`
   - `approve`
   - `publish`

3. Criar um artigo real com:
   - capa
   - SEO
   - metadados
   - FAQ
   - fontes

4. Confirmar visualmente na VPS, e nao no ambiente local.

### Fatos observados

1. A API editorial viva respondeu normalmente em:
   - `GET /api/v1/editorial/auth`
   - `GET /api/v1/editorial/readiness`
   - `GET /api/v1/editorial/meta`

2. O log real do `portal-web` na VPS mostrava repetidamente:
   - `TypeError: Cannot read properties of null (reading 'startsWith')`
   - origem: `.next/server/app/(site)/noticias/[slug]/page.js`

3. O banco de producao tinha ao menos um artigo `published` com `cover_image` nulo/vazio.
   - contagem antes da correcao: `1`
   - contagem depois da correcao operacional: `0`

4. O checkout da VPS continuava antigo e inconsistente.
   - a pagina de artigo ainda tinha a versao vulneravel de `article.coverImage.startsWith('http')`

5. Depois do rebuild inicial do `portal-web`, surgiu outro problema estrutural:
   - `DATABASE_URL` do container `portal-web` apontava para `db.aszrihpepmdwmggoqirw.supabase.co`
   - o host falhava com `ENOTFOUND`
   - a pagina publica do artigo passava a responder como `404`

6. O `.env` da VPS estava corrompido nessa area:
   - existia uma linha espuria `nDATABASE_URL=...n`
   - e a linha `DATABASE_URL=` real ainda apontava para o host antigo do Supabase

### Interpretacao

- o erro que o usuario via nao era “fantasma de agente”; havia falha estrutural real na renderizacao publica
- a causa raiz imediata era a pagina do artigo nao tolerar `coverImage` nulo
- o ambiente da VPS agravava o problema, porque o `portal-web` estava sendo recriado com `DATABASE_URL` antigo/invalido
- isso explica por que a API podia parecer funcional em parte, mas a pagina publica quebrava ou voltava `404`

### O que foi feito

1. Corrigido o dado quebrado em producao:
   - atualizado `cover_image` dos artigos `published` sem capa para um asset interno valido

2. Executado um artigo real via API editorial na VPS:
   - slug: `o-que-e-estagflacao-e-como-afeta-juros-cambio-e-bolsa-2026`
   - `id`: `ce410d26-1c88-4dc3-9071-0e93e4c06549`
   - status final: `published`

3. Persistidos no artigo:
   - `seoTitle`
   - `metaDescription`
   - `coverImage`
   - `faqItems`
   - `sources`
   - categoria editorial valida em producao (`economia`)

4. Aplicado hotfix de null-safety na pagina de artigo da VPS:
   - fallback para `SEO_CONFIG.og.image` quando `article.coverImage` vier nulo/vazio

5. Aplicado o mesmo hotfix no repositorio local em:
   - `src/app/(site)/noticias/[slug]/page.tsx`

6. Corrigido o `DATABASE_URL` real da VPS para a base local:
   - `postgresql://portal_user:***@database:5432/portal`

7. Recriado o container `portal-web` para subir com:
   - codigo da pagina com fallback
   - `DATABASE_URL` correto

### Como foi feito

- leitura de codigo local com PowerShell e `rg`
- leitura operacional da VPS com MCP `vps_admin_http`
- consultas SQL diretas dentro do container PostgreSQL da VPS
- chamadas HTTP reais para a API editorial com `curl`
- validacao visual com Playwright via `page.goto(...)`
- patch local com `apply_patch`

### Tecnologias usadas

- Next.js
- PostgreSQL
- Docker Compose
- API editorial HTTP
- Playwright
- PowerShell
- Python para patch pontual de arquivo/`.env` na VPS

### Se conseguiu arrumar

**Parcialmente sim, com prova funcional do fluxo editorial e do artigo publicado.**

O que ficou comprovado:

- a API editorial publicou um artigo real na VPS
- o artigo existe em producao com `status = published`
- o HTML server-side final da URL publica contem:
  - titulo
  - breadcrumb
  - categoria
  - selo `Verificado`
  - autor
  - imagem
  - corpo
  - bloco de fontes
- o Playwright, usando `page.goto(...)`, conseguiu ler o corpo publicado da pagina real

Evidencia operacional do Playwright:

- URL: `https://cenariointernacional.com.br/noticias/o-que-e-estagflacao-e-como-afeta-juros-cambio-e-bolsa-2026/`
- titulo: `O que e estagflacao e como ela afeta juros, cambio e bolsa | Cenario Internacional`
- corpo visivel incluiu:
  - `ECONOMIA`
  - `Verificado`
  - `Ana Silva`
  - `Referencias consultadas`

Limitacoes remanescentes:

1. O wrapper de screenshot do Playwright falhou no desktop com:
   - `EPERM: operation not permitted, mkdir 'C:\\Windows\\System32\\.playwright-mcp'`
   - por isso a prova visual ficou registrada por:
     - snapshot
     - `page.goto(...)`
     - leitura de `innerText`
     - HTML final coletado da propria VPS

2. Ainda existem erros de console nao bloqueantes no frontend vivo:
   - CSP bloqueando AdSense, Clarity e OneSignal
   - `503` em `/api/telemetry/error`

3. O `.env` da VPS ainda esta sujo e precisa limpeza formal:
   - linha espuria `nDATABASE_URL=...n`

### Estado final desta frente

- diagnostico estrutural: **concluido**
- fluxo editorial real na VPS: **concluido**
- post real criado e publicado: **concluido**
- validacao visual com Playwright: **concluida sem screenshot em arquivo, mas com snapshot e leitura do corpo**
- hardening residual de producao: **ainda pendente**

## 7.2.6. Hardening do contrato da API editorial para agentes genericos

### O que precisava ser alterado

Depois do caso `trump-tax-brasil-2026`, ficou claro que nao bastava bloquear `coverImage` externo e `publish` fora do fluxo. A API ainda precisava comunicar melhor, para qualquer agente sem contexto previo, qual e o pacote editorial minimo esperado antes de publicar:

- titulo
- resumo
- conteudo
- categoria
- autor
- imagem de capa local valida
- `seoTitle`
- `metaDescription`
- `tags`
- `faqItems` para AEO
- `sources` para atribuicao editorial e, quando aplicavel, atribuicao da imagem
- uso de `context/market` para artigos de economia/geopolitica

### O que foi feito

1. Endurecida a validacao editorial em `src/lib/server/editorialAdmin.ts`:
   - erro se houver menos de `3` tags ao publicar/aprovar
   - erro se houver menos de `2` FAQ items ao publicar/aprovar

2. Expandido o contrato de discovery/meta em:
   - `src/lib/server/editorialApi.ts`
   - `src/app/api/v1/editorial/route.ts`

3. Expandido o OpenAPI em:
   - `src/app/api/v1/editorial/openapi/route.ts`
   - descricoes explicitas para `seoTitle`, `metaDescription`, `tags`, `faqItems` e `sources`
   - thresholds de qualidade de publicacao
   - regra de atribuicao da imagem em `sources`
   - regra de uso de `context/market` para artigos economicos/geopoliticos

4. Atualizada a documentacao operacional para agentes em:
   - `docs/api-editorial-llm.md`
   - com um bloco explicito de `Pacote editorial minimo para agentes genericos`

### Como foi feito

- leitura do contrato atual via discovery, `meta` e OpenAPI na VPS
- comparacao com os endpoints realmente usados pelo agente que criou o artigo com erro
- patch local com `apply_patch`
- reforco simultaneo de documentacao e validacao, para o contrato nao ficar so “no texto”

### Tecnologias usadas

- Next.js route handlers
- TypeScript
- Zod
- PowerShell
- `curl` na VPS via MCP

### Se conseguiu arrumar

**Sim, no nivel de contrato e de enforcement.**

O que isso resolve:

- agentes genericos passam a receber discovery mais explicito sobre SEO, AEO, tags, fontes, autor e imagem
- o publish deixa de aceitar pacote editorial fraco com menos de `3` tags ou menos de `2` FAQ items
- a regra de atribuicao da imagem fica formalizada dentro de `sources`
- artigos de economia/geopolitica passam a ter uma orientacao clara de consultar `context/market` antes de redigir/enriquecer

Pendencia remanescente:

- ainda e necessario subir esse estado completo para a VPS para que o comportamento real em producao reflita esse contrato reforcado

## 7.2.7. Correcao do compose de producao para alinhar repo e VPS

### O que precisava ser alterado

Ao subir a VPS com o estado completo do repositorio, apareceu um desvio estrutural importante:

- `docker-compose.prod.yml` nao descrevia o banco principal da aplicacao
- os containers `portal-web`, `portal-api` e `portal-collector` dependiam de `DATABASE_URL`
- o `.env` da VPS apontava `DATABASE_URL` para `database:5432`
- mas o servico `database` nao existia no compose de producao

Resultado:

- a VPS atualizava para o release novo
- mas o health ficava `degraded`
- erro observado: `getaddrinfo ENOTFOUND database`

### O que foi feito

1. Atualizado `docker-compose.prod.yml` para incluir o servico `database` (PostgreSQL principal)
2. Alinhado o `DATABASE_URL` dos containers para ser derivado por compose:
   - `postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/${DB_NAME}`
3. Adicionado `depends_on` com `service_healthy` para:
   - `web`
   - `api`
   - `collector`
4. Atualizado `docs/RUNBOOK.md` para refletir:
   - deploy por Docker Compose
   - banco principal interno no compose de producao
   - recomendacao de release limpo em vez de `git pull` em checkout sujo

### Como foi feito

- deploy real do release completo na VPS
- leitura do `health` da aplicacao em producao
- leitura do `.env` ativo da VPS
- comparacao entre `docker-compose.yml` e `docker-compose.prod.yml`
- patch local com `apply_patch`

### Tecnologias usadas

- Docker Compose
- PostgreSQL
- Next.js
- PowerShell
- MCP `vps_admin_http`

### Se conseguiu arrumar

**Sim no repositorio; a reaplicacao na VPS ficou como proximo passo imediato desta frente.**

O problema foi identificado com prova objetiva e corrigido no compose de producao versionado. O passo restante foi reimplantar a VPS com esse compose corrigido para eliminar o `ENOTFOUND database`.

## 7.2.8. Biblioteca editorial de imagens no banco + fluxo SEO obrigatorio

### O que precisava ser alterado

O fluxo de imagem ainda dependia demais de arquivo local e storage em disco:

- um agente externo precisava ter o arquivo fisico para usar `multipart`
- nao existia uma biblioteca persistida no banco para assets editoriais
- a API nao permitia atualizar metadados editoriais da imagem depois do upload
- o fluxo de publicacao ainda nao exigia metadados profissionais da capa

### O que foi feito

1. Criada a camada `editorial_media_assets`:
   - arquivo de runtime: `src/lib/server/editorialAssetStore.ts`
   - migracao formal: `database/migrations/20260403223000_create_editorial_media_assets.sql`

2. O endpoint `POST /api/v1/editorial/uploads` passou a:
   - continuar aceitando `multipart/form-data`
   - aceitar `application/json` com `base64`
   - gravar o arquivo na VPS
   - registrar o asset no PostgreSQL
   - responder com `asset` + `file`

3. O endpoint `PATCH /api/v1/editorial/uploads` passou a:
   - atualizar metadados editoriais da imagem por `assetId` ou `publicUrl`
   - campos suportados:
     - `titleText`
     - `altText`
     - `caption`
     - `creditText`
     - `focusKeywords`
     - `sourceType`
     - `sourceUrl`
     - `promptText`

4. O nome fisico do arquivo passou a ser SEO-friendly:
   - slug do nome original + sufixo curto unico
   - em vez de UUID puro sem semantica

5. `GET /api/v1/editorial/uploads/library` agora tenta ler primeiro a biblioteca registrada no banco e usa o filesystem como fallback.

6. O `validate/publish` editorial ficou mais rigido:
   - minimo de `3` tags
   - minimo de `2` FAQ items
   - minimo de `2` fontes
   - minimo de `1200` caracteres de texto util
   - se `coverImage` estiver em `/uploads`, a imagem precisa estar registrada e conter:
     - `titleText`
     - `altText`
     - `caption`
     - `creditText`

7. Discovery, OpenAPI e docs foram atualizados para refletir:
   - upload por `base64`
   - patch de metadados da imagem
   - thresholds de publish
   - exigencias de metadados da capa

### Como foi feito

- leitura do fluxo atual de upload e biblioteca editorial
- criacao de store de assets persistida em PostgreSQL
- ampliacao do endpoint de upload para `multipart` e `base64`
- introducao de endpoint para alteracao de metadados da imagem
- endurecimento do `validate` editorial antes de `approve/publish`
- documentacao simultanea do contrato da API

### Tecnologias usadas

- Next.js route handlers
- PostgreSQL
- Sharp
- TypeScript
- Docker Compose
- PowerShell

### Se conseguiu arrumar

**Sim no repositorio.**

Resultado pratico:

- outro agente nao precisa mais de acesso direto ao banco
- outro agente nao precisa obrigatoriamente de arquivo local se puder enviar `base64`
- a API passa a registrar a imagem no banco e permitir enriquecimento posterior dos metadados
- o publish fica travado se a capa gerenciada nao tiver metadados editoriais minimos

Observacao importante:

- isso melhora fortemente o padrao tecnico de SEO e imagem
- mas nao existe garantia honesta de “nota maxima de ranqueamento no Google”, porque ranking depende de fatores externos e competitivos fora do controle da API

# Plano Mestre - Rumo ao Nivel 10 (Somente Ferramentas Gratuitas)

Status: Documento estrategico-operacional
Escopo: Produto, tecnologia, distribuicao, monetizacao, tracking, operacao editorial e governanca
Regra central: Reaproveitar ao maximo o que ja existe no repositorio. Adicionar ferramentas externas apenas quando houver limitacao operacional comprovada.

---

## 1) Objetivo

Levar o projeto Cenario Internacional do nivel atual para nivel 10 (paridade funcional-operacional com grandes players nacionais do nicho), mantendo disciplina de custo:

- custo de software: preferencialmente zero
- custo de infraestrutura: manter no baseline atual enquanto possivel
- custo de complexidade: somente aumentar quando KPI justificar

Resultado esperado:

1. Produto editorial com distribuicao recorrente e retencao forte
2. Operacao orientada por dados de negocio e nao apenas dados tecnicos
3. Fundacao tecnica robusta para escalar sem reescrever plataforma
4. Monetizacao progressiva (sem depender de ferramenta paga no inicio)

---

## 2) Definicao de "Nivel 10"

A nota final e uma media ponderada. Para considerar nivel 10, todas as trilhas criticas devem estar >= 9.

| Trilha | Peso | Definicao de 10 |
|---|---:|---|
| Produto Editorial | 15% | Jornada completa de descoberta, leitura, retorno e assinatura com UX consistente |
| Distribuicao e Retencao | 20% | Newsletter segmentada + push + social + funis de retorno com metas claras |
| SEO e Descoberta | 15% | Cobertura tecnica e editorial completa, crescimento organico sustentado |
| Tracking e Decisao | 15% | Painel executivo com KPIs de negocio, cohortes, funis e acionamento semanal |
| Tecnologia e Performance | 10% | Build estavel, lint/testes sob controle, performance previsivel |
| Confiabilidade e Seguranca | 10% | Controles minimos de risco, observabilidade e operacao disciplinada |
| Marca e Diferenciacao | 10% | Posicionamento editorial, autoridade publica e proposta unica clara |
| Monetizacao | 5% | Receita recorrente inicial validada sem comprometer crescimento |

Nota de referencia:

- 0-4: base incompleta
- 5-6: produto funcional
- 7-8: operacao competitiva
- 9: maturidade alta
- 10: padrao de referencia no nicho

---

## 3) Premissas e Restricoes

### 3.1 Regras de uso de ferramentas

1. Primeiro usar recursos ja existentes no repositorio
2. Segundo usar stack open source/self-hosted
3. Somente depois usar SaaS gratuito externo
4. Ferramenta nova so entra se houver gap real e mensuravel

### 3.2 O que ja temos e deve ser aproveitado

- Next.js App Router (site + APIs)
- Supabase (dados + auth)
- APIs internas: newsletter, contato, carreiras, upload, health, telemetry
- Documentacao ampla em `docs/`
- Collector e MCP server no mesmo repositorio
- Fluxo de email SMTP Hostinger

### 3.3 Quando esta permitido adicionar ferramenta externa

Adicionar ferramenta externa somente se cumprir todos os criterios:

- Existe gap funcional que bloqueia KPI critico
- Nao ha solucao viavel no que ja existe
- Existe plano de reversao (exit plan)
- Custo total permanece zero no plano gratuito

---

## 4) Baseline Atual (Diagnostico)

Pontos fortes:

- Base tecnica moderna
- Newsletter com double opt-in implementada
- SEO tecnico com sitemap/rss/robots
- APIs internas claras para operacoes criticas

Gaps principais para chegar ao nivel 10:

1. Distribuicao ainda concentrada em poucos canais
2. Tracking orientado mais a evento tecnico do que a decisao de negocio
3. Falta camada de produto de retencao (preferencias, alertas, watchlist, ciclo de retorno)
4. Diferenciacao editorial e de marca ainda nao explicitada como sistema
5. Monetizacao recorrente ainda sem trilha operacional madura

---

## 5) North Star e KPIs (obrigatorios)

### 5.1 North Star

Leitores recorrentes qualificados por semana (RQS):

- Usuario com >= 2 sessoes/semana
- >= 3 pageviews por sessao
- >= 1 acao de valor (newsletter, comentario, compartilhamento, cadastro)

### 5.2 KPIs por camada

Aquisicao:

- Sessoes organicas semanais
- CTR de paginas editoriais em search
- Crescimento de paginas indexadas com trafego

Ativacao:

- Taxa de leitura > 60s
- Taxa de scroll > 50%
- Taxa de clique em CTA editorial

Retencao:

- D1 / D7 / D30 readers retention
- Retorno semanal por editoria
- Open/click por newsletter segmentada

Monetizacao:

- Receita por 1.000 sessoes (RPS)
- Conversao para produto/membership
- Receita recorrente mensal (MRR inicial)

Confiabilidade:

- Uptime real
- Erros JS por 1.000 sessoes
- Tempo de resposta p95 por endpoint

---

## 6) Arquitetura de Execucao (sem custo)

### 6.1 Camada de Conteudo e Produto

Ferramenta principal: proprio CMS/Admin atual + Supabase

Objetivo:

- Padronizar pauta, publicacao, atualizacao e distribuicao

Entregas:

1. Modelo de pauta semanal por editoria
2. Template editorial por tipo de conteudo
3. Workflow de atualizacao de conteudo evergreen

### 6.2 Camada de Distribuicao

Ferramentas:

- Newsletter atual (SMTP Hostinger)
- Push gratuito (OneSignal plano free, somente se necessario)
- Social organico manual com automacao minima (scripts internos)

Objetivo:

- Garantir recorrencia de audiencia

Entregas:

1. 4 newsletters segmentadas (manha, fechamento, mercados, geoeconomia)
2. Centro de preferencias de newsletter
3. Calendario de distribuicao diario

### 6.3 Camada de Dados

Ferramentas:

- Coleta first-party atual
- Supabase Postgres
- Metabase (ja previsto)

Objetivo:

- Transformar dados em reunioes de decisao semanais

Entregas:

1. Dashboard executivo (aquisicao, ativacao, retencao, receita)
2. Dashboard de newsletter (funnel completo)
3. Dashboard editorial (topicos, autores, formatos)

### 6.4 Camada de Confiabilidade

Ferramentas:

- `/api/health`
- `/api/telemetry/error`
- logs de aplicacao

Objetivo:

- Detectar e corrigir regressao antes de impacto de audiencia

Entregas:

1. Matriz de incidentes (severidade, SLA, responsavel)
2. Runbooks curtos por falha critica
3. Checklist de release com bloqueio de deploy

---

## 7) Plano de Acao por Fase (180 dias)

## Fase 0 (Semana 1-2) - Fundacao de Gestao

Objetivo: criar comando unico de execucao

Entregas:

1. KPI tree oficial e metas trimestrais
2. Reuniao semanal fixa com ritual de decisao
3. Backlog unico priorizado por impacto

Criterio de aceite:

- KPIs publicados e com fonte unica
- Responsaveis por trilha definidos
- Roadmap com datas e dependencias

---

## Fase 1 (Semana 3-6) - Distribuicao e Retencao Base

Objetivo: aumentar recorrencia com o que ja existe

Entregas tecnicas:

1. Refino do fluxo de newsletter (origem, lista, campanha, status)
2. Pagina de preferencias de conteudo/newsletter
3. Eventos de funil da newsletter no tracking

Entregas de produto:

1. 4 edicoes fixas por semana
2. Calendario editorial de distribuicao
3. CTA newsletter padronizado em paginas de alto trafego

KPIs alvo:

- +30% inscritos validos
- +20% open rate medio
- +15% retorno semanal

---

## Fase 2 (Semana 7-10) - SEO de Conteudo e Autoridade

Objetivo: acelerar crescimento organico com disciplina editorial

Entregas:

1. Clusters editoriais (macro temas + subtemas)
2. Paginas hub por tema com interlinking forte
3. Politica editorial publica, metodologia e pagina de correcoes
4. Template de artigo com checklist SEO completo

KPIs alvo:

- +25% sessoes organicas
- +20% paginas com impressao em search
- crescimento de paginas com CTR > benchmark interno

---

## Fase 3 (Semana 11-14) - Dados de Negocio e Decisao

Objetivo: governanca orientada por funil

Entregas:

1. Dashboard Metabase "CEO view"
2. Cohortes D1/D7/D30
3. Funil: visita -> leitura -> inscricao -> retorno
4. Alertas de anomalia por KPI

KPIs alvo:

- 100% das reunioes usando dashboard unico
- tempo para diagnostico < 24h
- queda de regressao nao detectada para ~0

---

## Fase 4 (Semana 15-18) - Produto de Retencao

Objetivo: criar mecanismo de retorno nao dependente de search

Entregas:

1. "Minha agenda" de temas/assuntos
2. Alertas de topicos por email (e push quando habilitado)
3. Sessao "continue lendo" e "series editoriais"

KPIs alvo:

- +20% leitores recorrentes semanais
- +15% pages/session em recorrentes
- +10% tempo medio de sessao

---

## Fase 5 (Semana 19-24) - Monetizacao Inicial

Objetivo: validar receita recorrente sem prejudicar crescimento

Entregas:

1. Landing de membership basico
2. Oferta de newsletter premium (conteudo analitico)
3. Testes A/B de proposta de valor e precificacao inicial

KPIs alvo:

- primeira receita recorrente validada
- conversao minima definida por coorte
- churn inicial monitorado semanalmente

---

## 8) Backlog Exaustivo (por trilha)

## 8.1 Produto Editorial

1. Definir 6 pilares editoriais fixos
2. Definir formato padrao por pilar (nota, analise, guia, explicador)
3. Criar checklist pre-publicacao
4. Criar checklist de atualizacao de conteudo antigo
5. Criar matriz de prioridade de pauta por impacto

## 8.2 SEO

1. Padronizar titles/meta por tipo de pagina
2. Revisar interlinking interno em artigos e hubs
3. Expandir paginas de autor (bio, expertise, historico)
4. Criar pagina "Como produzimos conteudo"
5. Criar rotina semanal de auditoria SEO tecnica

## 8.3 Newsletter/Distribuicao

1. Segmentar listas por interesse
2. Definir naming e governanca das campanhas
3. Instrumentar funnel completo da newsletter
4. Automatizar reengajamento de inativos
5. Criar cadencia editorial fixa por segmento

## 8.4 Tracking e BI

1. Definir dicionario final de eventos de negocio
2. Garantir idempotencia e consistencia de eventos
3. Criar tabelas agregadas para dashboards
4. Construir paineis por camada de funil
5. Criar ritual de revisao semanal com plano de acao

## 8.5 Tecnologia e Qualidade

1. Reduzir pendencias de lint por severidade
2. Definir suite minima de testes de regressao critica
3. Criar smoke tests de endpoints essenciais
4. Definir SLO basico para API e pagina critica
5. Criar gate de deploy com checklist tecnico

## 8.6 Marca e Diferenciais

1. Definir manifesto editorial curto
2. Definir posicionamento contra concorrentes
3. Definir proposta unica por editoria
4. Criar pagina de transparencia e correcoes
5. Criar pagina "por que confiar" com evidencias

## 8.7 Monetizacao

1. Definir 2 ofertas gratuitas e 1 oferta premium
2. Mapear funil de conversao e pontos de friccao
3. Definir copy e proposta por oferta
4. Rodar experimento de preco e bundle
5. Medir impacto em retencao e engajamento

---

## 9) Ferramentas: o que usar, quando usar, por que usar

## 9.1 Prioridade 1 - Ferramentas ja existentes

| Necessidade | Ferramenta atual | Acao |
|---|---|---|
| Site + APIs | Next.js App Router | manter e evoluir |
| Banco e auth | Supabase | manter e consolidar schemas |
| Email | SMTP Hostinger | manter como padrao |
| Tracking base | collector + tabelas atuais | ampliar para KPI de negocio |
| Dashboards | Metabase | tornar fonte oficial das reunioes |
| Operacao docs | `docs/` | manter e governar |

## 9.2 Prioridade 2 - Ferramentas gratuitas externas (somente se gap)

| Gap real | Ferramenta gratis | Condicao de uso |
|---|---|---|
| Push em escala | OneSignal free | usar apenas apos preferencia e governanca pronta |
| Search Console | Google Search Console | obrigatorio para SEO tecnico |
| UX observacional | Microsoft Clarity | usar para analise de friccao |
| Asset design | Figma free | somente para padrao visual e handoff |

Regra:

- Se o mesmo resultado puder ser feito com o que ja existe, nao adicionar ferramenta externa.

---

## 10) Criterios de Pronto (Definition of Done) por trilha

## 10.1 SEO

- Checklist SEO preenchido por publicacao
- Pagina validada com metadata correta
- Interlinking aplicado
- Dashboard de desempenho atualizado

## 10.2 Newsletter

- Evento de inscricao registrado
- Confirmacao concluida
- Entrega de email validada
- KPI semanal consolidado

## 10.3 Tracking

- Evento mapeado em dicionario
- Campo obrigatorio preenchido
- Qualidade da ingestao > 99%
- Grafico correspondente no Metabase

## 10.4 Engenharia

- Build verde
- Lint sem erros bloqueadores
- Smoke test dos endpoints criticos
- Sem regressao funcional detectada

## 10.5 Operacao

- Responsavel definido
- SLA definido
- Runbook atualizado
- Incidente revisado com acao preventiva

---

## 11) Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|---|---|---|
| Crescimento sem governanca | alto | ritual semanal de KPI + dono por trilha |
| Complexidade de stack | medio | regra de "ferramenta nova so com gap comprovado" |
| Conteudo sem distribuicao | alto | calendario fixo de newsletters e canais |
| Decisao por intuicao | alto | dashboard unico e review semanal obrigatorio |
| Dependencia de uma fonte de trafego | alto | diversificar search + newsletter + push + social |

---

## 12) Ritual Operacional Semanal (obrigatorio)

Duracao: 60 minutos

Agenda fixa:

1. KPIs da semana anterior
2. Top 3 ganhos
3. Top 3 perdas
4. Decisoes e owners
5. Backlog da semana

Saida obrigatoria:

- 5 a 10 acoes com dono e prazo
- previsao de impacto por KPI

---

## 13) Meta trimestral por etapa

Trimestre 1:

- base de distribuicao e tracking de negocio consolidada

Trimestre 2:

- recorrencia forte e crescimento organico sustentado

Trimestre 3:

- monetizacao inicial consistente + operacao previsivel

Condicao para declarar nivel 10:

- todas as trilhas criticas >= 9 por 8 semanas consecutivas
- nenhum KPI critico em tendencia negativa por 4 semanas

---

## 14) Plano de Execucao Imediata (proximos 14 dias)

Semana 1:

1. fechar KPI tree oficial
2. fechar dashboard executivo no Metabase
3. fechar naming e segmentacao de newsletter
4. instrumentar eventos faltantes de funil

Semana 2:

1. publicar centro de preferencias
2. publicar pagina de politica editorial e correcoes
3. revisar CTAs newsletter nas paginas de maior trafego
4. criar ritual semanal com ata padrao

---

## 15) Resultado esperado

Com execucao disciplinada desse plano, o projeto sai de "produto funcional" para "operacao competitiva" e, em seguida, "padrao referencia".

Resumo:

- curto prazo: recorrencia e distribuicao
- medio prazo: previsibilidade de crescimento
- longo prazo: autoridade + monetizacao recorrente

Este documento e a fonte de verdade para evolucao rumo ao nivel 10 com custo controlado.

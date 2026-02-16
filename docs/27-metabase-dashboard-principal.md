# Metabase Dashboard Principal (Tracking)

Data de referencia: **2026-02-16**.

## Objetivo

Definir o dashboard principal de tracking no Metabase e padronizar o uso de filtro global por dias.

## Dashboard principal

- Nome: `Tracking Completo - Executivo`
- URL: `https://metabase.cenariointernacional.com.br/dashboard/3-tracking-completo-executivo`
- Dashboard ID: `3`
- Total de cards: `20`

## Filtro global de dias

O dashboard usa um filtro global de periodo:

- Parametro do dashboard: `periodo_global`
- Tipo: `date/all-options`
- Mapeado em todos os cards (`20/20`)

Campos de data usados no mapeamento:

- `analytics_events.timestamp` (field id `448`)
- `analytics_sessions.started_at` (field id `452`)

## Padrao de modelagem aplicado nos cards

Para permitir filtro dinamico de dias, os cards usam template tag de data em SQL nativo:

- Eventos: `[[WHERE {{periodo_eventos}}]]` ou `[[AND {{periodo_eventos}}]]`
- Sessoes: `[[WHERE {{periodo_sessoes}}]]` ou `[[AND {{periodo_sessoes}}]]`

Com isso, o intervalo pode ser alterado na interface sem editar query.

## Automacao usada

Script local para aplicar em lote:

- `scripts/metabase/apply-dashboard-date-filter.py`

O script faz:

1. Atualiza queries de cards de `analytics_events` e `analytics_sessions`.
2. Adiciona `template-tags` de data por card.
3. Mapeia `periodo_global` em todos os dashcards.

## Validacao

Validacao API do dashboard:

- `mapped=20`
- `total=20`
- `params=periodo_global`
- `fields=periodo_global,periodo_eventos,periodo_sessoes`

## Observacoes operacionais

- Evitar hardcode de `NOW() - INTERVAL '90 days'` em cards que devem respeitar filtro global.
- Para novos cards do dashboard `3`, adicionar template-tag de data e mapping do `periodo_global` no momento da criacao.

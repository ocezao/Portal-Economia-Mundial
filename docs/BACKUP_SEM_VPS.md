# Backup Sem VPS/Dominio (Gratis)

Objetivo: ter um caminho simples para exportar o conteudo do Supabase (noticias, categorias, tags etc) sem depender de VPS e sem pagar ferramentas.

---

## Opcao 1 (Recomendada): Export JSON via Service Role

Arquivo: `scripts/export-supabase-content.mjs`

Requisitos:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Comando (exemplo):
```bash
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
node scripts/export-supabase-content.mjs > backup.json
```

Exportar apenas algumas tabelas:
```bash
TABLES="news_articles,categories,tags" \
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="..." \
node scripts/export-supabase-content.mjs > backup-min.json
```

Notas:
- O script pagina em blocos de 1000 linhas por tabela.
- Esse JSON nao e um dump SQL, mas resolve o essencial: conteudo e relacionamento por IDs.

---

## Opcao 2: Dump SQL (quando voce estiver com tooling pronto)

Se voce usar Supabase CLI (ou backup automatico do proprio Supabase), um dump SQL vira o mais completo.

Eu nao automatizei isso aqui porque depende do CLI/config local e do ambiente.


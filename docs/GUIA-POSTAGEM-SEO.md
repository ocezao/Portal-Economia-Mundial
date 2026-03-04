# Guia Completo para Postagem com SEO Perfeito

Guia passo a passo para criar publicações com otimização completa para SEO no Portal Econômico Mundial (CIN).

---

## 1. Visão Geral

Este guia detalha todas as etapas para criar uma publicação com SEO perfeito no CIN. O sistema possui integração nativa com Next.js que gera automaticamente:

- Meta tags (title, description, og:*, twitter:*)
- Canonical URL
- JSON-LD Structured Data (NewsArticle schema)
- Breadcrumbs estruturados
- Sitemap.xml automático
- OpenGraph e Twitter Cards

---

## 2. Categorias Disponíveis

O CIN possui 3 categorias principais, cada uma com público-alvo específico:

### Categorias Principais

| Categoria | Cor | Público-alvo | Tipo de Conteúdo |
|-----------|-----|--------------|------------------|
| **Economia** | #111111 (Preto) | Investidores, economistas, estudantes | Mercados financeiros, política monetária, comércio, indicadores |
| **Geopolítica** | #c40000 (Vermelho) | Analistas internacionais, governantes | Relações internacionais, conflitos, diplomacia, poder global |
| **Tecnologia** | #6b6b6b (Cinza) | Profissionais de tech, empreendedores | IA, cybersecurity, inovação, transformação digital |

### Subcategorias

- Relações Internacionais
- Conflitos e Segurança
- Comércio Global
- Blocos Econômicos
- Criptomoedas
- Investimentos
- Startups e Tech
- Energia e Commodities
- Política Monetária
- Mercados Financeiros

---

## 3. Passo a Passo: Criando uma Publicação

### 3.1 Acesso ao Painel Admin

1. Acesse: `https://cenariointernacional.com.br/admin`
2. Faça login com suas credenciais
3. Navegue até **Notícias** > **Nova Notícia**

---

### 3.2 Campos Obrigatórios (Aba "Conteúdo")

#### Título do Artigo

| Campo | Descrição |
|-------|-----------|
| **Nome** | Título principal |
| **Tamanho mínimo** | 10 caracteres |
| **Tamanho ideal SEO** | 50-60 caracteres |
| **Tamanho máximo** | 110 caracteres |

**Exemplo otimizado:**
```
Fed mantém juros e sinaliza cortes para 2024 em meio à desaceleração inflacionária
```

**Boas práticas:**
- Inclua a palavra-chave principal no início
- Use números quando aplicáveis (ano, porcentagem, valores)
- Seja específico e direto
- Evite "cliques bait" (titles sensacionalistas podem prejudicar trust)

---

#### Slug (URL)

| Campo | Descrição |
|-------|-----------|
| **Formato** | URL amigável |
| **Gerado** | Automático a partir do título |
| **Editável** | Sim |

**Exemplo:**
```
Título: Fed mantém juros e sinaliza cortes para 2024
Slug: fed-mantem-juros-sinaliza-cortes-2024
URL: cenariointernacional.com.br/noticias/fed-mantem-juros-sinaliza-cortes-2024
```

**Boas práticas:**
- Use apenas letras minúsculas
- Separe palavras com hifens
- Inclua palavra-chave principal
- Mantenha entre 40-60 caracteres
- Evite palavras irrelevantes (artigos, preposições)

---

#### Categoria

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Dropdown select |
| **Obrigatório** | Sim |
| **Seleção única** | Sim |

**Impacto no SEO:**
- Cria estrutura de navegação (breadcrumbs)
- URL contém a categoria: `/noticias/[slug]`
- Organiza o conteúdo para o Google entender a estrutura do site

---

#### Autor/Perfil Profissional

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Dropdown select |
| **Obrigatório** | Sim |
| **Origem** | Cadastrado em Admin > Autores |

**Por que é importante para SEO (E-E-A-T):**
- Google valoriza artigos escritos por especialistas
- O perfil do autor aparece no JSON-LD estruturado
- Credenciais do autor são exibidas na página

**Configurações do Autor (Admin > Autores):**

| Campo | Descrição | Impacto SEO |
|-------|-----------|--------------|
| Nome | Nome completo | Exibido no artigo |
| Slug | Identificador da URL | `/autor/[slug]` |
| Bio | Biografia curta | Exibida no artigo |
| Especialidades | Áreas de expertise | Schema Author |
| Editor | É editor? | Badge "Editado por" |
| Fact-Checker | É revisor? | Badge de verificação |
| Ativo | Ativo no sistema? | Exibição conditional |

**Boas práticas:**
- Sempre selecione um autor com perfil profissional completo
- Prefira autores com credenciais na área do artigo
- Mantenha os perfis de autores atualizados

---

#### Imagem de Capa

| Campo | Especificação |
|-------|----------------|
| **Formatos** | JPG, PNG |
| **Tamanho máx** | 5MB |
| **Dimensão ideal** | 1200 x 630 pixels (proporção 1.91:1) |
| **Proporção aceita** | 1.91:1 (OpenGraph/Twitter) |

**Impacto no SEO:**
- Usada no OpenGraph (Facebook)
- Usada no Twitter Card
- Aparece nos resultados do Google News
- JSON-LD inclui a imagem

**Boas práticas:**
- Use imagens de alta resolução
- Inclua texto sobreposto minimal (legível em miniaturas)
- Evite texto excessivo na imagem
- Use compressão adequada (máx 5MB)

---

#### Excerpt (Resumo)

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Textarea |
| **Tamanho** | 50-300 caracteres |
| **Tamanho ideal SEO** | 150-160 caracteres |

**Usos:**
- Meta description (Google search)
- OpenGraph description (Facebook)
- Twitter Card description
- Resumo em listagens do site

**Exemplo otimizado:**
```
O Federal Reserve manteve a taxa de juros estável nesta quarta-feira, mas sinalizou que cortes podem começar em breve...
```

**Boas práticas:**
- Inclua palavra-chave principal
- Crie um "chamariz" para o clique
- Não use aspas (podem quebrar o HTML)
- Evite duplicar o título

---

#### Conteúdo do Artigo

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Editor de texto rico |
| **Tamanho mínimo SEO** | 1000 caracteres |
| **Tamanho recomendado** | 1500-3000 caracteres |

**Ferramentas de Formatação:**

| Botão | Função | HTML Gerado |
|-------|--------|--------------|
| H2 | Subtítulo nível 2 | `<h2>` |
| H3 | Subtítulo nível 3 | `<h3>` |
| **B** | Negrito | `<strong>` |
| *I* | Itálico | `<em>` |
| Quote | Citação em bloco | `<blockquote>` |
| • | Lista não ordenada | `<ul>` |
| 🔗 | Link | `<a href>` |

**Boas práticas para SEO:**
- Use apenas UM H1 (geralmente o título)
- Use H2 para seções principais
- Use H3 para subseções
- Inclua links internos para outros artigos relevantes
- Adicione links externos para fontes oficiais
- Inclua dados, estatísticas e fontes

---

### 3.3 Configurações de Publicação (Aba "Publicação")

#### Modo de Publicação

| Opção | Descrição | Quando usar |
|-------|-----------|--------------|
| **Publicar Agora** | Publica imediatamente | Artigo pronto |
| **Agendar** | Define data/hora futura | Lançamentos programados |

#### Configurações de Agendamento (se "Agendar" selecionado)

| Campo | Descrição |
|-------|-----------|
| **Data** | Data futura para publicação |
| **Hora** | Horário específico |
| **Fuso Horário** | America/Sao_Paulo (GMT-3) |

**Sugestões rápidas:**
- Amanhã
- Depois de amanhã
- Próxima semana

**Boas práticas:**
- Agende para horários de alto tráfico (9:00, 12:00, 18:00)
- Considere o fuso horário do público-alvo

#### Opções Adicionais

| Campo | Descrição | Impacto SEO |
|-------|-----------|--------------|
| **Destacar na home** | Appears na seção de destaque | Prioridade no sitemap (0.9) |
| **Marcar como Urgente** | Breaking news | Badge "URGENTE", prioridade (0.9) |

---

### 3.4 SEO Avançado (Aba "SEO")

Esta aba contém campos específicos para otimização de motores de busca:

#### SEO Title

| Campo | Descrição |
|-------|-----------|
| **Tamanho ideal** | 50-60 caracteres |
| **Padrão** | Se vazio, usa o título do artigo |

**Diferença do título:**
- Pode ser diferente do título principal
- Otimizado para aparecer completo nos resultados
- Pode incluir palavra-chave de cauda longa

**Exemplo:**
```
Título: Análise: Decisão do Fed sobre juros
SEO Title: Fed mantém juros: o que isso significa para seus investimentos em 2024
```

---

#### SEO Description

| Campo | Descrição |
|-------|-----------|
| **Tamanho ideal** | 150-160 caracteres |
| **Padrão** | Se vazio, usa o excerpt |

**Exemplo:**
```
Decisão do Federal Reserve sobre juros impacta mercados globais. Entenda o que esperar para dólar, bolsa e investimentos.
```

---

#### Palavras-chave / Tags

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Tag input |
| **Mínimo recomendado** | 3-5 keywords |
| **Formato** | Separadas por vírgula |

**Tags rápidas disponíveis:**

| Categoria | Tags |
|-----------|------|
| Economia | Fed, BCB, Inflação, Juros, Dólar, PIB, IPCA |
| Mercado Financeiro | Bolsa, Ações, Ouro, Câmbio |
| Criptomoedas | Bitcoin, Ethereum, Cripto |
| Política | EUA, China, UE, Brasil |
| Energia | Petróleo, Gás, Energia renovável |
| Opinião | Análise, Opinião, Destaque |

**Boas práticas:**
- Inclua a palavra-chave principal
- Adicione variações da keyword
- Use tags de cauda longa
- Não exagere (5-10 é suficiente)

---

#### FAQ Schema (Schema.org)

| Campo | Descrição |
|-------|-----------|
| **Tipo** | Construtor de Q&A |
| **Formato** | Múltiplos pares pergunta/resposta |

**Benefícios:**
- Appears como "Rich Results" no Google
- Aumenta CTR nos resultados de busca
- Mostra frequentemente na posição 0

**Exemplo:**

| Pergunta | Resposta |
|----------|----------|
| Quando o Fed vai cortar os juros? | O Fed sinalizou cortes para... |
| Como a decisão afeta o Brasil? | A decisão impacta... |

---

### 3.5 Preview e Validação

O sistema oferece painéis de preview em tempo real:

#### Análise SEO em Tempo Real

| Indicador | Status |
|-----------|--------|
| ✓ Title length | 50-60 caracteres (verde) |
| ✓ Description length | 150-160 caracteres (verde) |
| ✓ Keyword count | Mínimo 3 (verde) |
| ✓ Content length | Mínimo 1000 caracteres (verde) |

#### Previews Disponíveis

- **Google Search Preview**: Como aparecerá no Google
- **Facebook/OpenGraph Preview**: Como aparecerá no Facebook
- **Twitter Card Preview**: Como aparecerá no Twitter

---

## 4. O Que Acontece Automaticamente

Ao publicar um artigo, o sistema faz automaticamente:

### 4.1 Meta Tags

```html
<title>Título do Artigo</title>
<meta name="description" content="SEO Description...">
<meta property="og:title" content="Título do Artigo">
<meta property="og:description" content="SEO Description...">
<meta property="og:image" content="URL da Imagem de Capa">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Título do Artigo">
<meta name="twitter:description" content="SEO Description...">
<meta name="twitter:image" content="URL da Imagem de Capa">
```

### 4.2 Canonical URL

```html
<link rel="canonical" href="https://cenariointernacional.com.br/noticias/slug-do-artigo">
```

Previne problemas de conteúdo duplicado.

### 4.3 JSON-LD Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Título do Artigo",
  "description": "SEO Description...",
  "image": "URL da Imagem",
  "datePublished": "2024-01-15T09:00:00Z",
  "dateModified": "2024-01-15T12:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Nome do Autor",
    "url": "https://cenariointernacional.com.br/autor/slug-autor"
  },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "Cenario Internacional",
    "logo": {
      "@type": "ImageObject",
      "url": "https://cenariointernacional.com.br/logo.png"
    }
  },
  "keywords": "tag1, tag2, tag3",
  "articleSection": "Economia",
  "inLanguage": "pt-BR",
  "isAccessibleForFree": true,
  "wordCount": 1500
}
```

### 4.4 Breadcrumbs JSON-LD

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://cenariointernacional.com.br/"},
    {"@type": "ListItem", "position": 2, "name": "Economia", "item": "https://cenariointernacional.com.br/categoria/economia"},
    {"@type": "ListItem", "position": 3, "name": "Título do Artigo"}
  ]
}
```

### 4.5 Sitemap.xml

O artigo é automaticamente adicionado ao `sitemap.xml` com:

| Propriedade | Valor |
|-------------|-------|
| URL | `/noticias/[slug]` |
| LastMod | Data de publicação/atualização |
| Changefreq | weekly |
| Priority | 0.9 (featured/breaking), 0.7 (normal) |

### 4.6 Robots.txt

O artigo é automaticamente indexável:

- `/noticias/*` ✅ permitido
- `/admin/*` ❌ bloqueado
- `/api/*` ❌ bloqueado

---

## 5. Checklist de SEO Perfeito

Use esta lista antes de publicar:

### ✅ Conteúdo

- [ ] Título com 50-60 caracteres
- [ ] Título inclui palavra-chave principal
- [ ] Slug é curto e inclui keyword
- [ ] Categoria correta selecionada
- [ ] Excerpt com 150-160 caracteres
- [ ] Conteúdo com mínimo 1000 caracteres
- [ ] Usou headings (H2, H3) corretamente
- [ ] Incluiu links internos
- [ ] Incluiu fontes externas

### ✅ SEO

- [ ] SEO Title definido (50-60 chars)
- [ ] SEO Description definida (150-160 chars)
- [ ] Mínimo 3-5 keywords/tags
- [ ] FAQ Schema preenchido (opcional)

### ✅ Imagens

- [ ] Imagem de capa uploadada
- [ ] Imagem com dimensões corretas (1200x630)
- [ ] Imagem com menos de 5MB

### ✅ Autor e Atribuição

- [ ] Autor selecionado
- [ ] Perfil do autor está completo
- [ ] Autor tem credenciais na área

### ✅ Publicação

- [ ] Modo de publicação correto
- [ ] Se agendado, data/hora correta
- [ ] Opções de destaque configuradas

---

## 6. Configurações E-E-A-T

E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) é crucial para o Google avaliar a qualidade do conteúdo.

### 6.1 Autor

**Campos importantes no perfil do autor:**

| Campo | Descrição |
|-------|-----------|
| Nome | Nome completo |
| Bio | Biografia profissional |
| Especialidades | Áreas de expertise |
| Credenciais | Formação, certificados |
| Premiações | Prêmios recebidos |
| Social | Links profissionais (LinkedIn, Twitter) |

### 6.2 Fact-Checker

Se o artigo foi revisado por um fact-checker:

1. Marque o autor como "Fact-Checker" em Admin > Autores
2. O sistema adiciona automaticamente o badge ao artigo
3. O JSON-LD inclui `reviewedBy`

### 6.3 Editor Chefe

Para artigos editoriais:

1. Configure o usuário como "Editor Chefe"
2. Use a tag "Opinião" quando aplicável
3. Adicione nota editorial no excerpt

---

## 7. Boas Práticas por Tipo de Conteúdo

### 7.1 Notícia de Última Hora (Breaking News)

- Use "Marcar como Urgente"
- Seja rápido mas verifique fontes
- Atualize com novas informações
- Use data/hora no título quando relevante

### 7.2 Análise/Opinião

- Use tag "Análise" ou "Opinião"
- Inclua credenciais do autor
- Seja transparente sobre opiniãos
- Use FAQ Schema para aprofundar

### 7.3 Cobertura Contínua

- Agrupe artigos relacionados
- Use tags consistentes
- Crie série com "[Parte X]"
- Link entre artigos da série

### 7.4 Conteúdo Patrocinado

- Use tag "Publicação Patrocinada"
- Inclua aviso no início do conteúdo
- Mantenha transparência com leitores

---

## 8. Troubleshooting

### Problema: Artigo não aparece no Google

**Verificações:**
1. Verifique se está "publicado" (não "rascunho" ou "agendado")
2. Aguarde até 24-48 horas para indexação inicial
3. Verifique no Google Search Console
4. Confirme que robots.txt permite indexação

### Problema: Título aparece diferente no Google

**Solução:**
- Use o campo "SEO Title" para customizar
- Mantenha entre 50-60 caracteres

### Problema: Imagem não aparece no Facebook/Twitter

**Verificações:**
1. Verifique tamanho (mín 200x200)
2. Verifique formato (jpg, png)
3. Use debugger do Facebook: https://developers.facebook.com/tools/debug/
4. Use Card Validator do Twitter: https://cards-dev.twitter.com/validator

---

## 9. Referências Rápidas

### Tamanhos Ideais

| Elemento | Tamanho Ideal |
|----------|----------------|
| Título | 50-60 caracteres |
| SEO Title | 50-60 caracteres |
| Excerpt | 150-160 caracteres |
| SEO Description | 150-160 caracteres |
| Imagem de capa | 1200x630px (máx 5MB) |
| Conteúdo | 1500-3000 caracteres |
| Tags | 3-10 keywords |

### URLs do Sistema

| Página | URL |
|--------|-----|
| Admin | `/admin` |
| Nova Notícia | `/admin/noticias/novo` |
| Editar Notícia | `/admin/noticias/editar/[slug]` |
| Autores | `/admin/autores` |
| Artigo | `/noticias/[slug]` |
| Categoria | `/categoria/[slug]` |
| Autor | `/autor/[slug]` |
| RSS | `/rss.xml` |
| Sitemap | `/sitemap.xml` |

---

## 10. Próximos Passos

Após criar o artigo:

1. **Aguarde a publicação** (se agendado) ou publique imediatamente
2. **Monitore no Google Search Console** - Verifique se foi indexado
3. **Compartilhe nas redes sociais** - O OpenGraph já está configurado
4. **Acompanhe métricas** - Views, cliques, posição nos resultados

---

*Documento atualizado em: 2026-02-27*
*Versão: 1.0*

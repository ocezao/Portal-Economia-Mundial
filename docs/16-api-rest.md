# Documentação da API REST - Portal Econômico Mundial

## Visão Geral

Esta documentação descreve todos os endpoints da API REST do Portal Econômico Mundial, incluindo especificações OpenAPI, exemplos de uso e guias de integração.

---

## 1. Especificação OpenAPI

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: Portal Econômico Mundial API
  description: |
    API REST para o Portal Econômico Mundial.
    
    ## Autenticação
    A API utiliza JWT Bearer tokens para autenticação.
    
    ## Rate Limiting
    - Limite padrão: 100 requisições/minuto
    - Limite autenticado: 1000 requisições/minuto
    
    ## Versionamento
    A versão atual da API é v1.
  version: 1.0.0
  contact:
    name: API Support
    email: api@portaleconomicomundial.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.portaleconomicomundial.com/v1
    description: Produção
  - url: https://api-staging.portaleconomicomundial.com/v1
    description: Staging
  - url: http://localhost:3000/v1
    description: Desenvolvimento

security:
  - bearerAuth: []

paths:
  # Autenticação
  /auth/login:
    post:
      summary: Login de usuário
      description: Autentica um usuário e retorna tokens de acesso
      tags:
        - Autenticação
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
            examples:
              exemplo:
                summary: Login válido
                value:
                  email: "usuario@exemplo.com"
                  password: "senha123"
      responses:
        '200':
          description: Login bem-sucedido
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Credenciais inválidas
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/register:
    post:
      summary: Cadastro de usuário
      description: Cria uma nova conta de usuário
      tags:
        - Autenticação
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: Usuário criado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RegisterResponse'
        '400':
          description: Dados inválidos
        '409':
          description: Email já existe

  /auth/refresh:
    post:
      summary: Renovar token
      description: Obtém um novo access token usando refresh token
      tags:
        - Autenticação
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refresh_token
              properties:
                refresh_token:
                  type: string
      responses:
        '200':
          description: Token renovado
        '401':
          description: Refresh token inválido

  /auth/logout:
    post:
      summary: Logout
      description: Invalida o token de acesso atual
      tags:
        - Autenticação
      responses:
        '204':
          description: Logout bem-sucedido

  # Artigos
  /articles:
    get:
      summary: Listar artigos
      description: Retorna lista paginada de artigos
      tags:
        - Artigos
      security: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
            maximum: 50
        - name: category
          in: query
          schema:
            type: string
            enum: [economia, geopolitica, tecnologia]
        - name: search
          in: query
          description: Termo de busca
          schema:
            type: string
        - name: sort
          in: query
          schema:
            type: string
            enum: [newest, oldest, popular]
            default: newest
      responses:
        '200':
          description: Lista de artigos
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ArticleListResponse'

  /articles/{slug}:
    get:
      summary: Obter artigo por slug
      description: Retorna detalhes completos de um artigo
      tags:
        - Artigos
      security: []
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Artigo encontrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ArticleDetail'
        '404':
          description: Artigo não encontrado

  /articles/{id}/comments:
    get:
      summary: Listar comentários
      description: Retorna comentários de um artigo
      tags:
        - Comentários
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Lista de comentários
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommentList'

    post:
      summary: Adicionar comentário
      description: Adiciona um novo comentário ao artigo
      tags:
        - Comentários
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - content
              properties:
                content:
                  type: string
                  minLength: 10
                  maxLength: 1000
      responses:
        '201':
          description: Comentário criado
        '400':
          description: Conteúdo inválido
        '429':
          description: Muitos comentários (cooldown)

  # Usuário
  /user/profile:
    get:
      summary: Perfil do usuário
      description: Retorna dados do perfil do usuário logado
      tags:
        - Usuário
      responses:
        '200':
          description: Perfil do usuário
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'

    patch:
      summary: Atualizar perfil
      description: Atualiza dados do perfil do usuário
      tags:
        - Usuário
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProfileRequest'
      responses:
        '200':
          description: Perfil atualizado
        '400':
          description: Dados inválidos

  /user/bookmarks:
    get:
      summary: Listar favoritos
      description: Retorna artigos favoritados pelo usuário
      tags:
        - Usuário
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Lista de favoritos

    post:
      summary: Adicionar favorito
      description: Adiciona um artigo aos favoritos
      tags:
        - Usuário
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - article_id
              properties:
                article_id:
                  type: string
                  format: uuid
      responses:
        '201':
          description: Favorito adicionado
        '409':
          description: Já está nos favoritos

  /user/reading-history:
    get:
      summary: Histórico de leitura
      description: Retorna histórico de artigos lidos
      tags:
        - Usuário
      responses:
        '200':
          description: Histórico de leitura

  # Analytics
  /analytics/collect:
    post:
      summary: Coletar evento
      description: Endpoint para envio de eventos de analytics
      tags:
        - Analytics
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AnalyticsEvent'
      responses:
        '204':
          description: Evento aceito
        '400':
          description: Evento inválido
        '429':
          description: Rate limit excedido

  # Admin
  /admin/users:
    get:
      summary: Listar usuários (Admin)
      description: Retorna lista de usuários para administração
      tags:
        - Admin
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: role
          in: query
          schema:
            type: string
            enum: [user, admin]
      responses:
        '200':
          description: Lista de usuários
        '403':
          description: Sem permissão

    post:
      summary: Criar usuário (Admin)
      description: Cria um novo usuário
      tags:
        - Admin
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: Usuário criado

  /admin/articles:
    post:
      summary: Criar artigo (Admin)
      description: Cria um novo artigo
      tags:
        - Admin
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateArticleRequest'
      responses:
        '201':
          description: Artigo criado

    patch:
      summary: Atualizar artigo (Admin)
      description: Atualiza um artigo existente
      tags:
        - Admin
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateArticleRequest'
      responses:
        '200':
          description: Artigo atualizado

  /admin/analytics/generate:
    post:
      summary: Gerar notícia com IA (Admin)
      description: Gera uma notícia usando GNews + OpenRouter
      tags:
        - Admin
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                topic:
                  type: string
                  description: Tema específico da notícia
                category:
                  type: string
                  enum: [economia, geopolitica, tecnologia]
                questions:
                  type: string
                  description: Perguntas a serem respondidas no texto
      responses:
        '200':
          description: Notícia gerada
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GeneratedArticle'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # Requests
    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8

    RegisterRequest:
      type: object
      required:
        - name
        - email
        - password
      properties:
        name:
          type: string
          minLength: 3
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$'

    UpdateProfileRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 3
        bio:
          type: string
          maxLength: 500
        avatar_url:
          type: string
          format: uri

    CreateArticleRequest:
      type: object
      required:
        - title
        - content
        - category
      properties:
        title:
          type: string
        subtitle:
          type: string
        content:
          type: string
        excerpt:
          type: string
        category:
          type: string
          enum: [economia, geopolitica, tecnologia]
        tags:
          type: array
          items:
            type: string
        seo_title:
          type: string
        seo_description:
          type: string

    # Responses
    LoginResponse:
      type: object
      properties:
        access_token:
          type: string
        refresh_token:
          type: string
        expires_in:
          type: integer
        user:
          $ref: '#/components/schemas/User'

    RegisterResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string

    ArticleListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/ArticleSummary'
        pagination:
          $ref: '#/components/schemas/Pagination'

    ArticleDetail:
      type: object
      properties:
        id:
          type: string
        slug:
          type: string
        title:
          type: string
        subtitle:
          type: string
        content:
          type: string
        excerpt:
          type: string
        category:
          type: string
        tags:
          type: array
          items:
            type: string
        author:
          $ref: '#/components/schemas/Author'
        published_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        read_time:
          type: integer
        image_url:
          type: string
        related_articles:
          type: array
          items:
            $ref: '#/components/schemas/ArticleSummary'

    ArticleSummary:
      type: object
      properties:
        id:
          type: string
        slug:
          type: string
        title:
          type: string
        excerpt:
          type: string
        category:
          type: string
        author:
          $ref: '#/components/schemas/Author'
        published_at:
          type: string
          format: date-time
        read_time:
          type: integer
        image_url:
          type: string

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
        name:
          type: string
        role:
          type: string
          enum: [user, admin]
        avatar_url:
          type: string

    UserProfile:
      allOf:
        - $ref: '#/components/schemas/User'
        - type: object
          properties:
            bio:
              type: string
            created_at:
              type: string
              format: date-time
            bookmarks_count:
              type: integer
            reading_history_count:
              type: integer

    Author:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        slug:
          type: string
        avatar_url:
          type: string

    Comment:
      type: object
      properties:
        id:
          type: string
        content:
          type: string
        author:
          $ref: '#/components/schemas/Author'
        created_at:
          type: string
          format: date-time
        likes_count:
          type: integer

    CommentList:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Comment'
        pagination:
          $ref: '#/components/schemas/Pagination'

    Pagination:
      type: object
      properties:
        current_page:
          type: integer
        total_pages:
          type: integer
        total_items:
          type: integer
        items_per_page:
          type: integer
        has_next:
          type: boolean
        has_previous:
          type: boolean

    AnalyticsEvent:
      type: object
      required:
        - v
        - event
        - timestamp
        - url
      properties:
        v:
          type: string
          description: Versão do schema
          example: "1.0.0"
        event:
          type: string
          description: Nome do evento
          example: "page_view"
        user_id:
          type: string
          format: uuid
          nullable: true
        session_id:
          type: string
          format: uuid
          nullable: true
        anonymous:
          type: boolean
          default: false
        timestamp:
          type: integer
          description: Timestamp em milliseconds
        url:
          type: string
          format: uri
        referrer:
          type: string
          format: uri
        properties:
          type: object
          additionalProperties: true

    GeneratedArticle:
      type: object
      properties:
        title:
          type: string
        subtitle:
          type: string
        seo_title:
          type: string
        seo_description:
          type: string
        tags:
          type: array
          items:
            type: string
        excerpt:
          type: string
        content_html:
          type: string
        category:
          type: string
        sources:
          type: array
          items:
            type: object
            properties:
              title:
                type: string
              url:
                type: string
              source:
                type: string
              publishedAt:
                type: string

    # Error
    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        code:
          type: string
        details:
          type: object
```

---

## 2. Endpoints Detalhados

### 2.1 Autenticação

#### POST /auth/login

**Descrição:** Autentica um usuário e retorna tokens JWT.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Responses:**

**200 OK**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@exemplo.com",
    "name": "João Silva",
    "role": "user",
    "avatar_url": "https://..."
  }
}
```

**401 Unauthorized**
```json
{
  "error": "invalid_credentials",
  "message": "Email ou senha inválidos"
}
```

**429 Too Many Requests**
```json
{
  "error": "rate_limit_exceeded",
  "message": "Muitas tentativas. Tente novamente em 5 minutos."
}
```

---

#### POST /auth/register

**Descrição:** Cria uma nova conta de usuário.

**Validações:**
- Email deve ser único
- Senha mínimo 8 caracteres
- Senha deve conter maiúscula, minúscula e número
- Nome mínimo 3 caracteres

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "Senha123!"
}
```

**Responses:**

**201 Created**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "joao@exemplo.com",
  "message": "Usuário criado com sucesso"
}
```

**400 Bad Request**
```json
{
  "error": "validation_error",
  "message": "Dados inválidos",
  "details": {
    "password": "A senha deve conter pelo menos uma letra maiúscula"
  }
}
```

**409 Conflict**
```json
{
  "error": "email_exists",
  "message": "Este email já está cadastrado"
}
```

---

### 2.2 Artigos

#### GET /articles

**Descrição:** Lista artigos com filtros e paginação.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| page | integer | Não | Página atual (default: 1) |
| limit | integer | Não | Itens por página (default: 10, max: 50) |
| category | string | Não | Filtrar por categoria |
| search | string | Não | Termo de busca no título/conteúdo |
| sort | string | Não | Ordenação: newest, oldest, popular |
| author | string | Não | Filtrar por slug do autor |
| tags | string | Não | Tags separadas por vírgula |

**Exemplo de Request:**
```bash
curl -X GET "https://api.portaleconomicomundial.com/v1/articles?page=1&limit=20&category=economia&sort=popular" \
  -H "Accept: application/json"
```

**Response 200 OK:**
```json
{
  "data": [
    {
      "id": "1",
      "slug": "guerra-comercial-2024",
      "title": "Guerra Comercial 2024: Impactos Globais",
      "excerpt": "Análise dos efeitos das novas tarifas comerciais...",
      "category": "economia",
      "author": {
        "id": "1",
        "name": "Maria Silva",
        "slug": "maria-silva",
        "avatar_url": "https://..."
      },
      "published_at": "2024-01-15T10:30:00Z",
      "read_time": 8,
      "image_url": "https://.../image.webp"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_items": 195,
    "items_per_page": 20,
    "has_next": true,
    "has_previous": false
  }
}
```

---

#### GET /articles/{slug}

**Descrição:** Retorna detalhes completos de um artigo.

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| slug | string | Slug único do artigo |

**Response 200 OK:**
```json
{
  "id": "1",
  "slug": "guerra-comercial-2024",
  "title": "Guerra Comercial 2024: Impactos Globais",
  "subtitle": "Como as novas políticas tarifárias afetam o mercado",
  "content": "<p>Conteúdo completo em HTML...</p>",
  "excerpt": "Resumo do artigo...",
  "category": "economia",
  "tags": ["china", "eua", "comércio", "tarifas"],
  "author": {
    "id": "1",
    "name": "Maria Silva",
    "slug": "maria-silva",
    "avatar_url": "https://...",
    "bio": "Jornalista especializada em economia..."
  },
  "published_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:20:00Z",
  "read_time": 8,
  "image_url": "https://.../image.webp",
  "related_articles": [
    {
      "id": "2",
      "slug": "impacto-dolar-2024",
      "title": "Impacto do Dólar em 2024",
      "category": "economia"
    }
  ],
  "seo": {
    "title": "Guerra Comercial 2024 | Portal Econômico Mundial",
    "description": "Análise completa dos impactos...",
    "keywords": "guerra comercial, tarifas, economia"
  }
}
```

---

### 2.3 Comentários

#### POST /articles/{id}/comments

**Descrição:** Adiciona um comentário ao artigo.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Rate Limit:** Máximo 1 comentário a cada 30 segundos por usuário.

**Request Body:**
```json
{
  "content": "Excelente análise! Concordo com os pontos apresentados sobre o impacto nas commodities."
}
```

**Validações:**
- Mínimo 10 caracteres
- Máximo 1000 caracteres
- Não pode conter palavras ofensivas (filtro automático)

**Response 201 Created:**
```json
{
  "id": "comment-123",
  "content": "Excelente análise! Concordo com os pontos apresentados sobre o impacto nas commodities.",
  "author": {
    "id": "user-123",
    "name": "João Silva",
    "avatar_url": "https://..."
  },
  "created_at": "2024-01-15T10:30:00Z",
  "likes_count": 0
}
```

**Response 429 Too Many Requests:**
```json
{
  "error": "rate_limit",
  "message": "Aguarde 30 segundos para comentar novamente",
  "retry_after": 25
}
```

---

### 2.4 Analytics

#### POST /analytics/collect

**Descrição:** Endpoint para coleta de eventos de analytics.

**Headers:**
```
Content-Type: application/json
```

**Rate Limit:** 100 eventos/minuto por IP (anônimo), 1000/minuto autenticado.

**Request Body:**
```json
{
  "v": "1.0.0",
  "event": "page_view",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "anonymous": false,
  "timestamp": 1705312800000,
  "url": "https://portaleconomicomundial.com/noticias/guerra-comercial-2024",
  "referrer": "https://google.com",
  "properties": {
    "page_type": "article",
    "category": "economia",
    "article_id": "guerra-comercial-2024"
  }
}
```

**Response:**
- `204 No Content` - Evento aceito
- `400 Bad Request` - Payload inválido
- `429 Too Many Requests` - Rate limit excedido

**Eventos Suportados:**

| Evento | Descrição | Propriedades |
|--------|-----------|--------------|
| page_view | Visualização de página | page_type, category |
| article_read_start | Início de leitura | article_id, trigger |
| article_read_progress | Progresso de leitura | article_id, scroll_depth |
| article_read_complete | Leitura completa | article_id, time_spent |
| session_start | Início de sessão | traffic_source |
| session_end | Fim de sessão | duration_seconds |
| scroll_depth | Profundidade de scroll | depth_percent |
| click | Clique em elemento | target_type, target_id |
| error_js | Erro JavaScript | message, source, line |
| web_vital | Core Web Vitals | name, value, rating |

---

## 3. Autenticação e Autorização

### 3.1 JWT Bearer Token

Todas as rotas protegidas requerem o header:

```
Authorization: Bearer <access_token>
```

### 3.2 Refresh Token

Quando o access token expira (1 hora), use o refresh token:

```bash
curl -X POST https://api.portaleconomicomundial.com/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJhbGciOiJIUzI1NiIs..."}'
```

### 3.3 Roles e Permissões

| Role | Permissões |
|------|------------|
| `user` | Ler artigos, comentar, favoritar, perfil |
| `admin` | Todas as permissões + CRUD usuários, artigos, analytics |

---

## 4. Rate Limiting

### 4.1 Limites por Endpoint

| Endpoint | Anônimo | Autenticado |
|----------|---------|-------------|
| GET /articles | 100/min | 1000/min |
| POST /auth/login | 5/min | - |
| POST /comments | - | 2/min |
| POST /analytics/collect | 100/min | 1000/min |
| POST /admin/* | - | 100/min |

### 4.2 Headers de Rate Limit

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705316400
```

### 4.3 Resposta de Rate Limit Excedido

```json
{
  "error": "rate_limit_exceeded",
  "message": "Limite de requisições excedido",
  "retry_after": 45
}
```

---

## 5. Versionamento da API

### 5.1 Estratégia

A API segue versionamento semântico na URL:
- Versão atual: `v1`
- URL base: `/v1`

### 5.2 Depreciação

Novas versões são anunciadas com 6 meses de antecedência.

Headers de depreciação:
```
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
Link: </v2/articles>; rel="successor-version"
```

### 5.3 Changelog da API

| Versão | Data | Mudanças |
|--------|------|----------|
| v1.0 | 2024-01 | Lançamento inicial |
| v1.1 | 2024-02 | Adicionado endpoint de analytics |

---

## 6. Tratamento de Erros

### 6.1 Estrutura de Erro Padrão

```json
{
  "error": "código_do_erro",
  "message": "Descrição legível do erro",
  "code": "ERR_001",
  "details": {
    "field": "descrição do erro no campo"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req-123-abc"
}
```

### 6.2 Códigos de Status HTTP

| Status | Uso |
|--------|-----|
| 200 | Sucesso (GET, PATCH) |
| 201 | Criado com sucesso (POST) |
| 204 | Sucesso sem corpo (DELETE) |
| 400 | Request inválido |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (duplicado) |
| 422 | Validação falhou |
| 429 | Rate limit |
| 500 | Erro interno |

---

## 7. SDKs e Clientes

### 7.1 JavaScript/TypeScript

```bash
npm install @pem/api-client
```

```typescript
import { PEMClient } from '@pem/api-client';

const client = new PEMClient({
  baseURL: 'https://api.portaleconomicomundial.com/v1',
  apiKey: 'sua-api-key'
});

// Login
const { user, accessToken } = await client.auth.login({
  email: 'user@example.com',
  password: 'senha123'
});

// Listar artigos
const articles = await client.articles.list({
  category: 'economia',
  page: 1,
  limit: 20
});

// Enviar evento de analytics
await client.analytics.track({
  event: 'page_view',
  properties: {
    page_type: 'article',
    article_id: 'slug-do-artigo'
  }
});
```

### 7.2 cURL Exemplos

```bash
# Login
curl -X POST https://api.portaleconomicomundial.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'

# Listar artigos
curl -X GET "https://api.portaleconomicomundial.com/v1/articles?category=economia&page=1" \
  -H "Accept: application/json"

# Comentar (autenticado)
curl -X POST https://api.portaleconomicomundial.com/v1/articles/123/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Excelente artigo!"}'

# Analytics
curl -X POST https://api.portaleconomicomundial.com/v1/analytics/collect \
  -H "Content-Type: application/json" \
  -d '{
    "v": "1.0.0",
    "event": "page_view",
    "timestamp": '$(date +%s%3N)',
    "url": "https://portaleconomicomundial.com/",
    "properties": {"page_type": "home"}
  }'
```

---

## 8. Checklist de Integração

- [ ] Obter credenciais de API (desenvolvimento)
- [ ] Implementar autenticação JWT
- [ ] Implementar refresh token automático
- [ ] Tratar erros de rate limit (backoff exponencial)
- [ ] Implementar cache de respostas quando apropriado
- [ ] Validar todos os inputs antes de enviar
- [ ] Implementar retry para erros 5xx
- [ ] Monitorar métricas de uso da API

---

**Versão da API:** 1.0.0  
**Última atualização:** 2024-02-04  
**Status:** Estável

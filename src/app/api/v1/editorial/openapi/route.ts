import { jsonResponse } from '@/lib/server/adminApi';

const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Editorial API',
    version: '1.2.0',
    description: 'API editorial voltada para automacoes e agentes LLM criarem, revisarem, publicarem e agendarem posts.',
  },
  servers: [
    { url: '/api/v1/editorial' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    schemas: {
      EditorialMeta: {
        type: 'object',
        properties: {
          requestId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string' },
        },
      },
      EditorialSuccessEnvelope: {
        type: 'object',
        required: ['ok', 'data', 'meta'],
        properties: {
          ok: { type: 'boolean', const: true },
          data: { type: 'object', additionalProperties: true },
          meta: { '$ref': '#/components/schemas/EditorialMeta' },
        },
      },
      EditorialErrorEnvelope: {
        type: 'object',
        required: ['ok', 'error', 'meta'],
        properties: {
          ok: { type: 'boolean', const: false },
          error: {
            type: 'object',
            required: ['message', 'code'],
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              details: {},
            },
          },
          meta: { '$ref': '#/components/schemas/EditorialMeta' },
        },
      },
      EditorialEnvelope: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          data: { type: 'object', additionalProperties: true },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              details: {},
            },
          },
          meta: {
            type: 'object',
            properties: {
              requestId: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' },
            },
          },
        },
      },
      EditorialSource: {
        type: 'object',
        required: ['sourceName'],
        properties: {
          sourceType: { type: 'string', default: 'reference' },
          sourceName: { type: 'string' },
          sourceUrl: { type: 'string' },
          publisher: { type: 'string' },
          country: { type: 'string' },
          language: { type: 'string' },
          accessedAt: { type: 'string', format: 'date-time' },
        },
      },
      EditorialFaqItem: {
        type: 'object',
        required: ['question', 'answer'],
        properties: {
          question: { type: 'string' },
          answer: { type: 'string' },
        },
      },
      EditorialArticlePayload: {
        type: 'object',
        required: ['title', 'slug', 'excerpt', 'content', 'category', 'authorId', 'coverImage'],
        properties: {
          title: { type: 'string', description: 'Headline principal do artigo.' },
          slug: { type: 'string', description: 'Slug unico e publico da URL.' },
          seoTitle: { type: 'string', description: 'Titulo SEO. Obrigatorio para publicar. Faixa recomendada: 45-65 caracteres.' },
          excerpt: { type: 'string', description: 'Resumo editorial curto usado em cards, feed e support snippets.' },
          metaDescription: { type: 'string', description: 'Descricao SEO. Obrigatoria para publicar. Faixa recomendada: 140-170 caracteres.' },
          content: { type: 'string', description: 'Conteudo completo em HTML sanitizavel.' },
          category: { type: 'string', description: 'Categoria editorial valida retornada por /meta.' },
          authorId: { type: 'string', description: 'Slug do autor ativo retornado por /meta.' },
          author: { type: 'string' },
          tags: {
            type: 'array',
            description: 'Obrigatorio para publicar. Use pelo menos 3 tags editoriais especificas.',
            items: { type: 'string' },
          },
          coverImage: {
            type: 'string',
            description: 'Use data.file.url returned by /uploads or a publicUrl from /uploads/library. External URLs are rejected.',
            example: '/uploads/2026/04/capa.webp',
          },
          featured: { type: 'boolean' },
          breaking: { type: 'boolean' },
          readingTime: { type: 'integer' },
          views: { type: 'integer' },
          likes: { type: 'integer' },
          shares: { type: 'integer' },
          comments: { type: 'integer' },
          faqItems: {
            type: 'array',
            description: 'Pacote AEO do artigo. Obrigatorio para publicar. Use pelo menos 2 pares pergunta/resposta.',
            items: { '$ref': '#/components/schemas/EditorialFaqItem' },
          },
          editorialStatus: { type: 'string' },
          sources: {
            type: 'array',
            description: 'Obrigatorio para publicar. Inclua fontes editoriais e a atribuicao da imagem quando a capa nao for first-party.',
            items: { '$ref': '#/components/schemas/EditorialSource' },
          },
          status: { type: 'string', enum: ['draft', 'scheduled', 'published'] },
          publishedAt: { type: ['string', 'null'], format: 'date-time' },
        },
      },
      EditorialWorkflowNote: {
        type: 'object',
        properties: {
          create: { type: 'string', example: 'Articles must be created as draft.' },
          approve: { type: 'string', example: 'Approval requires validate without errors.' },
          publish: { type: 'string', example: 'Publish and schedule require approved article and persisted sources.' },
        },
      },
    },
    responses: {
      Success: {
        description: 'Envelope padrao de sucesso',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/EditorialSuccessEnvelope' },
          },
        },
      },
      Unauthorized: {
        description: 'Credencial editorial ausente ou invalida',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/EditorialErrorEnvelope' },
            examples: {
              unauthorized: {
                value: {
                  ok: false,
                  error: { message: 'Nao autorizado', code: 'UNAUTHORIZED' },
                  meta: { requestId: 'uuid', timestamp: '2026-04-01T12:00:00.000Z', version: '1.2.0' },
                },
              },
            },
          },
        },
      },
      ValidationRequired: {
        description: 'Fluxo editorial fora de ordem ou pendencias de validacao',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/EditorialErrorEnvelope' },
            examples: {
              validationRequired: {
                value: {
                  ok: false,
                  error: {
                    message: 'Artigo nao esta apto para publicacao; execute validate e corrija os erros antes de publicar ou agendar',
                    code: 'VALIDATION_REQUIRED',
                  },
                  meta: { requestId: 'uuid', timestamp: '2026-04-01T12:00:00.000Z', version: '1.2.0' },
                },
              },
              workflowConflict: {
                value: {
                  ok: false,
                  error: {
                    message: 'Fluxo editorial exige criacao inicial como draft',
                    code: 'WORKFLOW_CONFLICT',
                  },
                  meta: { requestId: 'uuid', timestamp: '2026-04-01T12:00:00.000Z', version: '1.2.0' },
                },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Entidade editorial nao encontrada',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/EditorialErrorEnvelope' },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  paths: {
    '/meta': {
      get: {
        summary: 'Retorna autores, categorias e enumeracoes editoriais',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth': {
      get: {
        summary: 'Verifica se a credencial editorial recebida esta valida',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/readiness': {
      get: {
        summary: 'Retorna readiness operacional da API editorial para agentes',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/context/market': {
      get: {
        summary: 'Retorna contexto economico resumido para enriquecer artigos e posts',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/slug': {
      get: {
        summary: 'Valida ou gera um slug',
        parameters: [
          { name: 'value', in: 'query', schema: { type: 'string' } },
          { name: 'title', in: 'query', schema: { type: 'string' } },
          { name: 'excludeSlug', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          400: { '$ref': '#/components/responses/ValidationRequired' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/articles': {
      get: {
        summary: 'Lista artigos com filtros e paginacao',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
      post: {
        summary: 'Cria um artigo',
        description: 'O fluxo editorial exige criacao inicial como draft. Use coverImage local de /uploads ou /images, nunca URL externa.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/EditorialArticlePayload' },
            },
          },
        },
        responses: {
          201: { '$ref': '#/components/responses/Success' },
          400: { '$ref': '#/components/responses/ValidationRequired' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          409: { '$ref': '#/components/responses/ValidationRequired' },
        },
      },
    },
    '/articles/{id}': {
      get: {
        summary: 'Busca um artigo por id ou slug',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'lookup', in: 'query', schema: { type: 'string', enum: ['id', 'slug'] } },
        ],
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Atualiza um artigo',
        description: 'Nao use PATCH para publicar ou agendar. Status final deve passar por approve + publish/schedule.',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          400: { '$ref': '#/components/responses/ValidationRequired' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/articles/{id}/validate': {
      get: {
        summary: 'Valida prontidao editorial do artigo',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/articles/{id}/approve': {
      post: {
        summary: 'Marca o artigo como aprovado editorialmente',
        description: 'Aprovacao exige artigo validado sem erros estruturais.',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
          409: { '$ref': '#/components/responses/ValidationRequired' },
        },
      },
    },
    '/articles/{id}/enrich': {
      post: {
        summary: 'Enriquece SEO/FAQ de um artigo armazenado',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/articles/{id}/seo-audit': {
      get: {
        summary: 'Audita SEO/AEO do artigo e sugere melhorias',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/articles/{id}/internal-links': {
      get: {
        summary: 'Sugere links internos relevantes para o artigo',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 20 } },
        ],
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/articles/{id}/similar': {
      get: {
        summary: 'Lista artigos semanticamente parecidos para evitar duplicidade',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 20 } },
        ],
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/articles/{id}/publish': {
      post: {
        summary: 'Publica imediatamente um artigo',
        description: 'Publicacao exige artigo aprovado, validado sem erros e com fontes persistidas.',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
          409: { '$ref': '#/components/responses/ValidationRequired' },
        },
      },
    },
    '/articles/{id}/schedule': {
      post: {
        summary: 'Agenda publicacao futura',
        description: 'Agendamento exige artigo aprovado, validado sem erros e com fontes persistidas.',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
          409: { '$ref': '#/components/responses/ValidationRequired' },
        },
      },
    },
    '/articles/{id}/sources': {
      post: {
        summary: 'Adiciona uma fonte editorial',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/EditorialSource' },
            },
          },
        },
        responses: {
          201: { '$ref': '#/components/responses/Success' },
          400: { '$ref': '#/components/responses/ValidationRequired' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/articles/{id}/sources/{sourceId}': {
      delete: {
        summary: 'Remove uma fonte editorial',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
          404: { '$ref': '#/components/responses/NotFound' },
        },
      },
    },
    '/jobs': {
      get: {
        summary: 'Lista jobs editoriais',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          400: { '$ref': '#/components/responses/ValidationRequired' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/jobs/dispatch': {
      post: {
        summary: 'Processa jobs editoriais elegiveis',
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/uploads': {
      post: {
        summary: 'Faz upload de imagem e retorna URL publica',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  width: { type: 'integer' },
                  height: { type: 'integer' },
                  quality: { type: 'integer' },
                  watermark: { type: 'boolean' },
                  keepMetadata: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          400: { '$ref': '#/components/responses/ValidationRequired' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/uploads/library': {
      get: {
        summary: 'Lista arquivos disponiveis no storage local editorial',
        parameters: [
          { name: 'dir', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200 } },
        ],
        responses: {
          200: { '$ref': '#/components/responses/Success' },
          401: { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  'x-auth-notes': [
    'A API aceita Authorization Bearer e x-api-key.',
    'A chave precisa ser provisionada externamente via EDITORIAL_API_KEY.',
    'Esta API nao possui endpoint para emissao automatica de credenciais.',
  ],
  'x-agent-contract': {
    draftRequired: ['title', 'slug', 'excerpt', 'content', 'category', 'authorId', 'coverImage'],
    publishRequired: ['seoTitle', 'metaDescription', 'tags', 'faqItems', 'sources', 'approved status', 'resolvable local coverImage'],
    publishQualityThresholds: {
      minTags: 3,
      minFaqItems: 2,
      imageSourceRule: 'If the cover image came from a third party, include its attribution inside sources.',
    },
    contentPackage: {
      mandatoryBeforePublish: ['title', 'excerpt', 'content', 'category', 'authorId', 'coverImage', 'seoTitle', 'metaDescription', 'tags', 'faqItems', 'sources'],
      aeoFields: ['faqItems', 'seoTitle', 'metaDescription', 'internalLinks review', 'seoAudit review'],
      geoContextRule: 'For economia, macroeconomia, mercados, moedas, comercio-global and geopolitica, call /context/market before writing or enriching.',
    },
    coverImageRules: [
      'Call /uploads or /uploads/library before create/update.',
      'Do not send external coverImage URLs.',
      'If you have a same-site absolute URL, the API normalizes it to a local path.',
    ],
  },
  'x-workflow': {
    create: 'draft only',
    requiredSequence: [
      'auth',
      'readiness',
      'meta',
      'context.market',
      'slug',
      'uploads.library',
      'uploads',
      'articles.create',
      'articles.similar',
      'sources.add',
      'articles.enrich',
      'articles.seo_audit',
      'articles.internal_links',
      'articles.validate',
      'articles.approve',
      'articles.publish_or_schedule',
      'jobs.list',
    ],
  },
};

export async function GET() {
  return jsonResponse(openApiDocument);
}

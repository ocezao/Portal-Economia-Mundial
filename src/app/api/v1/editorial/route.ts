import { editorialSuccess } from '@/lib/server/editorialHttp';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const basePath = '/api/v1/editorial';

  return editorialSuccess({
    name: 'Editorial API',
    version: '1.2.0',
    docs: `${basePath}/openapi`,
    endpoints: {
      auth: `${basePath}/auth`,
      meta: `${basePath}/meta`,
      readiness: `${basePath}/readiness`,
      marketContext: `${basePath}/context/market`,
      articles: `${basePath}/articles`,
      articleById: `${basePath}/articles/{id}`,
      seoAudit: `${basePath}/articles/{id}/seo-audit`,
      internalLinks: `${basePath}/articles/{id}/internal-links`,
      similar: `${basePath}/articles/{id}/similar`,
      validate: `${basePath}/articles/{id}/validate`,
      approve: `${basePath}/articles/{id}/approve`,
      enrich: `${basePath}/articles/{id}/enrich`,
      publish: `${basePath}/articles/{id}/publish`,
      schedule: `${basePath}/articles/{id}/schedule`,
      sources: `${basePath}/articles/{id}/sources`,
      slug: `${basePath}/slug?title=Seu%20titulo`,
      uploads: `${basePath}/uploads`,
      uploadLibrary: `${basePath}/uploads/library`,
      uploadMetadata: `${basePath}/uploads`,
      jobs: `${basePath}/jobs`,
      dispatchJobs: `${basePath}/jobs/dispatch`,
    },
    authentication: {
      supported: ['Authorization: Bearer <EDITORIAL_API_KEY>', 'x-api-key: <EDITORIAL_API_KEY>'],
      notes: [
        'Sessao admin same-origin continua aceita.',
        'Rotas de escrita exigem autenticacao editorial.',
        'A chave deve ser provisionada no servidor via EDITORIAL_API_KEY; a API nao emite chaves automaticamente.',
        'Nao publique por PATCH alterando status; use validate + approve + publish/schedule.',
        'coverImage deve vir de /api/v1/editorial/uploads ou /api/v1/editorial/uploads/library.',
        'Imagens em /uploads exigem metadados editoriais antes de publicar: title, alt, caption e credit.',
      ],
    },
    contract: {
      createDraftRequired: ['title', 'slug', 'excerpt', 'content', 'category', 'authorId', 'coverImage'],
      publishRequired: ['seoTitle', 'metaDescription', 'tags', 'faqItems', 'sources', 'approved article', 'valid local coverImage'],
      publishQualityThresholds: {
        minTags: 3,
        minFaqItems: 2,
        minSources: 2,
        minContentChars: 1200,
        imageSourceRule: 'If the cover image came from a third party, include its attribution inside sources.',
        coverImageMetadata: ['titleText', 'altText', 'caption', 'creditText'],
      },
      contentPackage: {
        mandatoryBeforePublish: ['title', 'excerpt', 'content', 'category', 'authorId', 'coverImage', 'seoTitle', 'metaDescription', 'tags', 'faqItems', 'sources'],
        aeoFields: ['faqItems', 'seoTitle', 'metaDescription', 'internalLinks review', 'seoAudit review'],
        geoContextRule: 'For economia, macroeconomia, mercados, moedas, comercio-global and geopolitica, call /context/market before writing or enriching.',
      },
      recommendedSequence: [
        'auth',
        'readiness',
        'meta',
        'uploads.library or uploads',
        'articles.create',
        'sources.add',
        'articles.enrich',
        'articles.validate',
        'articles.approve',
        'articles.publish or articles.schedule',
      ],
    },
    serverTime: new Date().toISOString(),
    host: url.origin,
  });
}

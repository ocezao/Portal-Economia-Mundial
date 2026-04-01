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
      jobs: `${basePath}/jobs`,
      dispatchJobs: `${basePath}/jobs/dispatch`,
    },
    authentication: {
      supported: ['Authorization: Bearer <EDITORIAL_API_KEY>', 'x-api-key: <EDITORIAL_API_KEY>'],
      notes: [
        'Sessao admin same-origin continua aceita.',
        'Rotas de escrita exigem autenticacao editorial.',
        'A chave deve ser provisionada no servidor via EDITORIAL_API_KEY; a API nao emite chaves automaticamente.',
      ],
    },
    serverTime: new Date().toISOString(),
    host: url.origin,
  });
}

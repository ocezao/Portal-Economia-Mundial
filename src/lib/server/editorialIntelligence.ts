import { query } from '@/lib/db';
import { ensureUploadsDir, listStoredFiles } from '@/lib/server/fileStorage';
import { getEditorialArticle } from '@/lib/server/editorialAdmin';
import { enrichEditorialArticle } from '@/services/editorialEnrichment';
import { getLatestArticles, type NewsArticle } from '@/services/newsManager';
import {
  getCommoditiesSnapshot,
  getEconomicCalendarNext7DaysSnapshot,
  getEarningsNext7DaysSnapshot,
  getGlobalIndicesSnapshot,
  getMarketNewsSnapshot,
  getSectorsSnapshot,
} from '@/services/economics/snapshots';

type LookupMode = 'id' | 'slug';

interface SimilarCandidate {
  id: string;
  slug: string;
  title: string;
  category: string;
  score: number;
  reasons: string[];
  publishedAt: string;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length >= 3);
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function jaccardScore(a: string[], b: string[]) {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((item) => setB.has(item)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  return intersection / union;
}

function extractArticleCategory(article: Awaited<ReturnType<typeof getEditorialArticle>>) {
  const first = article.news_article_categories?.[0];
  if (
    first &&
    typeof first === 'object' &&
    'categories' in first &&
    first.categories &&
    typeof first.categories === 'object' &&
    'slug' in first.categories &&
    typeof first.categories.slug === 'string'
  ) {
    return first.categories.slug;
  }

  return 'economia';
}

function extractArticleFaqCount(article: Awaited<ReturnType<typeof getEditorialArticle>>) {
  return Array.isArray(article.faq_items) ? article.faq_items.length : 0;
}

function buildSimilarityScore(target: Awaited<ReturnType<typeof getEditorialArticle>>, candidate: NewsArticle) {
  const targetTitleTokens = unique(tokenize(target.title));
  const targetExcerptTokens = unique(tokenize(`${target.excerpt} ${target.meta_description ?? ''}`));
  const candidateTitleTokens = unique(tokenize(candidate.title));
  const candidateExcerptTokens = unique(tokenize(`${candidate.excerpt} ${candidate.metaDescription ?? ''}`));

  const titleSimilarity = jaccardScore(targetTitleTokens, candidateTitleTokens);
  const excerptSimilarity = jaccardScore(targetExcerptTokens, candidateExcerptTokens);
  const sameCategory = extractArticleCategory(target) === candidate.category;

  let score = titleSimilarity * 0.72 + excerptSimilarity * 0.28;
  if (sameCategory) score += 0.08;

  const reasons: string[] = [];
  if (sameCategory) reasons.push('Mesma categoria editorial');
  if (titleSimilarity >= 0.3) reasons.push('Titulo com sobreposicao semantica');
  if (excerptSimilarity >= 0.2) reasons.push('Resumo/conteudo inicial com tema parecido');
  if (candidate.tags.some((tag) => tokenize(target.title).includes(normalizeText(tag)))) {
    reasons.push('Tag relacionada ao tema principal');
  }

  return { score: Number(score.toFixed(4)), reasons };
}

export async function getEditorialSimilarArticles(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  limit = 5,
) {
  const article = await getEditorialArticle(null, identifier, lookup);
  const latest = await getLatestArticles(250);

  const candidates: SimilarCandidate[] = latest
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => {
      const similarity = buildSimilarityScore(article, candidate);
      return {
        id: candidate.id,
        slug: candidate.slug,
        title: candidate.title,
        category: candidate.category,
        score: similarity.score,
        reasons: similarity.reasons,
        publishedAt: candidate.publishedAt,
      };
    })
    .filter((candidate) => candidate.score >= 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: extractArticleCategory(article),
    },
    items: candidates,
  };
}

export async function getEditorialInternalLinkSuggestions(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  limit = 5,
) {
  const article = await getEditorialArticle(null, identifier, lookup);
  const related = await getEditorialSimilarArticles(null, identifier, lookup, Math.max(limit * 2, 10));

  const items = related.items
    .filter((candidate) => candidate.slug !== article.slug)
    .slice(0, limit)
    .map((candidate) => ({
      slug: candidate.slug,
      title: candidate.title,
      anchor: candidate.title,
      reason: candidate.reasons[0] ?? 'Relacionado ao mesmo contexto editorial',
      score: candidate.score,
    }));

  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
    },
    items,
  };
}

export async function getEditorialSeoAudit(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
) {
  const article = await getEditorialArticle(null, identifier, lookup);
  const category = extractArticleCategory(article);
  const seoTitle = article.seo_title ?? '';
  const metaDescription = article.meta_description ?? '';
  const faqCount = extractArticleFaqCount(article);
  const sourceCount = Array.isArray(article.article_sources) ? article.article_sources.length : 0;
  const contentText = String(article.content ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt = String(article.excerpt ?? '').trim();

  const issues: { code: string; severity: 'error' | 'warning' | 'info'; message: string; field?: string }[] = [];

  if (!seoTitle) {
    issues.push({ code: 'MISSING_SEO_TITLE', severity: 'warning', message: 'seoTitle ausente', field: 'seoTitle' });
  } else if (seoTitle.length > 60) {
    issues.push({ code: 'SEO_TITLE_TOO_LONG', severity: 'warning', message: 'seoTitle acima de 60 caracteres', field: 'seoTitle' });
  }

  if (!metaDescription) {
    issues.push({
      code: 'MISSING_META_DESCRIPTION',
      severity: 'warning',
      message: 'metaDescription ausente',
      field: 'metaDescription',
    });
  } else if (metaDescription.length > 160) {
    issues.push({
      code: 'META_DESCRIPTION_TOO_LONG',
      severity: 'warning',
      message: 'metaDescription acima de 160 caracteres',
      field: 'metaDescription',
    });
  }

  if (excerpt.length < 110) {
    issues.push({ code: 'EXCERPT_TOO_SHORT', severity: 'warning', message: 'excerpt curto para snippets ricos', field: 'excerpt' });
  }

  if (faqCount < 3) {
    issues.push({ code: 'FAQ_COVERAGE_LOW', severity: 'warning', message: 'FAQ com menos de 3 itens', field: 'faqItems' });
  }

  if (sourceCount < 2) {
    issues.push({ code: 'SOURCE_COVERAGE_LOW', severity: 'warning', message: 'Menos de 2 fontes persistidas', field: 'sources' });
  }

  if (contentText.length < 1200) {
    issues.push({ code: 'CONTENT_BODY_SHORT', severity: 'info', message: 'Corpo do artigo curto para contexto aprofundado', field: 'content' });
  }

  if (!/brasil|b3|ibovespa|real|banco central|bc\b/i.test(`${article.title} ${excerpt} ${contentText}`)) {
    issues.push({
      code: 'BRAZIL_ANGLE_WEAK',
      severity: 'info',
      message: 'Angulo Brasil nao aparece com clareza no titulo, excerpt ou conteudo inicial',
      field: 'content',
    });
  }

  const enrichmentPreview = enrichEditorialArticle({
    title: article.title,
    excerpt,
    content: String(article.content ?? ''),
    category,
    seoTitle: seoTitle || undefined,
    metaDescription: metaDescription || undefined,
    faqItems: Array.isArray(article.faq_items) ? article.faq_items : [],
  });

  const internalLinks = await getEditorialInternalLinkSuggestions(null, identifier, lookup, 5);

  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      category,
      status: article.status,
      editorialStatus: article.editorial_status,
    },
    checks: {
      seoTitleLength: seoTitle.length,
      metaDescriptionLength: metaDescription.length,
      excerptLength: excerpt.length,
      contentLength: contentText.length,
      faqCount,
      sourceCount,
      internalLinkCandidates: internalLinks.items.length,
    },
    issues,
    suggestions: {
      seoTitle: enrichmentPreview.seoTitle,
      metaDescription: enrichmentPreview.metaDescription,
      faqItems: enrichmentPreview.faqItems,
      internalLinks: internalLinks.items,
    },
  };
}

export async function getEditorialMarketContext() {
  const [indices, commodities, sectors, marketNews, economicCalendar, earnings] = await Promise.all([
    getGlobalIndicesSnapshot(),
    getCommoditiesSnapshot(),
    getSectorsSnapshot(),
    getMarketNewsSnapshot('general'),
    getEconomicCalendarNext7DaysSnapshot(),
    getEarningsNext7DaysSnapshot(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    indices: indices.slice(0, 8),
    commodities: commodities.slice(0, 6),
    sectors: sectors.slice(0, 8),
    marketNews: marketNews.slice(0, 10),
    economicCalendar: economicCalendar.slice(0, 10),
    earnings: earnings.slice(0, 10),
  };
}

export async function getEditorialReadiness() {
  const checks = {
    database: { ok: false, error: null as string | null },
    uploads: { ok: false, rootReady: false },
    editorialApiKey: Boolean(process.env.EDITORIAL_API_KEY),
    cronSecret: Boolean(process.env.CRON_API_SECRET),
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  };

  try {
    await query('select 1');
    checks.database.ok = true;
  } catch (error) {
    checks.database.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  try {
    await ensureUploadsDir();
    checks.uploads.ok = true;
    checks.uploads.rootReady = true;
  } catch {
    checks.uploads.ok = false;
    checks.uploads.rootReady = false;
  }

  const jobCounts = await query(
    `select status, count(*)::int as total
     from article_jobs
     group by status`,
  ).catch(() => ({ rows: [] as { status: string; total: number }[] }));

  const pendingJobs = jobCounts.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = Number(row.total ?? 0);
    return acc;
  }, {});

  const ready =
    checks.database.ok &&
    checks.uploads.ok &&
    checks.editorialApiKey &&
    checks.cronSecret &&
    checks.siteUrl;

  return {
    ready,
    generatedAt: new Date().toISOString(),
    checks,
    jobs: pendingJobs,
  };
}

export async function listEditorialUploadLibrary(options?: {
  dir?: string;
  search?: string;
  limit?: number;
}) {
  const dir = options?.dir ?? '';
  const search = normalizeText(options?.search ?? '');
  const limit = options?.limit ?? 50;

  const files = await listStoredFiles(dir);
  const filtered = files
    .filter((file) => (search ? normalizeText(`${file.name} ${file.path}`).includes(search) : true))
    .sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')))
    .slice(0, limit);

  return {
    dir,
    search: options?.search ?? null,
    total: filtered.length,
    items: filtered,
  };
}

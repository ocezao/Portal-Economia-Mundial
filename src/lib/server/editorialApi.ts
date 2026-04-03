import { z } from 'zod';

import { ALL_CATEGORIES } from '@/config/routes';
import { getActiveAuthors } from '@/services/authors';
import { generateSlug, getArticlesPaginated, isSlugAvailable } from '@/services/newsManager';
import type { EditorialPayload } from '@/lib/server/editorialAdmin';

const trimmedString = z.string().trim();

const optionalTrimmedString = z
  .union([trimmedString, z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') return value ?? undefined;
    return value.length > 0 ? value : undefined;
  });

const optionalIsoDate = z
  .union([trimmedString.datetime({ offset: true }), z.null()])
  .optional();

const optionalBoolean = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });

const optionalInteger = z
  .union([z.number().int(), trimmedString.regex(/^\d+$/)])
  .optional()
  .transform((value) => {
    if (typeof value === 'string') return Number.parseInt(value, 10);
    return value;
  });

export const editorialFaqItemSchema = z.object({
  question: trimmedString.min(1).max(280),
  answer: trimmedString.min(1).max(4_000),
});

export const editorialSourceSchema = z.object({
  sourceType: optionalTrimmedString,
  sourceName: trimmedString.min(1).max(160),
  sourceUrl: optionalTrimmedString,
  publisher: optionalTrimmedString,
  country: optionalTrimmedString,
  language: optionalTrimmedString,
  accessedAt: optionalIsoDate,
});

export const editorialSourcePayloadSchema = editorialSourceSchema;

export const editorialApprovePayloadSchema = z.object({
  note: optionalTrimmedString,
});

export const editorialSchedulePayloadSchema = z.object({
  publishedAt: trimmedString.datetime({ offset: true }),
});

export const editorialPublishPayloadSchema = z.object({
  publishedAt: optionalIsoDate,
});

export const editorialArticlePayloadSchema = z.object({
  title: optionalTrimmedString,
  slug: optionalTrimmedString,
  seoTitle: optionalTrimmedString,
  excerpt: optionalTrimmedString,
  metaDescription: optionalTrimmedString,
  content: optionalTrimmedString,
  category: optionalTrimmedString,
  authorId: optionalTrimmedString,
  author: optionalTrimmedString,
  tags: z.array(trimmedString.min(1).max(64)).max(24).optional(),
  coverImage: optionalTrimmedString,
  featured: optionalBoolean,
  breaking: optionalBoolean,
  readingTime: optionalInteger,
  views: optionalInteger,
  likes: optionalInteger,
  shares: optionalInteger,
  comments: optionalInteger,
  faqItems: z.array(editorialFaqItemSchema).max(20).optional(),
  editorialStatus: optionalTrimmedString,
  sources: z.array(editorialSourceSchema).max(50).optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  publishedAt: optionalIsoDate,
});

export const editorialListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: optionalTrimmedString,
  category: optionalTrimmedString,
  status: z.enum(['all', 'published', 'breaking', 'featured', 'scheduled', 'draft']).default('all'),
  author: optionalTrimmedString,
  dateFrom: optionalTrimmedString,
  dateTo: optionalTrimmedString,
  sortBy: z.enum(['date', 'views', 'likes']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const editorialSlugQuerySchema = z.object({
  value: optionalTrimmedString,
  title: optionalTrimmedString,
  excludeSlug: optionalTrimmedString,
});

export const editorialJobsQuerySchema = z.object({
  status: optionalTrimmedString,
  jobType: optionalTrimmedString,
  articleId: optionalTrimmedString,
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'body';
    return `${path}: ${issue.message}`;
  }).join('; ');
}

export function parseEditorialPayload(input: unknown): EditorialPayload {
  return editorialArticlePayloadSchema.parse(input) as EditorialPayload;
}

export function parseEditorialSourcePayload(input: unknown) {
  return editorialSourcePayloadSchema.parse(input);
}

export function parseEditorialApprovePayload(input: unknown) {
  return editorialApprovePayloadSchema.parse(input);
}

export function parseEditorialSchedulePayload(input: unknown) {
  return editorialSchedulePayloadSchema.parse(input);
}

export function parseEditorialPublishPayload(input: unknown) {
  return editorialPublishPayloadSchema.parse(input);
}

export async function getEditorialMeta() {
  const [authors, categories] = await Promise.all([
    getActiveAuthors(),
    Promise.resolve(
      ALL_CATEGORIES.map((category) => ({
        slug: category.slug,
        name: category.name,
        description: category.description,
        color: category.color,
      })),
    ),
  ]);

  return {
    statuses: ['draft', 'scheduled', 'published'] as const,
    editorialStatuses: [
      'draft',
      'generated',
      'enriched',
      'review_pending',
      'approved',
      'scheduled',
      'published',
      'distribution_pending',
      'archived',
    ] as const,
    categories,
    authors: authors.map((author) => ({
      slug: author.slug,
      name: author.name,
      shortName: author.shortName,
      title: author.title,
      isActive: author.isActive,
      photo: author.photo,
      expertise: author.expertise,
    })),
    contract: {
      createDraftRequired: ['title', 'slug', 'excerpt', 'content', 'category', 'authorId', 'coverImage'],
      publishRequired: [
        'seoTitle',
        'metaDescription',
        'tags',
        'faqItems',
        'sources',
        'approved editorial status',
        'coverImage resolvable in /uploads or /images',
      ],
      coverImageRules: [
        'Use /api/v1/editorial/uploads to send a new file and reuse data.file.url.',
        'Or pick an existing asset from /api/v1/editorial/uploads/library.',
        'External coverImage URLs are rejected.',
        'Absolute URLs from the same site are normalized to local paths.',
      ],
      workflow: [
        'auth',
        'readiness',
        'meta',
        'uploads.library or uploads',
        'articles.create as draft',
        'sources.add',
        'articles.enrich',
        'articles.validate',
        'articles.approve',
        'articles.publish or articles.schedule',
      ],
    },
  };
}

export async function listEditorialArticles(query: Record<string, string | string[] | undefined>) {
  const parsed = editorialListQuerySchema.parse({
    page: typeof query.page === 'string' ? query.page : undefined,
    perPage: typeof query.perPage === 'string' ? query.perPage : undefined,
    search: typeof query.search === 'string' ? query.search : undefined,
    category: typeof query.category === 'string' ? query.category : undefined,
    status: typeof query.status === 'string' ? query.status : undefined,
    author: typeof query.author === 'string' ? query.author : undefined,
    dateFrom: typeof query.dateFrom === 'string' ? query.dateFrom : undefined,
    dateTo: typeof query.dateTo === 'string' ? query.dateTo : undefined,
    sortBy: typeof query.sortBy === 'string' ? query.sortBy : undefined,
    sortOrder: typeof query.sortOrder === 'string' ? query.sortOrder : undefined,
  });

  const result = await getArticlesPaginated(
    {
      search: parsed.search,
      category: parsed.category,
      status: parsed.status,
      author: parsed.author,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    },
    parsed.page,
    parsed.perPage,
    { includeDrafts: true },
  );

  return {
    filters: parsed,
    ...result,
  };
}

export async function checkEditorialSlug(query: Record<string, string | string[] | undefined>) {
  const parsed = editorialSlugQuerySchema.parse({
    value: typeof query.value === 'string' ? query.value : undefined,
    title: typeof query.title === 'string' ? query.title : undefined,
    excludeSlug: typeof query.excludeSlug === 'string' ? query.excludeSlug : undefined,
  });

  const candidate = parsed.value ?? (parsed.title ? generateSlug(parsed.title) : undefined);
  if (!candidate) {
    throw new Error('Informe value ou title para gerar o slug');
  }

  const available = await isSlugAvailable(candidate, parsed.excludeSlug);
  return {
    slug: candidate,
    available,
    excludeSlug: parsed.excludeSlug,
  };
}

export function parseEditorialJobsQuery(query: Record<string, string | string[] | undefined>) {
  return editorialJobsQuerySchema.parse({
    status: typeof query.status === 'string' ? query.status : undefined,
    jobType: typeof query.jobType === 'string' ? query.jobType : undefined,
    articleId: typeof query.articleId === 'string' ? query.articleId : undefined,
    limit: typeof query.limit === 'string' ? query.limit : undefined,
  });
}

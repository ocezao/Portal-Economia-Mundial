import {
  approveArticleApi,
  checkEditorialSlugApi,
  createArticleApi,
  publishArticleNowApi,
  scheduleExistingArticleApi,
  updateArticleApi,
  validateArticleApi,
  type ArticleFaqItem,
  type ArticlePayload,
  type ArticleSource,
} from '@/services/articleApi';

export function normalizeFaqItems(items: ArticleFaqItem[]) {
  return items
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer);
}

export function normalizeSources(items: ArticleSource[]) {
  return items
    .map((item) => ({
      sourceType: item.sourceType?.trim() || 'reference',
      sourceName: item.sourceName.trim(),
      sourceUrl: item.sourceUrl?.trim() || undefined,
      publisher: item.publisher?.trim() || undefined,
      country: item.country?.trim() || undefined,
      language: item.language?.trim() || undefined,
      accessedAt: item.accessedAt?.trim() || undefined,
    }))
    .filter((item) => item.sourceName);
}

export function formatValidationIssues(
  issues: { severity: 'error' | 'warning'; message: string; field?: string }[],
) {
  return issues
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.field ? `${issue.field}: ${issue.message}` : issue.message)
    .join('; ');
}

export async function isEditorialSlugAvailable(slug: string, excludeSlug?: string) {
  const result = await checkEditorialSlugApi({ value: slug, excludeSlug });
  return Boolean((result as { available?: boolean }).available);
}

export function buildScheduledAtIso(
  scheduledDate: string,
  scheduledTime: string,
  timezone = 'America/Sao_Paulo',
) {
  if (timezone === 'America/Sao_Paulo') {
    return `${scheduledDate}T${scheduledTime}:00-03:00`;
  }

  return new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
}

export function getLocalScheduleParts(isoDate: string, timezone = 'America/Sao_Paulo') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(new Date(isoDate));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

interface PersistOptions {
  currentSlug?: string;
  articleData: ArticlePayload;
  mode: 'publish' | 'schedule';
  publishedAt?: string;
}

export async function persistEditorialArticle({
  currentSlug,
  articleData,
  mode,
  publishedAt,
}: PersistOptions) {
  if (currentSlug) {
    await updateArticleApi(currentSlug, articleData);
  } else {
    await createArticleApi({
      ...articleData,
      status: 'draft',
      editorialStatus: 'draft',
    });
  }

  const targetSlug = articleData.slug;
  const validation = await validateArticleApi(targetSlug);
  if (!validation.readyToPublish) {
    throw new Error(formatValidationIssues(validation.issues) || 'Artigo nao esta apto para publicacao');
  }

  await approveArticleApi(targetSlug);

  if (mode === 'schedule') {
    if (!publishedAt) throw new Error('publishedAt obrigatorio para agendamento');
    return scheduleExistingArticleApi(targetSlug, publishedAt);
  }

  return publishArticleNowApi(targetSlug, publishedAt);
}

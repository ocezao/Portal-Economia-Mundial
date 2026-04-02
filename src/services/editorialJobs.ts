import { withTransaction } from '@/lib/db';

interface DispatchResult {
  processed: number;
  published: number;
  failed: number;
}

interface ArticleJobRow {
  id: string;
  article_id: string;
  job_type: string;
  status: string;
  run_after: string | null;
  attempts: number | null;
}

export async function dispatchDueEditorialJobs(limit = 25): Promise<DispatchResult> {
  const jobs = await withTransaction(async (client) => {
    const locked = await client.query<ArticleJobRow>(
      `select id, article_id, job_type, status, run_after, attempts
       from article_jobs
       where status = 'queued'
         and run_after <= now()
       order by run_after asc nulls last
       limit $1
       for update skip locked`,
      [limit],
    );

    for (const job of locked.rows) {
      await client.query(
        `update article_jobs
         set status = 'running',
             attempts = $1,
             updated_at = now()
         where id = $2`,
        [(job.attempts ?? 0) + 1, job.id],
      );
    }

    return locked.rows;
  });

  let published = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      await withTransaction(async (client) => {
        if (job.job_type === 'publish_article') {
          const publishResult = await client.query(
            `update news_articles
             set status = 'published',
                 editorial_status = 'published',
                 published_at = coalesce(published_at, $2::timestamptz, now())
             where id = $1
               and status = 'scheduled'`,
            [job.article_id, job.run_after],
          );
          if ((publishResult.rowCount ?? 0) > 0) {
            published += 1;
          }
        }

        await client.query(
          `update article_jobs
           set status = 'completed',
               result = $1::jsonb,
               last_error = null,
               updated_at = now()
           where id = $2`,
          [JSON.stringify({ processedAt: new Date().toISOString() }), job.id],
        );
      });
    } catch (jobError) {
      failed += 1;
      await withTransaction(async (client) => {
        await client.query(
          `update article_jobs
           set status = 'failed',
               last_error = $1,
               updated_at = now()
           where id = $2`,
          [jobError instanceof Error ? jobError.message : String(jobError), job.id],
        );
      });
    }
  }

  return {
    processed: jobs.length,
    published,
    failed,
  };
}

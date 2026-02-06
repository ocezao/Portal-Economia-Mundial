/**
 * Batch insert with deduplication
 */

import { createHash } from 'crypto';
import { pool } from './index';

interface AnalyticsEvent {
  v: string;
  event: string;
  user_id?: string;
  session_id?: string;
  anonymous: boolean;
  timestamp: number;
  url: string;
  referrer?: string;
  properties?: Record<string, any>;
}

/**
 * Generate deterministic event_id based on event content
 * This ensures same event sent twice results in same hash
 */
function generateEventId(event: AnalyticsEvent): string {
  // Round timestamp to 5-second bucket for dedupe tolerance
  const bucket = Math.floor(event.timestamp / 5000) * 5000;
  const input = `${event.event}:${event.url}:${bucket}:${event.user_id || 'anon'}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}

/**
 * Hash IP for LGPD compliance (pseudonymization)
 */
function hashIP(ip: string): string {
  // Remove port if present
  const cleanIP = ip.split(':')[0];
  return createHash('sha256').update(cleanIP).digest('hex').slice(0, 16);
}

/**
 * Insert batch of events with deduplication
 * ON CONFLICT (event_id) DO NOTHING handles duplicate detection
 */
export async function batchInsert(
  events: AnalyticsEvent[],
  clientIP: string
): Promise<{ inserted: number; duplicates: number }> {
  if (events.length === 0) {
    return { inserted: 0, duplicates: 0 };
  }

  const client = await pool.connect();
  let inserted = 0;
  let duplicates = 0;

  try {
    await client.query('BEGIN');

    for (const event of events) {
      const eventId = generateEventId(event);
      const ipHash = hashIP(clientIP);
      
      const result = await client.query(
        `
        INSERT INTO events_raw (
          event_id, event_time, received_at, event_name,
          user_id, session_id, anonymous,
          url, referrer, ip_hash,
          properties
        ) VALUES (
          $1, to_timestamp($2 / 1000.0), NOW(), $3,
          $4, $5, $6,
          $7, $8, $9,
          $10
        )
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
        `,
        [
          eventId,
          event.timestamp,
          event.event,
          event.user_id || null,
          event.session_id || null,
          event.anonymous,
          event.url,
          event.referrer || null,
          ipHash,
          JSON.stringify(event.properties || {})
        ]
      );

      if (result.rowCount === 0) {
        duplicates++;
      } else {
        inserted++;
      }
    }

    await client.query('COMMIT');
    
    return { inserted, duplicates };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

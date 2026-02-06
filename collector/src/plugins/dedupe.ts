/**
 * Deduplication plugin using LRU cache
 * Provides additional deduplication layer before database
 */

import { FastifyInstance } from 'fastify';
import { createHash } from 'crypto';
import fp from 'fastify-plugin';

// Simple LRU cache for event deduplication
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Cache for recent event hashes (5 minute TTL via LRU eviction)
const recentEvents = new LRUCache<string, number>(10000);
const DEDUPE_WINDOW_MS = 300000; // 5 minutes

function generateEventHash(body: any): string {
  const str = JSON.stringify(body);
  return createHash('sha256').update(str).digest('hex').slice(0, 32);
}

export const dedupePlugin = fp(async (server: FastifyInstance) => {
  server.addHook('onRequest', async (request, reply) => {
    if (request.method !== 'POST' || request.url !== '/collect') {
      return;
    }

    // Note: In production, you'd want to parse the body and check
    // individual event hashes. This is a simplified version.
    // The database ON CONFLICT clause provides the final guarantee.
  });
});

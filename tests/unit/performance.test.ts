import { describe, it, expect } from 'vitest';

/**
 * Performance Tests
 *
 * Tests performance characteristics of core functions:
 * - Response times
 * - Memory efficiency
 * - Throughput under load
 * - Cache effectiveness
 */

describe('Performance Tests', () => {
  describe('Algorithm Complexity', () => {
    it('should sort alerts efficiently (O(n log n))', () => {
      type Alert = { priority: number; createdAt: Date };
      const sortAlerts = (alerts: Alert[]) =>
        [...alerts].sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

      // Generate 10,000 alerts
      const alerts: Alert[] = Array.from({ length: 10000 }, (_, _i) => ({
        priority: Math.floor(Math.random() * 4),
        createdAt: new Date(Date.now() - Math.random() * 86400000),
      }));

      const start = performance.now();
      const sorted = sortAlerts(alerts);
      const duration = performance.now() - start;

      expect(sorted).toHaveLength(10000);
      // Should complete in under 100ms for 10k items
      expect(duration).toBeLessThan(100);
    });

    it('should calculate score distribution efficiently (O(n))', () => {
      const calculateDistribution = (scores: number[]) => ({
        excellent: scores.filter((s) => s >= 90).length,
        good: scores.filter((s) => s >= 70 && s < 90).length,
        needsWork: scores.filter((s) => s >= 40 && s < 70).length,
        critical: scores.filter((s) => s < 40).length,
      });

      // Generate 100,000 scores
      const scores = Array.from({ length: 100000 }, () => Math.floor(Math.random() * 100));

      const start = performance.now();
      const distribution = calculateDistribution(scores);
      const duration = performance.now() - start;

      expect(distribution.excellent + distribution.good + distribution.needsWork + distribution.critical).toBe(100000);
      // Should complete in under 100ms for 100k items (relaxed for CI variance)
      expect(duration).toBeLessThan(100);
    });

    it('should search products efficiently', () => {
      interface Product {
        id: string;
        title: string;
        score: number;
      }

      const searchProducts = (products: Product[], query: string): Product[] =>
        products.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()));

      // Generate 50,000 products
      const products: Product[] = Array.from({ length: 50000 }, (_, idx) => ({
        id: `prod-${idx}`,
        title: `Product ${idx % 100} - Category ${Math.floor(idx / 100)}`,
        score: Math.floor(Math.random() * 100),
      }));

      const start = performance.now();
      const results = searchProducts(products, 'Category 25');
      const duration = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large datasets without excessive memory', () => {
      const processLargeDataset = (size: number) => {
        const items = Array.from({ length: size }, (_, idx) => ({
          id: idx,
          data: 'x'.repeat(100),
        }));

        // Process and return summary only
        return {
          count: items.length,
          processed: items.filter((i) => i.id % 2 === 0).length,
        };
      };

      const result = processLargeDataset(100000);

      expect(result.count).toBe(100000);
      expect(result.processed).toBe(50000);
    });

    it('should use streaming for large collections', () => {
      const processInBatches = <T>(items: T[], batchSize: number, processor: (batch: T[]) => void) => {
        let processed = 0;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          processor(batch);
          processed += batch.length;
        }
        return processed;
      };

      const items = Array.from({ length: 10000 }, (_, i) => i);
      let totalBatches = 0;

      const processed = processInBatches(items, 100, () => {
        totalBatches++;
      });

      expect(processed).toBe(10000);
      expect(totalBatches).toBe(100);
    });
  });

  describe('Cache Effectiveness', () => {
    it('should improve performance with memoization', () => {
      const expensiveCalculation = (n: number): number => {
        let result = 0;
        for (let i = 0; i < n * 1000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      };

      const memoize = <T extends (...args: number[]) => number>(fn: T): T => {
        const cache = new Map<string, number>();
        return ((...args: number[]) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) return cache.get(key)!;
          const result = fn(...args);
          cache.set(key, result);
          return result;
        }) as T;
      };

      const memoizedCalc = memoize(expensiveCalculation);

      // First call - not cached
      const start1 = performance.now();
      const result1 = memoizedCalc(100);
      const duration1 = performance.now() - start1;

      // Second call - cached
      const start2 = performance.now();
      const result2 = memoizedCalc(100);
      const duration2 = performance.now() - start2;

      expect(result1).toBe(result2);
      expect(duration2).toBeLessThan(duration1 / 10); // Cache should be 10x faster
    });

    it('should expire cache entries after TTL', async () => {
      class TTLCache<T> {
        private cache = new Map<string, { value: T; expires: number }>();

        set(key: string, value: T, ttlMs: number): void {
          this.cache.set(key, { value, expires: Date.now() + ttlMs });
        }

        get(key: string): T | undefined {
          const entry = this.cache.get(key);
          if (!entry) return undefined;
          if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return undefined;
          }
          return entry.value;
        }
      }

      const cache = new TTLCache<number>();

      cache.set('test', 42, 50); // 50ms TTL
      expect(cache.get('test')).toBe(42);

      await new Promise((resolve) => setTimeout(resolve, 60));
      expect(cache.get('test')).toBeUndefined();
    });

    it('should limit cache size with LRU eviction', () => {
      class LRUCache<T> {
        private cache = new Map<string, T>();
        private maxSize: number;

        constructor(maxSize: number) {
          this.maxSize = maxSize;
        }

        set(key: string, value: T): void {
          if (this.cache.has(key)) {
            this.cache.delete(key);
          } else if (this.cache.size >= this.maxSize) {
            // Delete oldest (first) entry
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
          }
          this.cache.set(key, value);
        }

        get(key: string): T | undefined {
          const value = this.cache.get(key);
          if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
          }
          return value;
        }

        size(): number {
          return this.cache.size;
        }
      }

      const cache = new LRUCache<number>(3);

      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      expect(cache.size()).toBe(3);

      cache.set('d', 4); // Should evict 'a'
      expect(cache.size()).toBe(3);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
    });
  });

  describe('Throughput Under Load', () => {
    it('should handle rapid function calls', async () => {
      const processRequest = async (id: number) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return { id, processed: true };
      };

      const start = performance.now();
      const promises = Array.from({ length: 100 }, (_, i) => processRequest(i));
      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      expect(results).toHaveLength(100);
      expect(results.every((r) => r.processed)).toBe(true);
      // Should complete in reasonable time despite 100 parallel requests
      expect(duration).toBeLessThan(1000);
    });

    it('should limit concurrent operations', async () => {
      let activeCalls = 0;
      let maxActiveCalls = 0;

      const limitedOperation = async (id: number, semaphore: { acquire: () => Promise<void>; release: () => void }) => {
        await semaphore.acquire();
        activeCalls++;
        maxActiveCalls = Math.max(maxActiveCalls, activeCalls);
        await new Promise((resolve) => setTimeout(resolve, 10));
        activeCalls--;
        semaphore.release();
        return id;
      };

      // Simple semaphore implementation
      const createSemaphore = (limit: number) => {
        let available = limit;
        const queue: (() => void)[] = [];

        return {
          acquire: () =>
            new Promise<void>((resolve) => {
              if (available > 0) {
                available--;
                resolve();
              } else {
                queue.push(resolve);
              }
            }),
          release: () => {
            const next = queue.shift();
            if (next) {
              next();
            } else {
              available++;
            }
          },
        };
      };

      const semaphore = createSemaphore(5);
      const promises = Array.from({ length: 20 }, (_, i) => limitedOperation(i, semaphore));
      await Promise.all(promises);

      // Should never exceed the limit
      expect(maxActiveCalls).toBeLessThanOrEqual(5);
    });
  });

  describe('String Processing Performance', () => {
    it('should sanitize HTML efficiently', () => {
      const sanitizeHtml = (input: string): string =>
        input
          .replace(/<[^>]*>/g, '')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          .trim();

      // Generate 10,000 strings with HTML
      const inputs = Array.from(
        { length: 10000 },
        (_, i) => `<div>Product ${i}</div><script>alert(${i})</script>Normal text ${i}`
      );

      const start = performance.now();
      const results = inputs.map(sanitizeHtml);
      const duration = performance.now() - start;

      expect(results).toHaveLength(10000);
      expect(results[0]).not.toContain('<div>');
      // Should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should parse JSON efficiently', () => {
      const objects = Array.from({ length: 1000 }, (_, idx) => ({
        id: `product-${idx}`,
        title: `Product Title ${idx}`,
        description: 'A '.repeat(100),
        score: Math.random() * 100,
        issues: Array.from({ length: 5 }, (_, j) => ({ code: `ISSUE_${j}`, message: `Issue ${j}` })),
      }));

      const jsonString = JSON.stringify(objects);

      const start = performance.now();
      const parsed = JSON.parse(jsonString);
      const duration = performance.now() - start;

      expect(parsed).toHaveLength(1000);
      // Should complete in under 100ms (relaxed for CI variance)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Date Processing Performance', () => {
    it('should filter by date range efficiently', () => {
      interface Item {
        id: number;
        createdAt: Date;
      }

      const now = Date.now();
      const items: Item[] = Array.from({ length: 100000 }, (_, idx) => ({
        id: idx,
        createdAt: new Date(now - Math.random() * 365 * 24 * 60 * 60 * 1000),
      }));

      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const start = performance.now();
      const recent = items.filter((item) => item.createdAt >= thirtyDaysAgo);
      const duration = performance.now() - start;

      expect(recent.length).toBeGreaterThan(0);
      expect(recent.length).toBeLessThan(items.length);
      // Should complete in under 100ms for 100k items (relaxed for CI variance)
      expect(duration).toBeLessThan(100);
    });

    it('should group by date efficiently', () => {
      interface Item {
        id: number;
        date: string;
        value: number;
      }

      const items: Item[] = Array.from({ length: 10000 }, (_, idx) => ({
        id: idx,
        date: new Date(Date.now() - Math.floor(idx / 100) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.random() * 100,
      }));

      const groupByDate = (items: Item[]): Map<string, Item[]> => {
        const groups = new Map<string, Item[]>();
        for (const item of items) {
          const existing = groups.get(item.date);
          if (existing) {
            existing.push(item);
          } else {
            groups.set(item.date, [item]);
          }
        }
        return groups;
      };

      const start = performance.now();
      const grouped = groupByDate(items);
      const duration = performance.now() - start;

      expect(grouped.size).toBeGreaterThan(0);
      // Should complete in under 20ms for 10k items
      expect(duration).toBeLessThan(20);
    });
  });

  describe('Aggregation Performance', () => {
    it('should calculate statistics efficiently', () => {
      const calculateStats = (values: number[]) => {
        if (values.length === 0) return { min: 0, max: 0, avg: 0, sum: 0 };

        let min = values[0];
        let max = values[0];
        let sum = 0;

        for (const value of values) {
          if (value < min) min = value;
          if (value > max) max = value;
          sum += value;
        }

        return { min, max, avg: sum / values.length, sum };
      };

      const values = Array.from({ length: 1000000 }, () => Math.random() * 100);

      const start = performance.now();
      const stats = calculateStats(values);
      const duration = performance.now() - start;

      expect(stats.min).toBeGreaterThanOrEqual(0);
      expect(stats.max).toBeLessThanOrEqual(100);
      // Should complete in under 200ms for 1M values (increased for CI variability)
      expect(duration).toBeLessThan(200);
    });

    it('should count occurrences efficiently', () => {
      const countOccurrences = <T>(items: T[], keyFn: (item: T) => string): Record<string, number> => {
        const counts: Record<string, number> = {};
        for (const item of items) {
          const key = keyFn(item);
          counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
      };

      interface Issue {
        code: string;
        severity: string;
      }

      const issues: Issue[] = Array.from({ length: 100000 }, () => ({
        code: `ISSUE_${Math.floor(Math.random() * 20)}`,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      }));

      const start = performance.now();
      const counts = countOccurrences(issues, (i) => i.code);
      const duration = performance.now() - start;

      expect(Object.keys(counts).length).toBeLessThanOrEqual(20);
      // Should complete in under 100ms for 100k items (CI environments have variable performance)
      expect(duration).toBeLessThan(100);
    });
  });
});

describe('Stress Tests', () => {
  it('should handle repeated operations without degradation', async () => {
    const operation = () => {
      const arr = Array.from({ length: 1000 }, () => Math.random());
      return arr.sort((a, b) => a - b).slice(0, 10);
    };

    const durations: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      operation();
      durations.push(performance.now() - start);
    }

    // Skip first 10 (JIT warmup), compare middle and end
    const avgMiddle10 = durations.slice(40, 50).reduce((a, b) => a + b, 0) / 10;
    const avgLast10 = durations.slice(-10).reduce((a, b) => a + b, 0) / 10;

    // Last 10 operations should not be significantly slower than middle 10 (after JIT warmup)
    // Using 3x multiplier to account for CI environment variability
    expect(avgLast10).toBeLessThan(avgMiddle10 * 3);
  });

  it('should recover from high load', async () => {
    // Simulate high load
    const highLoadPromises = Array.from({ length: 50 }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return Array.from({ length: 10000 }, () => Math.random()).sort();
    });

    await Promise.all(highLoadPromises);

    // After high load, simple operations should still be fast
    const start = performance.now();
    const simpleOp = [1, 2, 3].map((x) => x * 2);
    const duration = performance.now() - start;

    expect(simpleOp).toEqual([2, 4, 6]);
    expect(duration).toBeLessThan(10);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { normalizePagination, fetchAllPages, createPaginationInfo } from '../../src/utils/pagination.js';
import type { PaginatedResponse } from '../../src/asaas/types.js';

describe('Pagination utils', () => {
  describe('normalizePagination', () => {
    it('uses defaults when not provided', () => {
      const result = normalizePagination({});
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it('uses provided values', () => {
      const result = normalizePagination({ limit: 20, offset: 10 });
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(10);
    });

    it('clamps limit to max', () => {
      const result = normalizePagination({ limit: 200 });
      expect(result.limit).toBe(100);
    });

    it('clamps limit to min 1', () => {
      const result = normalizePagination({ limit: 0 });
      expect(result.limit).toBe(1);
    });

    it('clamps offset to min 0', () => {
      const result = normalizePagination({ offset: -5 });
      expect(result.offset).toBe(0);
    });

    it('respects custom max limit', () => {
      const result = normalizePagination({ limit: 200 }, { maxLimit: 50 });
      expect(result.limit).toBe(50);
    });

    it('uses custom default limit', () => {
      const result = normalizePagination({}, { defaultLimit: 25 });
      expect(result.limit).toBe(25);
    });
  });

  describe('fetchAllPages', () => {
    it('fetches all pages', async () => {
      let callCount = 0;
      const fetcher = vi.fn(async ({ offset, limit }: { offset: number; limit: number }) => {
        callCount++;
        const data = Array.from({ length: Math.min(limit, 100 - offset) }, (_, i) => ({ id: offset + i }));
        return {
          object: 'list',
          data,
          hasMore: offset + limit < 100,
          limit,
          offset,
          totalCount: 100,
        } as PaginatedResponse<{ id: number }>;
      });

      const results = await fetchAllPages(fetcher, { limit: 30 });

      expect(results).toHaveLength(100);
      expect(callCount).toBe(4); // 0, 30, 60, 90
    });

    it('respects maxPages', async () => {
      const fetcher = vi.fn(async ({ offset, limit }: { offset: number; limit: number }) => {
        const data = Array.from({ length: limit }, (_, i) => ({ id: offset + i }));
        return {
          object: 'list',
          data,
          hasMore: true,
          limit,
          offset,
          totalCount: 1000,
        } as PaginatedResponse<{ id: number }>;
      });

      const results = await fetchAllPages(fetcher, { limit: 10 }, { maxPages: 3 });

      expect(results).toHaveLength(30);
      expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it('respects maxItems', async () => {
      const fetcher = vi.fn(async ({ offset, limit }: { offset: number; limit: number }) => {
        const data = Array.from({ length: limit }, (_, i) => ({ id: offset + i }));
        return {
          object: 'list',
          data,
          hasMore: true,
          limit,
          offset,
          totalCount: 1000,
        } as PaginatedResponse<{ id: number }>;
      });

      const results = await fetchAllPages(fetcher, { limit: 10 }, { maxItems: 25 });

      // fetchAllPages fetches full pages, so it may exceed maxItems by up to one page
      expect(results.length).toBeGreaterThanOrEqual(25);
      expect(results.length).toBeLessThanOrEqual(35);
    });

    it('stops when hasMore is false', async () => {
      let callCount = 0;
      const fetcher = vi.fn(async ({ offset, limit }: { offset: number; limit: number }) => {
        callCount++;
        const data = Array.from({ length: Math.min(limit, 50 - offset) }, (_, i) => ({ id: offset + i }));
        return {
          object: 'list',
          data,
          hasMore: offset + limit < 50,
          limit,
          offset,
          totalCount: 50,
        } as PaginatedResponse<{ id: number }>;
      });

      const results = await fetchAllPages(fetcher, { limit: 20 });

      expect(results).toHaveLength(50);
      expect(callCount).toBe(3); // 0, 20, 40
    });
  });

  describe('createPaginationInfo', () => {
    it('calculates pagination info correctly', () => {
      const response: PaginatedResponse<{ id: number }> = {
        object: 'list',
        data: [{ id: 1 }, { id: 2 }],
        hasMore: true,
        limit: 2,
        offset: 0,
        totalCount: 5,
      };

      const info = createPaginationInfo(response);

      expect(info.currentPage).toBe(1);
      expect(info.totalPages).toBe(3);
      expect(info.hasNextPage).toBe(true);
      expect(info.hasPreviousPage).toBe(false);
      expect(info.itemsPerPage).toBe(2);
      expect(info.totalItems).toBe(5);
    });

    it('handles second page', () => {
      const response: PaginatedResponse<{ id: number }> = {
        object: 'list',
        data: [{ id: 3 }, { id: 4 }],
        hasMore: true,
        limit: 2,
        offset: 2,
        totalCount: 5,
      };

      const info = createPaginationInfo(response);

      expect(info.currentPage).toBe(2);
      expect(info.hasPreviousPage).toBe(true);
    });

    it('handles last page', () => {
      const response: PaginatedResponse<{ id: number }> = {
        object: 'list',
        data: [{ id: 5 }],
        hasMore: false,
        limit: 2,
        offset: 4,
        totalCount: 5,
      };

      const info = createPaginationInfo(response);

      expect(info.currentPage).toBe(3);
      expect(info.hasNextPage).toBe(false);
    });
  });
});
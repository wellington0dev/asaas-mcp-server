import { DEFAULT_PAGE_LIMIT, MAX_PAYMENTS_PER_REQUEST } from '../config.js';
import type { PaginatedResponse } from '../asaas/types.js';

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationOptions {
  maxLimit?: number;
  defaultLimit?: number;
}

export function normalizePagination(
  params: PaginationParams,
  options: PaginationOptions = {}
): Required<PaginationParams> {
  const maxLimit = options.maxLimit ?? MAX_PAYMENTS_PER_REQUEST;
  const defaultLimit = options.defaultLimit ?? DEFAULT_PAGE_LIMIT;

  return {
    limit: Math.min(Math.max(params.limit ?? defaultLimit, 1), maxLimit),
    offset: Math.max(params.offset ?? 0, 0),
  };
}

export async function fetchAllPages<T>(
  fetcher: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  initialParams: PaginationParams = {},
  options: { maxPages?: number; maxItems?: number } = {}
): Promise<T[]> {
  const maxPages = options.maxPages ?? 100;
  const maxItems = options.maxItems ?? 10000;

  const { limit, offset } = normalizePagination(initialParams);
  const allItems: T[] = [];
  let currentOffset = offset;
  let hasMore = true;
  let pagesFetched = 0;

  while (hasMore && pagesFetched < maxPages && allItems.length < maxItems) {
    const response = await fetcher({ limit, offset: currentOffset });
    allItems.push(...response.data);
    hasMore = response.hasMore;
    currentOffset += response.data.length;
    pagesFetched++;

    if (allItems.length >= maxItems) {
      break;
    }
  }

  if (pagesFetched >= maxPages) {
    console.warn(`Reached max pages limit (${maxPages}) while fetching all pages`);
  }

  if (allItems.length >= maxItems) {
    console.warn(`Reached max items limit (${maxItems}) while fetching all pages`);
  }

  return allItems;
}

export function createPaginationInfo<T>(response: PaginatedResponse<T>): {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: number;
  totalItems: number;
} {
  const { limit, offset, totalCount, hasMore } = response;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    currentPage,
    totalPages,
    hasNextPage: hasMore,
    hasPreviousPage: currentPage > 1,
    itemsPerPage: limit,
    totalItems: totalCount,
  };
}

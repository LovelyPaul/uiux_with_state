'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ConcertListResponse } from '@/features/concerts/lib/dto';

export interface ConcertListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  sortBy?: 'latest' | 'popularity' | 'price';
}

/**
 * 콘서트 목록 조회 React Query 훅
 * @param params - 쿼리 파라미터 (페이지, 검색어, 장르 등)
 */
export function useConcertListQuery(params: ConcertListQueryParams = {}) {
  return useQuery({
    queryKey: ['concerts', 'list', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.search) searchParams.set('search', params.search);
      if (params.genre) searchParams.set('genre', params.genre);
      if (params.sortBy) searchParams.set('sortBy', params.sortBy);

      const queryString = searchParams.toString();
      const url = queryString ? `/api/concerts?${queryString}` : '/api/concerts';

      const response = await apiClient.get<ConcertListResponse>(url);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

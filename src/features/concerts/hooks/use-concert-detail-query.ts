'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ConcertDetail } from '@/features/concerts/lib/dto';

/**
 * 콘서트 상세 조회 React Query 훅
 * @param concertId - 콘서트 ID
 * @param enabled - 쿼리 활성화 여부 (기본값: true)
 */
export function useConcertDetailQuery(
  concertId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['concerts', 'detail', concertId],
    queryFn: async () => {
      const response = await apiClient.get<ConcertDetail>(
        `/api/concerts/${concertId}`
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

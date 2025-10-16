'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SeatsResponse } from '@/features/seats/lib/dto';

/**
 * 좌석 목록 조회 React Query 훅
 * @param scheduleId - 공연 일정 ID
 * @param options - 쿼리 옵션 (refetchInterval 등)
 */
export function useSeatsQuery(
  scheduleId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: ['seats', scheduleId],
    queryFn: async () => {
      const response = await apiClient.get<SeatsResponse>(
        `/api/seats?scheduleId=${scheduleId}`
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 5000, // 5초마다 자동 리프레시
    staleTime: 0, // 항상 최신 데이터 요청
  });
}

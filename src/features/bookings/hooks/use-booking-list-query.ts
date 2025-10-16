'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { BookingListResponse } from '@/features/bookings/lib/dto';

export interface BookingListQueryParams {
  page?: number;
  limit?: number;
  status?: 'confirmed' | 'cancelled';
}

/**
 * 예약 목록 조회 React Query 훅
 * @param params - 쿼리 파라미터 (페이지, 상태 등)
 */
export function useBookingListQuery(params: BookingListQueryParams = {}) {
  return useQuery({
    queryKey: ['bookings', 'list', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set('page', String(params.page));
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.status) searchParams.set('status', params.status);

      const queryString = searchParams.toString();
      const url = queryString
        ? `/api/my/bookings?${queryString}`
        : '/api/my/bookings';

      const response = await apiClient.get<BookingListResponse>(url);
      return response.data;
    },
    staleTime: 1000 * 60, // 1분
  });
}

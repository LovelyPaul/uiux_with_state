'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { BookingDetail } from '@/features/bookings/lib/dto';

/**
 * 예약 상세 조회 React Query 훅
 * @param bookingId - 예약 ID
 * @param enabled - 쿼리 활성화 여부 (기본값: true)
 */
export function useBookingDetailQuery(
  bookingId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['bookings', 'detail', bookingId],
    queryFn: async () => {
      const response = await apiClient.get<BookingDetail>(
        `/api/my/bookings/${bookingId}`
      );
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60, // 1분
  });
}

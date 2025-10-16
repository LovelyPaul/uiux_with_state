'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  CreateBookingResponse,
  CancelBookingResponse,
} from '@/features/bookings/lib/dto';

interface CreateBookingParams {
  scheduleId: string;
}

interface CancelBookingParams {
  bookingId: string;
  reason: string;
  reasonDetail?: string;
}

/**
 * 예약 생성 mutation 훅
 */
export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateBookingParams) => {
      const response = await apiClient.post<CreateBookingResponse>(
        '/api/bookings',
        {
          scheduleId: params.scheduleId,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // 좌석 목록도 무효화 (상태 변경)
      queryClient.invalidateQueries({ queryKey: ['seats'] });
    },
  });
}

/**
 * 예약 취소 mutation 훅
 */
export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CancelBookingParams) => {
      const response = await apiClient.patch<CancelBookingResponse>(
        `/api/my/bookings/${params.bookingId}/cancel`,
        {
          reason: params.reason,
          reasonDetail: params.reasonDetail,
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // 예약 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['bookings', 'list'] });
      // 해당 예약 상세 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['bookings', 'detail', variables.bookingId],
      });
    },
  });
}

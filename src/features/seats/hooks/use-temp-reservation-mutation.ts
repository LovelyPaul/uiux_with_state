'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { TempReservationResponse } from '@/features/seats/lib/dto';
import { useSeatStore } from '@/features/seats/stores/use-seat-store';

interface CreateTempReservationParams {
  seatIds: string[];
}

interface DeleteTempReservationParams {
  tempReservationIds: string[];
}

/**
 * 임시 예약 생성 mutation 훅
 */
export function useCreateTempReservationMutation() {
  const queryClient = useQueryClient();
  const { setTempReservations } = useSeatStore();

  return useMutation({
    mutationFn: async (params: CreateTempReservationParams) => {
      const response = await apiClient.post<TempReservationResponse>(
        '/api/temp-reservations',
        {
          seatIds: params.seatIds,
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Temp reservation created:', data);

      // 임시 예약 정보를 store에 저장
      setTempReservations(data.tempReservationIds, data.expiresAt);

      // 좌석 목록 쿼리 무효화 (상태 변경 반영)
      queryClient.invalidateQueries({ queryKey: ['seats'] });
    },
    onError: (error) => {
      console.error('Temp reservation error:', error);
    },
  });
}

/**
 * 임시 예약 삭제 mutation 훅
 */
export function useDeleteTempReservationMutation() {
  const queryClient = useQueryClient();
  const { clearTempReservations } = useSeatStore();

  return useMutation({
    mutationFn: async (params: DeleteTempReservationParams) => {
      const response = await apiClient.delete<{ success: boolean }>(
        '/api/temp-reservations',
        {
          data: {
            seatIds: params.tempReservationIds,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // store에서 임시 예약 정보 제거
      clearTempReservations();

      // 좌석 목록 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['seats'] });
    },
  });
}

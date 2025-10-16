'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { WishlistResponse } from '@/features/wishlists/lib/dto';

interface AddWishlistParams {
  concertId: string;
}

interface RemoveWishlistParams {
  concertId: string;
}

/**
 * 위시리스트 추가 mutation 훅
 */
export function useAddWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AddWishlistParams) => {
      const response = await apiClient.post<WishlistResponse>('/api/wishlists', {
        concertId: params.concertId,
      });
      return response.data;
    },
    onSuccess: () => {
      // 콘서트 목록 및 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['concerts'] });
    },
  });
}

/**
 * 위시리스트 제거 mutation 훅
 */
export function useRemoveWishlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RemoveWishlistParams) => {
      const response = await apiClient.delete<WishlistResponse>(
        `/api/wishlists?concertId=${params.concertId}`
      );
      return response.data;
    },
    onSuccess: () => {
      // 콘서트 목록 및 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['concerts'] });
    },
  });
}

/**
 * 위시리스트 토글 헬퍼 훅
 * - isWishlisted가 true면 제거, false면 추가
 */
export function useWishlistToggle() {
  const addMutation = useAddWishlistMutation();
  const removeMutation = useRemoveWishlistMutation();

  const toggle = (concertId: string, isWishlisted: boolean) => {
    if (isWishlisted) {
      return removeMutation.mutateAsync({ concertId });
    } else {
      return addMutation.mutateAsync({ concertId });
    }
  };

  return {
    toggle,
    isLoading: addMutation.isPending || removeMutation.isPending,
    error: addMutation.error || removeMutation.error,
  };
}

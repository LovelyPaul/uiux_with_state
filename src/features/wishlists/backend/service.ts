import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import type { WishlistResponse } from './schema';
import {
  wishlistErrorCodes,
  type WishlistServiceError,
} from './error';

export async function addToWishlist(
  supabase: SupabaseClient,
  userId: string,
  concertId: string
): Promise<HandlerResult<WishlistResponse, WishlistServiceError, unknown>> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId, concert_id: concertId });

    if (error) {
      if (error.code === '23505') {
        return failure(409, wishlistErrorCodes.ALREADY_WISHLISTED, '이미 위시리스트에 추가되어 있습니다.');
      }
      return failure(500, wishlistErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    return success({ success: true });
  } catch (error) {
    return failure(500, wishlistErrorCodes.DATABASE_ERROR, '위시리스트 추가 중 오류가 발생했습니다.', { error });
  }
}

export async function removeFromWishlist(
  supabase: SupabaseClient,
  userId: string,
  concertId: string
): Promise<HandlerResult<WishlistResponse, WishlistServiceError, unknown>> {
  try {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('concert_id', concertId);

    if (error) {
      return failure(500, wishlistErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    return success({ success: true });
  } catch (error) {
    return failure(500, wishlistErrorCodes.DATABASE_ERROR, '위시리스트 제거 중 오류가 발생했습니다.', { error });
  }
}

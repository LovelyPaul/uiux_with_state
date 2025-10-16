import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import type { SeatsResponse, Seat, TempReservationResponse } from './schema';
import {
  seatErrorCodes,
  type SeatServiceError,
} from './error';

export async function getSeats(
  supabase: SupabaseClient,
  scheduleId: string
): Promise<HandlerResult<SeatsResponse, SeatServiceError, unknown>> {
  try {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('concert_schedule_id', scheduleId)
      .order('seat_number');

    if (error) {
      return failure(500, seatErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    const seats: Seat[] = (data || []).map((row) => ({
      id: row.id,
      seatNumber: row.seat_number,
      seatGrade: row.seat_grade,
      price: row.price,
      positionX: row.position_x,
      positionY: row.position_y,
      status: row.status,
    }));

    return success({ seats });
  } catch (error) {
    return failure(500, seatErrorCodes.DATABASE_ERROR, '좌석 목록 조회 중 오류가 발생했습니다.', { error });
  }
}

export async function createTempReservation(
  supabase: SupabaseClient,
  userId: string,
  seatId: string
): Promise<HandlerResult<{ tempReservationIds?: string[]; expiresAt?: string }, SeatServiceError, unknown>> {
  try {
    // Call Supabase RPC function for atomic transaction
    const { error } = await supabase.rpc('create_temp_reservation', {
      p_user_id: userId,
      p_seat_id: seatId,
    });

    if (error) {
      console.error('[Service] Supabase RPC error:', error);
      if (error.message.includes('SEAT_NOT_AVAILABLE')) {
        return failure(409, seatErrorCodes.SEAT_ALREADY_RESERVED, '이미 선택된 좌석입니다.');
      }
      return failure(500, seatErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    const result = success({});
    console.log('[Service] Returning success result:', result);
    return result;
  } catch (error) {
    console.error('[Service] Exception:', error);
    return failure(500, seatErrorCodes.DATABASE_ERROR, '임시 예약 생성 중 오류가 발생했습니다.', { error });
  }
}

export async function releaseTempReservation(
  supabase: SupabaseClient,
  userId: string,
  seatId: string
): Promise<HandlerResult<{ tempReservationIds?: string[]; expiresAt?: string }, SeatServiceError, unknown>> {
  try {
    // Delete temp reservation
    const { error: deleteError } = await supabase
      .from('temp_reservations')
      .delete()
      .eq('user_id', userId)
      .eq('seat_id', seatId);

    if (deleteError) {
      return failure(500, seatErrorCodes.DATABASE_ERROR, deleteError.message, { originalError: deleteError });
    }

    // Update seat status back to available
    const { error: updateError } = await supabase
      .from('seats')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', seatId);

    if (updateError) {
      return failure(500, seatErrorCodes.DATABASE_ERROR, updateError.message, { originalError: updateError });
    }

    return success({});
  } catch (error) {
    return failure(500, seatErrorCodes.DATABASE_ERROR, '임시 예약 해제 중 오류가 발생했습니다.', { error });
  }
}

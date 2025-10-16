import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import type {
  CreateBookingResponse,
  BookingListQuery,
  BookingListResponse,
  BookingItem,
  BookingDetail,
  CancelBookingResponse,
} from './schema';
import {
  bookingErrorCodes,
  type BookingServiceError,
} from './error';

export async function createBooking(
  supabase: SupabaseClient,
  userId: string,
  scheduleId: string
): Promise<HandlerResult<CreateBookingResponse, BookingServiceError, unknown>> {
  try {
    // Call Supabase RPC function for atomic transaction
    const { data, error } = await supabase.rpc('create_booking_transaction', {
      p_user_id: userId,
      p_schedule_id: scheduleId,
    });

    if (error) {
      if (error.message.includes('NO_TEMP_RESERVATIONS')) {
        return failure(400, bookingErrorCodes.NO_TEMP_RESERVATIONS, '선택된 좌석이 없습니다.');
      }
      return failure(500, bookingErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    return success({
      bookingId: data.booking_id,
      bookingNumber: data.booking_number,
    });
  } catch (error) {
    return failure(500, bookingErrorCodes.DATABASE_ERROR, '예약 생성 중 오류가 발생했습니다.', { error });
  }
}

export async function getBookingList(
  supabase: SupabaseClient,
  userId: string,
  query: BookingListQuery
): Promise<HandlerResult<BookingListResponse, BookingServiceError, unknown>> {
  try {
    const { status, search, sortBy, page, limit } = query;
    const offset = (page - 1) * limit;
    const today = new Date().toISOString().split('T')[0];

    let countQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    let dataQuery = supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        status,
        created_at,
        concert_schedules!inner(
          concert_date,
          concert_time,
          concerts!inner(title, poster_url, venues!inner(name))
        )
      `)
      .eq('user_id', userId);

    // Status filter
    if (status === 'upcoming') {
      countQuery = countQuery.eq('status', 'confirmed').gte('concert_schedules.concert_date', today);
      dataQuery = dataQuery.eq('status', 'confirmed').gte('concert_schedules.concert_date', today);
    } else if (status === 'past') {
      countQuery = countQuery.eq('status', 'confirmed').lt('concert_schedules.concert_date', today);
      dataQuery = dataQuery.eq('status', 'confirmed').lt('concert_schedules.concert_date', today);
    } else if (status === 'cancelled') {
      countQuery = countQuery.eq('status', 'cancelled');
      dataQuery = dataQuery.eq('status', 'cancelled');
    }

    // Search
    if (search) {
      countQuery = countQuery.ilike('concert_schedules.concerts.title', `%${search}%`);
      dataQuery = dataQuery.ilike('concert_schedules.concerts.title', `%${search}%`);
    }

    // Sorting
    if (sortBy === 'date') {
      dataQuery = dataQuery.order('concert_schedules.concert_date', {
        ascending: status === 'past' ? false : true,
      });
    } else {
      dataQuery = dataQuery.order('created_at', { ascending: false });
    }

    // Pagination
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);

    if (error) {
      return failure(500, bookingErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    // Get seats for each booking
    const bookingIds = (data || []).map((b: any) => b.id);
    const { data: seats } = await supabase
      .from('booking_seats')
      .select('booking_id, seats!inner(seat_number, price)')
      .in('booking_id', bookingIds);

    // Get counts
    const [upcomingResult, pastResult, cancelledResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .gte('concert_schedules.concert_date', today),
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'confirmed')
        .lt('concert_schedules.concert_date', today),
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'cancelled'),
    ]);

    const bookings: BookingItem[] = (data || []).map((row: any) => {
      const bookingSeats = seats?.filter((s: any) => s.booking_id === row.id) || [];
      const concertDate = new Date(row.concert_schedules.concert_date);
      const dDay =
        status === 'upcoming'
          ? Math.floor((concertDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;

      return {
        id: row.id,
        bookingNumber: row.booking_number,
        status: row.status,
        concertTitle: row.concert_schedules.concerts.title,
        concertDate: row.concert_schedules.concert_date,
        concertTime: row.concert_schedules.concert_time,
        posterUrl: row.concert_schedules.concerts.poster_url,
        venueName: row.concert_schedules.concerts.venues.name,
        seatCount: bookingSeats.length,
        seatNumbers: bookingSeats.map((s: any) => s.seats.seat_number),
        totalPrice: bookingSeats.reduce((sum: number, s: any) => sum + s.seats.price, 0),
        createdAt: row.created_at,
        dDay,
      };
    });

    return success({
      bookings,
      total: count ?? 0,
      page,
      limit,
      hasMore: offset + limit < (count ?? 0),
      counts: {
        upcoming: upcomingResult.count ?? 0,
        past: pastResult.count ?? 0,
        cancelled: cancelledResult.count ?? 0,
      },
    });
  } catch (error) {
    return failure(500, bookingErrorCodes.DATABASE_ERROR, '예약 목록 조회 중 오류가 발생했습니다.', { error });
  }
}

export async function getBookingDetail(
  supabase: SupabaseClient,
  bookingId: string,
  userId: string
): Promise<HandlerResult<BookingDetail, BookingServiceError, unknown>> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        status,
        created_at,
        cancelled_at,
        cancellation_reason,
        concert_schedules!inner(
          concert_date,
          concert_time,
          concerts!inner(title, poster_url, performers, venues!inner(name, address, location_lat, location_lng))
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return failure(404, bookingErrorCodes.BOOKING_NOT_FOUND, '예약을 찾을 수 없습니다.');
    }

    // Get seats
    const { data: bookingSeats } = await supabase
      .from('booking_seats')
      .select('seats!inner(seat_number, seat_grade, price)')
      .eq('booking_id', bookingId);

    const concertDate = new Date(data.concert_schedules.concert_date);
    const now = new Date();
    const isCancellable =
      data.status === 'confirmed' &&
      concertDate > now &&
      concertDate.getTime() - now.getTime() > 24 * 60 * 60 * 1000;

    const bookingDetail: BookingDetail = {
      id: data.id,
      bookingNumber: data.booking_number,
      status: data.status,
      createdAt: data.created_at,
      cancelledAt: data.cancelled_at,
      cancellationReason: data.cancellation_reason,
      concert: {
        title: data.concert_schedules.concerts.title,
        posterUrl: data.concert_schedules.concerts.poster_url,
        performers: data.concert_schedules.concerts.performers,
      },
      schedule: {
        concertDate: data.concert_schedules.concert_date,
        concertTime: data.concert_schedules.concert_time,
      },
      venue: {
        name: data.concert_schedules.concerts.venues.name,
        address: data.concert_schedules.concerts.venues.address,
        locationLat: data.concert_schedules.concerts.venues.location_lat,
        locationLng: data.concert_schedules.concerts.venues.location_lng,
      },
      seats: (bookingSeats || []).map((bs: any) => ({
        seatNumber: bs.seats.seat_number,
        seatGrade: bs.seats.seat_grade,
        price: bs.seats.price,
      })),
      totalPrice: (bookingSeats || []).reduce((sum: number, bs: any) => sum + bs.seats.price, 0),
      isCancellable,
    };

    return success(bookingDetail);
  } catch (error) {
    return failure(500, bookingErrorCodes.DATABASE_ERROR, '예약 상세 조회 중 오류가 발생했습니다.', { error });
  }
}

export async function cancelBooking(
  supabase: SupabaseClient,
  bookingId: string,
  userId: string,
  reason?: string,
  reasonDetail?: string
): Promise<HandlerResult<CancelBookingResponse, BookingServiceError, unknown>> {
  try {
    // Call Supabase RPC function for atomic transaction
    const { error } = await supabase.rpc('cancel_booking_transaction', {
      p_booking_id: bookingId,
      p_user_id: userId,
      p_reason: reason || null,
      p_reason_detail: reasonDetail || null,
    });

    if (error) {
      if (error.message.includes('ALREADY_CANCELLED')) {
        return failure(409, bookingErrorCodes.ALREADY_CANCELLED, '이미 취소된 예약입니다.');
      }
      if (error.message.includes('NOT_CANCELLABLE')) {
        return failure(400, bookingErrorCodes.NOT_CANCELLABLE, '취소 가능 기간이 지났습니다.');
      }
      if (error.message.includes('BOOKING_NOT_FOUND')) {
        return failure(404, bookingErrorCodes.BOOKING_NOT_FOUND, '예약을 찾을 수 없습니다.');
      }
      return failure(500, bookingErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    return success({ success: true });
  } catch (error) {
    return failure(500, bookingErrorCodes.DATABASE_ERROR, '예약 취소 중 오류가 발생했습니다.', { error });
  }
}

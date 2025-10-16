import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  type ConcertListQuery,
  type ConcertListResponse,
  type ConcertItem,
  type ConcertDetail,
} from './schema';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from './error';

export async function getConcertList(
  supabase: SupabaseClient,
  query: ConcertListQuery
): Promise<HandlerResult<ConcertListResponse, ConcertServiceError, unknown>> {
  try {
    const { page, limit, search, genre, dateFrom, dateTo, region, priceMin, priceMax, sortBy } = query;
    const offset = (page - 1) * limit;

    // Base query - concerts with venues
    let countQuery = supabase
      .from('concerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .eq('status', 'active');

    let dataQuery = supabase
      .from('concerts')
      .select(`
        id,
        title,
        poster_url,
        genre,
        performers,
        created_at,
        venues!inner(name, address)
      `)
      .eq('is_deleted', false)
      .eq('status', 'active');

    // Search filter
    if (search) {
      const searchFilter = `title.ilike.%${search}%,performers.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Genre filter
    if (genre) {
      countQuery = countQuery.eq('genre', genre);
      dataQuery = dataQuery.eq('genre', genre);
    }

    // Region filter
    if (region) {
      countQuery = countQuery.ilike('venues.address', `%${region}%`);
      dataQuery = dataQuery.ilike('venues.address', `%${region}%`);
    }

    // Sorting
    switch (sortBy) {
      case 'latest':
        dataQuery = dataQuery.order('created_at', { ascending: false });
        break;
      case 'popularity':
        dataQuery = dataQuery.order('created_at', { ascending: false }); // Fallback to latest
        break;
      case 'price':
        dataQuery = dataQuery.order('created_at', { ascending: false }); // Fallback to latest
        break;
    }

    // Pagination
    dataQuery = dataQuery.range(offset, offset + limit - 1);

    const [{ count }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (error) {
      return failure(500, concertErrorCodes.DATABASE_ERROR, error.message, { originalError: error });
    }

    if (!data) {
      return success({
        concerts: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      });
    }

    // Get schedules and seats for each concert
    const concertIds = data.map((c: any) => c.id);

    const { data: schedules } = await supabase
      .from('concert_schedules')
      .select('id, concert_id, concert_date')
      .in('concert_id', concertIds)
      .eq('is_booking_open', true)
      .eq('is_sold_out', false)
      .order('concert_date', { ascending: true });

    const scheduleIds = schedules?.map(s => s.id) || [];
    const { data: seats } = await supabase
      .from('seats')
      .select('concert_schedule_id, price, status')
      .in('concert_schedule_id', scheduleIds);

    const concerts: ConcertItem[] = data.map((row: any) => {
      const concertSchedules = schedules?.filter(s => s.concert_id === row.id) || [];
      const nearestDate = concertSchedules[0]?.concert_date || null;

      const concertScheduleIds = concertSchedules.map(cs => cs.id);
      const concertSeats = seats?.filter(s =>
        concertScheduleIds.includes(s.concert_schedule_id)
      ) || [];

      const availableSeatsCount = concertSeats.filter(s => s.status === 'available').length;
      const prices = concertSeats.map(s => s.price).filter(p => p != null);
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;

      return {
        id: row.id,
        title: row.title,
        posterUrl: row.poster_url,
        genre: row.genre,
        performers: row.performers,
        venueName: row.venues.name,
        venueAddress: row.venues.address,
        nearestDate,
        minPrice,
        availableSeats: availableSeatsCount,
      };
    });

    const total = count ?? 0;
    const hasMore = offset + limit < total;

    return success({
      concerts,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    return failure(500, concertErrorCodes.DATABASE_ERROR, '콘서트 목록 조회 중 오류가 발생했습니다.', { error });
  }
}

export async function getConcertDetail(
  supabase: SupabaseClient,
  concertId: string,
  userId?: string
): Promise<HandlerResult<ConcertDetail, ConcertServiceError, unknown>> {
  try {
    // 1. Concert basic info
    const { data: concert, error: concertError } = await supabase
      .from('concerts')
      .select(`
        id,
        title,
        poster_url,
        description,
        genre,
        performers,
        rating,
        running_time,
        status,
        venues!inner(id, name, address, location_lat, location_lng)
      `)
      .eq('id', concertId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (concertError || !concert) {
      return failure(404, concertErrorCodes.CONCERT_NOT_FOUND, '콘서트를 찾을 수 없습니다.');
    }

    // 2. Schedules
    const { data: schedules } = await supabase
      .from('concert_schedules')
      .select('id, concert_date, concert_time, available_seats, is_sold_out, is_booking_open')
      .eq('concert_id', concertId)
      .order('concert_date', { ascending: true })
      .order('concert_time', { ascending: true });

    // 3. Price info
    const scheduleIds = schedules?.map(s => s.id) || [];
    const { data: seats } = await supabase
      .from('seats')
      .select('seat_grade, price')
      .in('concert_schedule_id', scheduleIds);

    const priceMap: Record<string, { minPrice: number; maxPrice: number }> = {};
    seats?.forEach(({ seat_grade, price }) => {
      if (!priceMap[seat_grade]) {
        priceMap[seat_grade] = { minPrice: price, maxPrice: price };
      } else {
        priceMap[seat_grade].minPrice = Math.min(priceMap[seat_grade].minPrice, price);
        priceMap[seat_grade].maxPrice = Math.max(priceMap[seat_grade].maxPrice, price);
      }
    });

    const priceTable = Object.entries(priceMap).map(([seatGrade, { minPrice, maxPrice }]) => ({
      seatGrade,
      minPrice,
      maxPrice,
    }));

    // 4. Wishlist status
    let isWishlisted = false;
    if (userId) {
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('concert_id', concertId)
        .maybeSingle();
      isWishlisted = !!wishlist;
    }

    const result: ConcertDetail = {
      id: concert.id,
      title: concert.title,
      posterUrl: concert.poster_url,
      description: concert.description,
      genre: concert.genre,
      performers: concert.performers,
      rating: concert.rating,
      runningTime: concert.running_time,
      status: concert.status,
      venue: {
        id: (concert.venues as any).id,
        name: (concert.venues as any).name,
        address: (concert.venues as any).address,
        locationLat: (concert.venues as any).location_lat,
        locationLng: (concert.venues as any).location_lng,
      },
      schedules: schedules?.map(s => ({
        id: s.id,
        concertDate: s.concert_date,
        concertTime: s.concert_time,
        availableSeats: s.available_seats,
        isSoldOut: s.is_sold_out,
        isBookingOpen: s.is_booking_open,
      })) || [],
      priceTable,
      isWishlisted,
    };

    return success(result);
  } catch (error) {
    return failure(500, concertErrorCodes.DATABASE_ERROR, '콘서트 상세 조회 중 오류가 발생했습니다.', { error });
  }
}

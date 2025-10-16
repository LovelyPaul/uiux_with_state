import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  CreateBookingRequestSchema,
  BookingListQuerySchema,
  BookingDetailParamsSchema,
  CancelBookingRequestSchema,
} from './schema';
import { createBooking, getBookingList, getBookingDetail, cancelBooking } from './service';
import { bookingErrorCodes } from './error';

export const registerBookingRoutes = (app: Hono<AppEnv>) => {
  // POST /api/bookings - 예약 생성
  app.post('/api/bookings', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    // 로그인하지 않은 경우 세션 ID 사용 (게스트 예약 지원)
    let userId = c.get('userId');

    if (!userId) {
      const sessionId = c.req.header('X-Session-Id');
      if (!sessionId) {
        return c.json(
          { error: { code: 'INVALID_REQUEST', message: '세션 정보가 없습니다.' } },
          400
        );
      }
      userId = `guest_${sessionId}`;
      logger.info('Using guest session for booking', { sessionId });
    }

    const bodyParseResult = CreateBookingRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid create booking request', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { scheduleId, name, phoneNumber, password } = bodyParseResult.data;
    logger.info('Creating booking', { userId, scheduleId, name, phoneNumber });

    const result = await createBooking(supabase, userId, scheduleId, name, phoneNumber, password);
    return respond(c, result);
  });

  // GET /api/my/bookings - 예약 목록 조회
  app.get('/api/my/bookings', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId');

    if (!userId) {
      return c.json(
        { error: { code: bookingErrorCodes.UNAUTHORIZED, message: '로그인이 필요합니다.' } },
        401
      );
    }

    const queryParseResult = BookingListQuerySchema.safeParse(c.req.query());

    if (!queryParseResult.success) {
      logger.warn('Invalid booking list query', queryParseResult.error);
      return c.json(
        { error: { code: 'INVALID_QUERY', message: '잘못된 요청 파라미터입니다.', details: queryParseResult.error } },
        400
      );
    }

    const query = queryParseResult.data;
    logger.info('Fetching booking list', { userId, query });

    const result = await getBookingList(supabase, userId, query);
    return respond(c, result);
  });

  // GET /api/my/bookings/:id - 예약 상세 조회
  app.get('/api/my/bookings/:id', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId');

    if (!userId) {
      return c.json(
        { error: { code: bookingErrorCodes.UNAUTHORIZED, message: '로그인이 필요합니다.' } },
        401
      );
    }

    const paramsParseResult = BookingDetailParamsSchema.safeParse({ id: c.req.param('id') });

    if (!paramsParseResult.success) {
      logger.warn('Invalid booking ID', paramsParseResult.error);
      return c.json(
        { error: { code: 'INVALID_BOOKING_ID', message: '잘못된 예약 ID입니다.', details: paramsParseResult.error } },
        400
      );
    }

    logger.info('Fetching booking detail', { userId, bookingId: paramsParseResult.data.id });

    const result = await getBookingDetail(supabase, paramsParseResult.data.id, userId);
    return respond(c, result);
  });

  // PATCH /api/my/bookings/:id/cancel - 예약 취소
  app.patch('/api/my/bookings/:id/cancel', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId');

    if (!userId) {
      return c.json(
        { error: { code: bookingErrorCodes.UNAUTHORIZED, message: '로그인이 필요합니다.' } },
        401
      );
    }

    const paramsParseResult = BookingDetailParamsSchema.safeParse({ id: c.req.param('id') });

    if (!paramsParseResult.success) {
      logger.warn('Invalid booking ID', paramsParseResult.error);
      return c.json(
        { error: { code: 'INVALID_BOOKING_ID', message: '잘못된 예약 ID입니다.', details: paramsParseResult.error } },
        400
      );
    }

    const bodyParseResult = CancelBookingRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid cancel booking request', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { id: bookingId } = paramsParseResult.data;
    const { reason, reasonDetail } = bodyParseResult.data;

    logger.info('Cancelling booking', { userId, bookingId, reason });

    const result = await cancelBooking(supabase, bookingId, userId, reason, reasonDetail);
    return respond(c, result);
  });
};

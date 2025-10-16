import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { SeatsQuerySchema, TempReservationRequestSchema, ReleaseTempReservationRequestSchema } from './schema';
import { getSeats, createTempReservation, releaseTempReservation } from './service';
import { seatErrorCodes } from './error';

export const registerSeatRoutes = (app: Hono<AppEnv>) => {
  // GET /api/seats?scheduleId=xxx - 좌석 목록 조회
  app.get('/api/seats', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const queryParseResult = SeatsQuerySchema.safeParse(c.req.query());

    if (!queryParseResult.success) {
      logger.warn('Invalid seats query', queryParseResult.error);
      return c.json(
        { error: { code: 'INVALID_QUERY', message: '잘못된 요청 파라미터입니다.', details: queryParseResult.error } },
        400
      );
    }

    const { scheduleId } = queryParseResult.data;
    logger.info('Fetching seats', { scheduleId });

    const result = await getSeats(supabase, scheduleId);
    return respond(c, result);
  });

  // POST /api/temp-reservations - 임시 예약 생성
  app.post('/api/temp-reservations', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId');

    if (!userId) {
      return c.json(
        { error: { code: seatErrorCodes.UNAUTHORIZED, message: '로그인이 필요합니다.' } },
        401
      );
    }

    const bodyParseResult = TempReservationRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid temp reservation request', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { seatId } = bodyParseResult.data;
    logger.info('Creating temp reservation', { userId, seatId });

    const result = await createTempReservation(supabase, userId, seatId);
    return respond(c, result);
  });

  // DELETE /api/temp-reservations - 임시 예약 해제
  app.delete('/api/temp-reservations', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId');

    if (!userId) {
      return c.json(
        { error: { code: seatErrorCodes.UNAUTHORIZED, message: '로그인이 필요합니다.' } },
        401
      );
    }

    const bodyParseResult = ReleaseTempReservationRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid release temp reservation request', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { seatId } = bodyParseResult.data;
    logger.info('Releasing temp reservation', { userId, seatId });

    const result = await releaseTempReservation(supabase, userId, seatId);
    return respond(c, result);
  });
};

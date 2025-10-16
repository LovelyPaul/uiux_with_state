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

    // 로그인하지 않은 경우 세션 ID 사용 (게스트 예약 지원)
    let userId = c.get('userId');

    if (!userId) {
      // 세션 ID를 헤더에서 가져오거나 생성
      const sessionId = c.req.header('X-Session-Id') || crypto.randomUUID();
      userId = `guest_${sessionId}`;
      logger.info('Using guest session for temp reservation', { sessionId });
    }

    const bodyParseResult = TempReservationRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid temp reservation request', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { seatIds } = bodyParseResult.data;
    logger.info('Creating temp reservations', { userId, seatIds });

    // 여러 좌석에 대해 임시 예약 생성
    const tempReservationIds: string[] = [];
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분 후

    for (const seatId of seatIds) {
      const result = await createTempReservation(supabase, userId, seatId);
      logger.info('[Route] Service returned:', { seatId, result });
      if (result.ok) {
        logger.info('[Route] Success, pushing seatId to array');
        tempReservationIds.push(seatId);
      } else {
        // 하나라도 실패하면 이미 생성된 것들 롤백
        logger.error('Failed to create temp reservation', { seatId, error: (result as any).error });
        return respond(c, result);
      }
    }

    const response = { tempReservationIds, expiresAt };
    logger.info('Returning temp reservation response:', response);
    return c.json(response, 200);
  });

  // DELETE /api/temp-reservations - 임시 예약 해제
  app.delete('/api/temp-reservations', async (c) => {
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
      logger.info('Using guest session for release', { sessionId });
    }

    const bodyParseResult = ReleaseTempReservationRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid release temp reservation request', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { seatIds } = bodyParseResult.data;
    logger.info('Releasing temp reservations', { userId, seatIds });

    // 여러 좌석에 대해 임시 예약 해제
    for (const seatId of seatIds) {
      const result = await releaseTempReservation(supabase, userId, seatId);
      if (!result.ok) {
        logger.error('Failed to release temp reservation', { seatId, error: (result as any).error });
        return respond(c, result);
      }
    }

    return c.json({ success: true }, 200);
  });
};

import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { ConcertListQuerySchema, ConcertDetailParamsSchema } from './schema';
import { getConcertList, getConcertDetail } from './service';

export const registerConcertRoutes = (app: Hono<AppEnv>) => {
  // GET /api/concerts - 콘서트 목록 조회
  app.get('/api/concerts', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const queryParseResult = ConcertListQuerySchema.safeParse(c.req.query());

    if (!queryParseResult.success) {
      logger.warn('Invalid query parameters', queryParseResult.error);
      return c.json(
        { error: { code: 'INVALID_QUERY', message: '잘못된 요청 파라미터입니다.', details: queryParseResult.error } },
        400
      );
    }

    const query = queryParseResult.data;
    logger.info('Fetching concert list', { query });

    const result = await getConcertList(supabase, query);
    return respond(c, result);
  });

  // GET /api/concerts/:id - 콘서트 상세 조회
  app.get('/api/concerts/:id', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const paramsParseResult = ConcertDetailParamsSchema.safeParse({ id: c.req.param('id') });

    if (!paramsParseResult.success) {
      logger.warn('Invalid concert ID', paramsParseResult.error);
      return c.json(
        { error: { code: 'INVALID_CONCERT_ID', message: '잘못된 콘서트 ID입니다.', details: paramsParseResult.error } },
        400
      );
    }

    // Optional: Get userId from auth context if available
    const userId = c.get('userId'); // This would come from auth middleware

    logger.info('Fetching concert detail', { concertId: paramsParseResult.data.id });

    const result = await getConcertDetail(supabase, paramsParseResult.data.id, userId);
    return respond(c, result);
  });
};

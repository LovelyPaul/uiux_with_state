import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { AddWishlistRequestSchema, RemoveWishlistRequestSchema } from './schema';
import { addToWishlist, removeFromWishlist } from './service';
import { wishlistErrorCodes } from './error';

export const registerWishlistRoutes = (app: Hono<AppEnv>) => {
  // POST /api/wishlists - 위시리스트 추가
  app.post('/api/wishlists', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    // Get userId from context (assuming auth middleware sets this)
    const userId = c.get('userId');

    if (!userId) {
      return c.json(
        { error: { code: wishlistErrorCodes.UNAUTHORIZED, message: '로그인이 필요합니다.' } },
        401
      );
    }

    const bodyParseResult = AddWishlistRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid wishlist request body', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { concertId } = bodyParseResult.data;
    logger.info('Adding to wishlist', { userId, concertId });

    const result = await addToWishlist(supabase, userId, concertId);
    return respond(c, result);
  });

  // DELETE /api/wishlists - 위시리스트 제거
  app.delete('/api/wishlists', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const userId = c.get('userId');

    if (!userId) {
      return c.json(
        { error: { code: wishlistErrorCodes.UNAUTHORIZED, message: '로그인이 필요합니다.' } },
        401
      );
    }

    const bodyParseResult = RemoveWishlistRequestSchema.safeParse(await c.req.json());

    if (!bodyParseResult.success) {
      logger.warn('Invalid wishlist remove request body', bodyParseResult.error);
      return c.json(
        { error: { code: 'INVALID_REQUEST', message: '잘못된 요청입니다.', details: bodyParseResult.error } },
        400
      );
    }

    const { concertId } = bodyParseResult.data;
    logger.info('Removing from wishlist', { userId, concertId });

    const result = await removeFromWishlist(supabase, userId, concertId);
    return respond(c, result);
  });
};

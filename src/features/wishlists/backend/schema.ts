import { z } from 'zod';

export const AddWishlistRequestSchema = z.object({
  concertId: z.string().uuid(),
});

export type AddWishlistRequest = z.infer<typeof AddWishlistRequestSchema>;

export const RemoveWishlistRequestSchema = z.object({
  concertId: z.string().uuid(),
});

export type RemoveWishlistRequest = z.infer<typeof RemoveWishlistRequestSchema>;

export const WishlistResponseSchema = z.object({
  success: z.boolean(),
});

export type WishlistResponse = z.infer<typeof WishlistResponseSchema>;

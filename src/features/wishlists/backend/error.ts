export const wishlistErrorCodes = {
  ALREADY_WISHLISTED: 'ALREADY_WISHLISTED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type WishlistServiceError = keyof typeof wishlistErrorCodes;

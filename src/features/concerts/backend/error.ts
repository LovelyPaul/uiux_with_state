export const concertErrorCodes = {
  CONCERT_NOT_FOUND: 'CONCERT_NOT_FOUND',
  INVALID_FILTER: 'INVALID_FILTER',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ConcertServiceError = keyof typeof concertErrorCodes;

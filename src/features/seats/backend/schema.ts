import { z } from 'zod';

export const SeatSchema = z.object({
  id: z.string().uuid(),
  seatNumber: z.string(),
  seatGrade: z.string(),
  price: z.number().int(),
  positionX: z.number().int().nullable(),
  positionY: z.number().int().nullable(),
  status: z.enum(['available', 'temp_reserved', 'reserved', 'unavailable']),
});

export type Seat = z.infer<typeof SeatSchema>;

export const SeatsQuerySchema = z.object({
  scheduleId: z.string().uuid(),
});

export type SeatsQuery = z.infer<typeof SeatsQuerySchema>;

export const SeatsResponseSchema = z.object({
  seats: z.array(SeatSchema),
});

export type SeatsResponse = z.infer<typeof SeatsResponseSchema>;

export const TempReservationRequestSchema = z.object({
  seatIds: z.array(z.string().uuid()).min(1),
});

export type TempReservationRequest = z.infer<typeof TempReservationRequestSchema>;

export const TempReservationResponseSchema = z.object({
  tempReservationIds: z.array(z.string().uuid()),
  expiresAt: z.string(),
});

export type TempReservationResponse = z.infer<typeof TempReservationResponseSchema>;

export const ReleaseTempReservationRequestSchema = z.object({
  seatIds: z.array(z.string().uuid()).min(1),
});

export type ReleaseTempReservationRequest = z.infer<typeof ReleaseTempReservationRequestSchema>;

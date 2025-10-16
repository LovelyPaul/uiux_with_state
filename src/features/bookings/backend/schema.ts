import { z } from 'zod';

// ===== Create Booking =====

export const CreateBookingRequestSchema = z.object({
  scheduleId: z.string().uuid(),
  name: z.string().min(2),
  phoneNumber: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/),
  password: z.string().min(4),
});

export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>;

export const CreateBookingResponseSchema = z.object({
  bookingId: z.string().uuid(),
  bookingNumber: z.string(),
});

export type CreateBookingResponse = z.infer<typeof CreateBookingResponseSchema>;

// ===== Booking List =====

export const BookingListQuerySchema = z.object({
  status: z.enum(['upcoming', 'past', 'cancelled']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'recent']).default('date'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type BookingListQuery = z.infer<typeof BookingListQuerySchema>;

export const BookingItemSchema = z.object({
  id: z.string().uuid(),
  bookingNumber: z.string(),
  status: z.enum(['confirmed', 'cancelled']),
  concertTitle: z.string(),
  concertDate: z.string(),
  concertTime: z.string(),
  posterUrl: z.string().nullable(),
  venueName: z.string(),
  seatCount: z.number().int(),
  seatNumbers: z.array(z.string()),
  totalPrice: z.number().int(),
  createdAt: z.string(),
  dDay: z.number().int().nullable(),
});

export type BookingItem = z.infer<typeof BookingItemSchema>;

export const BookingListResponseSchema = z.object({
  bookings: z.array(BookingItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
  counts: z.object({
    upcoming: z.number().int(),
    past: z.number().int(),
    cancelled: z.number().int(),
  }),
});

export type BookingListResponse = z.infer<typeof BookingListResponseSchema>;

// ===== Booking Detail =====

export const BookingDetailParamsSchema = z.object({
  id: z.string().uuid(),
});

export const BookingDetailSchema = z.object({
  id: z.string().uuid(),
  bookingNumber: z.string(),
  status: z.enum(['confirmed', 'cancelled']),
  createdAt: z.string(),
  cancelledAt: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  concert: z.object({
    title: z.string(),
    posterUrl: z.string().nullable(),
    performers: z.string().nullable(),
  }),
  schedule: z.object({
    concertDate: z.string(),
    concertTime: z.string(),
  }),
  venue: z.object({
    name: z.string(),
    address: z.string(),
    locationLat: z.number().nullable(),
    locationLng: z.number().nullable(),
  }),
  seats: z.array(
    z.object({
      seatNumber: z.string(),
      seatGrade: z.string(),
      price: z.number().int(),
    })
  ),
  totalPrice: z.number().int(),
  isCancellable: z.boolean(),
});

export type BookingDetail = z.infer<typeof BookingDetailSchema>;

// ===== Cancel Booking =====

export const CancelBookingRequestSchema = z.object({
  reason: z.string().optional(),
  reasonDetail: z.string().max(500).optional(),
});

export type CancelBookingRequest = z.infer<typeof CancelBookingRequestSchema>;

export const CancelBookingResponseSchema = z.object({
  success: z.boolean(),
});

export type CancelBookingResponse = z.infer<typeof CancelBookingResponseSchema>;

import { z } from 'zod';

// ===== Concert List =====

export const ConcertListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  genre: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  region: z.string().optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['latest', 'popularity', 'price']).default('latest'),
});

export type ConcertListQuery = z.infer<typeof ConcertListQuerySchema>;

export const ConcertTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  poster_url: z.string().nullable(),
  genre: z.string().nullable(),
  performers: z.string().nullable(),
  venue_name: z.string(),
  venue_address: z.string(),
  nearest_date: z.string().nullable(),
  min_price: z.number().int().nullable(),
  available_seats: z.number().int(),
  created_at: z.string(),
});

export type ConcertTableRow = z.infer<typeof ConcertTableRowSchema>;

export const ConcertItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  posterUrl: z.string().nullable(),
  genre: z.string().nullable(),
  performers: z.string().nullable(),
  venueName: z.string(),
  venueAddress: z.string(),
  nearestDate: z.string().nullable(),
  minPrice: z.number().int().nullable(),
  availableSeats: z.number().int(),
});

export type ConcertItem = z.infer<typeof ConcertItemSchema>;

export const ConcertListResponseSchema = z.object({
  concerts: z.array(ConcertItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  hasMore: z.boolean(),
});

export type ConcertListResponse = z.infer<typeof ConcertListResponseSchema>;

// ===== Concert Detail =====

export const ConcertDetailParamsSchema = z.object({
  id: z.string().uuid(),
});

export const ConcertDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  posterUrl: z.string().nullable(),
  description: z.string().nullable(),
  genre: z.string().nullable(),
  performers: z.string().nullable(),
  rating: z.string().nullable(),
  runningTime: z.number().int().nullable(),
  status: z.string(),
  venue: z.object({
    id: z.string().uuid(),
    name: z.string(),
    address: z.string(),
    locationLat: z.number().nullable(),
    locationLng: z.number().nullable(),
  }),
  schedules: z.array(
    z.object({
      id: z.string().uuid(),
      concertDate: z.string(),
      concertTime: z.string(),
      availableSeats: z.number().int(),
      isSoldOut: z.boolean(),
      isBookingOpen: z.boolean(),
    })
  ),
  priceTable: z.array(
    z.object({
      seatGrade: z.string(),
      minPrice: z.number().int(),
      maxPrice: z.number().int(),
    })
  ),
  isWishlisted: z.boolean(),
});

export type ConcertDetail = z.infer<typeof ConcertDetailSchema>;

'use client';

import { create } from 'zustand';

export interface SeatSelection {
  seatId: string;
  seatNumber: string;
  price: number;
}

interface SeatStoreState {
  selectedSeats: SeatSelection[];
  tempReservationIds: string[];
  expiresAt: string | null;
  addSeat: (seat: SeatSelection) => void;
  removeSeat: (seatId: string) => void;
  clearSeats: () => void;
  setTempReservations: (ids: string[], expiresAt: string) => void;
  clearTempReservations: () => void;
  getTotalPrice: () => number;
}

/**
 * 좌석 선택 상태 관리 Zustand Store
 * - 선택된 좌석 목록
 * - 임시 예약 ID 및 만료 시간
 */
export const useSeatStore = create<SeatStoreState>((set, get) => ({
  selectedSeats: [],
  tempReservationIds: [],
  expiresAt: null,

  addSeat: (seat) => {
    set((state) => ({
      selectedSeats: [...state.selectedSeats, seat],
    }));
  },

  removeSeat: (seatId) => {
    set((state) => ({
      selectedSeats: state.selectedSeats.filter((s) => s.seatId !== seatId),
    }));
  },

  clearSeats: () => {
    set({
      selectedSeats: [],
      tempReservationIds: [],
      expiresAt: null,
    });
  },

  setTempReservations: (ids, expiresAt) => {
    set({
      tempReservationIds: ids,
      expiresAt,
    });
  },

  clearTempReservations: () => {
    set({
      tempReservationIds: [],
      expiresAt: null,
    });
  },

  getTotalPrice: () => {
    return get().selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  },
}));

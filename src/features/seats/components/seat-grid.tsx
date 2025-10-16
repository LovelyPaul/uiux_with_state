'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Seat } from '@/features/seats/lib/dto';

interface SeatGridProps {
  seats: Seat[];
  selectedSeatIds: string[];
  onSeatClick: (seat: Seat) => void;
}

/**
 * 좌석 그리드 컴포넌트
 * @param seats - 좌석 목록
 * @param selectedSeatIds - 선택된 좌석 ID 목록
 * @param onSeatClick - 좌석 클릭 핸들러
 */
export function SeatGrid({ seats, selectedSeatIds, onSeatClick }: SeatGridProps) {
  const getSeatStatus = (seat: Seat) => {
    if (selectedSeatIds.includes(seat.id)) {
      return 'selected';
    }
    return seat.status;
  };

  const getSeatClassName = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20';
      case 'selected':
        return 'bg-primary text-primary-foreground border-primary';
      case 'temp_reserved':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300 cursor-not-allowed';
      case 'reserved':
        return 'bg-muted text-muted-foreground border-muted cursor-not-allowed';
      case 'unavailable':
        return 'bg-muted text-muted-foreground border-muted cursor-not-allowed';
      default:
        return '';
    }
  };

  const isSeatClickable = (seat: Seat) => {
    return seat.status === 'available' || selectedSeatIds.includes(seat.id);
  };

  return (
    <div>
      <div className="mb-8 text-center">
        <div className="inline-block px-12 py-3 bg-muted rounded-lg">
          <p className="text-lg font-semibold">무대</p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(10, minmax(0, 1fr))` }}>
          {seats.map((seat) => {
            const status = getSeatStatus(seat);
            const clickable = isSeatClickable(seat);

            return (
              <Button
                key={seat.id}
                variant="outline"
                size="sm"
                className={cn(
                  'w-12 h-12 p-0 text-xs font-medium transition-colors',
                  getSeatClassName(status)
                )}
                onClick={() => clickable && onSeatClick(seat)}
                disabled={!clickable}
                title={`${seat.seatNumber} - ${seat.price.toLocaleString()}원`}
              >
                {seat.seatNumber}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded" />
          <span className="text-sm">선택 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary border border-primary rounded" />
          <span className="text-sm">선택됨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-100 border border-yellow-300 rounded" />
          <span className="text-sm">임시 예약</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted border border-muted rounded" />
          <span className="text-sm">예약 완료</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { use, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConcertDetailQuery } from '@/features/concerts/hooks/use-concert-detail-query';
import { useSeatsQuery } from '@/features/seats/hooks/use-seats-query';
import {
  useCreateTempReservationMutation,
  useDeleteTempReservationMutation,
} from '@/features/seats/hooks/use-temp-reservation-mutation';
import { useCreateBookingMutation } from '@/features/bookings/hooks/use-booking-mutation';
import { useSeatStore } from '@/features/seats/stores/use-seat-store';
import { SeatGrid } from '@/features/seats/components/seat-grid';
import { SeatTimer } from '@/features/seats/components/seat-timer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import type { Seat } from '@/features/seats/lib/dto';
import { useToast } from '@/hooks/use-toast';

interface SeatsPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 좌석 선택 페이지 (UC-003)
 * - 좌석 조회 및 선택
 * - 임시 예약 생성
 * - 예약 생성 (결제)
 * - 5초마다 좌석 상태 자동 갱신
 */
export default function SeatsPage({ params }: SeatsPageProps) {
  const { id: concertId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('scheduleId');
  const { toast } = useToast();

  const {
    selectedSeats,
    tempReservationIds,
    expiresAt,
    addSeat,
    removeSeat,
    clearSeats,
    getTotalPrice,
  } = useSeatStore();

  const { data: concert } = useConcertDetailQuery(concertId);
  const { data: seatsData, isLoading: isSeatsLoading } = useSeatsQuery(
    scheduleId || '',
    { enabled: !!scheduleId }
  );

  const createTempReservation = useCreateTempReservationMutation();
  const deleteTempReservation = useDeleteTempReservationMutation();
  const createBooking = useCreateBookingMutation();

  const selectedSchedule = concert?.schedules.find((s) => s.id === scheduleId);

  useEffect(() => {
    if (!scheduleId) {
      toast({
        title: '오류',
        description: '일정 정보가 없습니다.',
        variant: 'destructive',
      });
      router.push(`/concerts/${concertId}`);
    }
  }, [scheduleId, concertId, router, toast]);

  const handleSeatClick = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.seatId === seat.id);

    if (isSelected) {
      removeSeat(seat.id);
    } else {
      addSeat({
        seatId: seat.id,
        seatNumber: seat.seatNumber,
        price: seat.price,
      });
    }
  };

  const handleTempReservation = async () => {
    if (selectedSeats.length === 0) {
      toast({
        title: '좌석을 선택해주세요',
        description: '최소 1개 이상의 좌석을 선택해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Creating temp reservation for seats:', selectedSeats.map((s) => s.seatId));
      const result = await createTempReservation.mutateAsync({
        seatIds: selectedSeats.map((s) => s.seatId),
      });
      console.log('Temp reservation result:', result);

      toast({
        title: '좌석 임시 예약 완료',
        description: '10분 안에 결제를 완료해주세요.',
      });
    } catch (error) {
      console.error('Temp reservation failed:', error);
      toast({
        title: '임시 예약 실패',
        description: '이미 예약된 좌석이거나 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelTempReservation = async () => {
    if (!tempReservationIds || tempReservationIds.length === 0) return;

    try {
      await deleteTempReservation.mutateAsync({
        tempReservationIds,
      });

      clearSeats();

      toast({
        title: '임시 예약 취소',
        description: '좌석 선택이 취소되었습니다.',
      });
    } catch (error) {
      toast({
        title: '취소 실패',
        description: '오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!scheduleId) return;

    try {
      const result = await createBooking.mutateAsync({ scheduleId });

      toast({
        title: '예약 완료',
        description: `예약번호: ${result.bookingNumber}`,
      });

      clearSeats();
      router.push('/my/bookings');
    } catch (error) {
      toast({
        title: '예약 실패',
        description: '결제 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleTimerExpire = () => {
    toast({
      title: '시간 만료',
      description: '임시 예약 시간이 만료되었습니다. 다시 선택해주세요.',
      variant: 'destructive',
    });
    clearSeats();
  };

  const handleBackClick = () => {
    router.push(`/concerts/${concertId}`);
  };

  if (isSeatsLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!seatsData || !concert || !selectedSchedule) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            좌석 정보를 불러올 수 없습니다
          </p>
        </div>
      </div>
    );
  }

  const hasReservation = tempReservationIds && tempReservationIds.length > 0 && expiresAt;

  // Debug: store 상태 로깅
  console.log('Store state:', { tempReservationIds, expiresAt, hasReservation });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Button variant="ghost" onClick={handleBackClick} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로가기
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{concert.title}</h1>
        <p className="text-muted-foreground">
          {selectedSchedule.concertDate} {selectedSchedule.startTime}
        </p>
      </div>

      {hasReservation && expiresAt && (
        <div className="mb-6 flex justify-center">
          <SeatTimer expiresAt={expiresAt} onExpire={handleTimerExpire} />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr,320px] gap-8">
        <div>
          <SeatGrid
            seats={seatsData.seats}
            selectedSeatIds={selectedSeats.map((s) => s.seatId)}
            onSeatClick={handleSeatClick}
          />
        </div>

        <div>
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">선택 정보</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">선택 좌석</span>
                  <span className="font-medium">{selectedSeats.length}석</span>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="text-sm">
                    <p className="text-muted-foreground mb-1">좌석 번호</p>
                    <p className="font-medium">
                      {selectedSeats.map((s) => s.seatNumber).join(', ')}
                    </p>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">총 금액</span>
                    <span className="text-xl font-bold text-primary">
                      {getTotalPrice().toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {!hasReservation ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleTempReservation}
                    disabled={
                      selectedSeats.length === 0 ||
                      createTempReservation.isPending
                    }
                  >
                    {createTempReservation.isPending
                      ? '처리 중...'
                      : '좌석 예약하기'}
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePayment}
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? '처리 중...' : '결제하기'}
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={handleCancelTempReservation}
                      disabled={deleteTempReservation.isPending}
                    >
                      취소
                    </Button>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                좌석 선택 후 10분 이내에 결제를 완료해주세요
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

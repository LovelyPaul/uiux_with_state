'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingDetailQuery } from '@/features/bookings/hooks/use-booking-detail-query';
import { useCancelBookingMutation } from '@/features/bookings/hooks/use-booking-mutation';
import { CancelBookingDialog } from '@/features/bookings/components/cancel-booking-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, MapPin, Users, CreditCard, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 예약 상세 페이지 (UC-005, UC-006)
 * - 예약 상세 정보 표시
 * - 예약 취소 (UC-006)
 */
export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const { data: booking, isLoading, error } = useBookingDetailQuery(id);
  const cancelMutation = useCancelBookingMutation();

  const handleCancelConfirm = async (reason: string, reasonDetail?: string) => {
    try {
      await cancelMutation.mutateAsync({
        bookingId: id,
        reason,
        reasonDetail,
      });

      toast({
        title: '예약 취소 완료',
        description: '예약이 취소되었습니다.',
      });

      setIsCancelDialogOpen(false);
    } catch (error) {
      toast({
        title: '취소 실패',
        description: '예약 취소 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleBackClick = () => {
    router.push('/my/bookings');
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          예약 정보를 불러오는데 실패했습니다. 다시 시도해주세요.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            예약 정보를 찾을 수 없습니다
          </p>
        </div>
      </div>
    );
  }

  const getDDay = () => {
    const concertDate = new Date(booking.schedule.concertDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    concertDate.setHours(0, 0, 0, 0);

    const diffTime = concertDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getDDayText = () => {
    if (booking.status === 'cancelled') {
      return null;
    }

    const dDay = getDDay();

    if (dDay === 0) {
      return '오늘';
    }

    if (dDay > 0) {
      return `D-${dDay}`;
    }

    return '공연 종료';
  };

  const canCancel = booking.status === 'confirmed' && getDDay() > 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Button variant="ghost" onClick={handleBackClick} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{booking.concert.title}</h1>
              <p className="text-muted-foreground">예약번호: {booking.bookingNumber}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {getDDayText() && (
                <Badge variant={getDDay() === 0 ? 'destructive' : 'default'}>
                  {getDDayText()}
                </Badge>
              )}
              <Badge
                variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
              >
                {booking.status === 'confirmed' ? '예약 확정' : '취소됨'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Info className="h-5 w-5" />
              공연 정보
            </h3>

            <div className="space-y-3 pl-7">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {format(new Date(booking.schedule.concertDate), 'yyyy년 MM월 dd일 (E)', {
                      locale: ko,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">{booking.schedule.concertTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{booking.venue.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.venue.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              좌석 정보
            </h3>

            <div className="pl-7 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">좌석 수</span>
                <span className="font-medium">{booking.seatCount}석</span>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground block mb-1">좌석 번호</span>
                <div className="flex flex-wrap gap-2">
                  {booking.seats.map((seat) => (
                    <Badge key={seat.id} variant="outline">
                      {seat.seatNumber}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" />
              결제 정보
            </h3>

            <div className="pl-7 space-y-3">
              <div className="space-y-2">
                {booking.seats.map((seat) => (
                  <div key={seat.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {seat.seatNumber} ({seat.grade})
                    </span>
                    <span>{seat.price.toLocaleString()}원</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">총 결제 금액</span>
                <span className="text-xl font-bold text-primary">
                  {booking.totalPrice.toLocaleString()}원
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                예약일: {format(new Date(booking.createdAt), 'yyyy.MM.dd HH:mm')}
              </div>
            </div>
          </div>

          {booking.status === 'cancelled' && booking.cancelledAt && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">취소 정보</h3>
              <div className="pl-7 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">취소일</span>
                  <span>
                    {format(new Date(booking.cancelledAt), 'yyyy.MM.dd HH:mm')}
                  </span>
                </div>
                {booking.cancelReason && (
                  <div>
                    <span className="text-muted-foreground block mb-1">취소 사유</span>
                    <p>{booking.cancelReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {canCancel && (
            <div className="border-t pt-6">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                예약 취소
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CancelBookingDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        onConfirm={handleCancelConfirm}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}

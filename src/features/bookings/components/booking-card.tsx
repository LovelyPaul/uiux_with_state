'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { BookingItem } from '@/features/bookings/lib/dto';

interface BookingCardProps {
  booking: BookingItem;
}

/**
 * 예약 카드 컴포넌트
 * @param booking - 예약 정보
 */
export function BookingCard({ booking }: BookingCardProps) {
  const router = useRouter();

  const handleViewDetail = () => {
    router.push(`/my/bookings/${booking.id}`);
  };

  const getDDayBadge = () => {
    if (booking.status === 'cancelled') {
      return null;
    }

    if (booking.dDay === null) {
      return null;
    }

    if (booking.dDay === 0) {
      return <Badge variant="destructive">오늘</Badge>;
    }

    if (booking.dDay > 0) {
      return <Badge variant="default">D-{booking.dDay}</Badge>;
    }

    return <Badge variant="secondary">공연 종료</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold line-clamp-1 mb-1">
              {booking.concertTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              예약번호: {booking.bookingNumber}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {getDDayBadge()}
            <Badge
              variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
            >
              {booking.status === 'confirmed' ? '예약 확정' : '취소됨'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(booking.concertDate), 'yyyy.MM.dd (E) HH:mm', {
              locale: ko,
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="line-clamp-1">{booking.venue}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{booking.seatCount}석</span>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">총 결제 금액</span>
            <span className="text-lg font-bold">
              {booking.totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={handleViewDetail}>
          상세 보기
        </Button>
      </CardFooter>
    </Card>
  );
}

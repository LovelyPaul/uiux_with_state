'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Calendar, MapPin, Ticket, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/remote/api-client';

interface BookingDetail {
  id: string;
  bookingNumber: string;
  status: 'confirmed' | 'cancelled';
  guestName: string;
  guestPhone: string;
  concert: {
    title: string;
    posterUrl: string | null;
  };
  schedule: {
    concertDate: string;
    concertTime: string;
  };
  venue: {
    name: string;
    address: string;
  };
  seats: Array<{
    seatNumber: string;
    seatGrade: string;
    price: number;
  }>;
  totalPrice: number;
  createdAt: string;
  isCancellable: boolean;
}

/**
 * 예약 상세 조회 페이지 (비회원)
 * - 예약번호, 핸드폰 번호, 비밀번호로 조회
 */
export default function BookingDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingNumber = searchParams.get('bookingNumber');
  const phone = searchParams.get('phone');
  const password = searchParams.get('password');

  useEffect(() => {
    if (!bookingNumber || !phone || !password) {
      setError('예약 조회에 필요한 정보가 부족합니다.');
      setIsLoading(false);
      return;
    }

    fetchBookingDetail();
  }, [bookingNumber, phone, password]);

  const fetchBookingDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: API 호출하여 예약 조회
      // 임시 데이터
      setTimeout(() => {
        setError('예약 조회 API가 아직 구현되지 않았습니다.');
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError('예약 정보를 찾을 수 없거나 입력 정보가 올바르지 않습니다.');
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    if (!confirm('정말로 예약을 취소하시겠습니까?')) {
      return;
    }

    try {
      // TODO: 예약 취소 API 호출
      toast({
        title: '예약 취소 완료',
        description: '예약이 성공적으로 취소되었습니다.',
      });

      fetchBookingDetail();
    } catch (error) {
      toast({
        title: '예약 취소 실패',
        description: '예약 취소 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => router.push('/bookings/check')}>
            다시 조회하기
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push('/bookings/check')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로가기
      </Button>

      <div className="grid gap-6">
        {/* 예약 상태 */}
        <Card>
          <CardHeader className="text-center">
            {booking.status === 'confirmed' ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-2xl text-green-600">예약 확인됨</CardTitle>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-2" />
                <CardTitle className="text-2xl text-red-600">예약 취소됨</CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-muted-foreground">예약번호</p>
            <p className="text-2xl font-bold">{booking.bookingNumber}</p>
          </CardContent>
        </Card>

        {/* 공연 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>공연 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{booking.concert.title}</h3>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">공연 일시</p>
                <p className="text-muted-foreground">
                  {booking.schedule.concertDate} {booking.schedule.concertTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{booking.venue.name}</p>
                <p className="text-muted-foreground">{booking.venue.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 예약자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>예약자 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">이름</span>
              <span className="font-medium">{booking.guestName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">핸드폰</span>
              <span className="font-medium">{booking.guestPhone}</span>
            </div>
          </CardContent>
        </Card>

        {/* 좌석 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              좌석 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {booking.seats.map((seat, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{seat.seatNumber}</p>
                  <p className="text-sm text-muted-foreground">{seat.seatGrade}</p>
                </div>
                <p className="font-semibold">{seat.price.toLocaleString()}원</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t-2">
              <span className="text-lg font-semibold">총 금액</span>
              <span className="text-2xl font-bold text-primary">
                {booking.totalPrice.toLocaleString()}원
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 취소 버튼 */}
        {booking.status === 'confirmed' && booking.isCancellable && (
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={handleCancelBooking}
          >
            예약 취소하기
          </Button>
        )}

        {booking.status === 'confirmed' && !booking.isCancellable && (
          <Alert>
            <AlertDescription>
              공연 1일 전까지만 취소 가능합니다.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

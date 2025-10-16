'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useConcertDetailQuery } from '@/features/concerts/hooks/use-concert-detail-query';
import { useCreateBookingMutation } from '@/features/bookings/hooks/use-booking-mutation';
import { useSeatStore } from '@/features/seats/stores/use-seat-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingPageProps {
  params: Promise<{ id: string }>;
}

const bookingFormSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요'),
  phoneNumber: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 핸드폰 번호를 입력해주세요'),
  password: z.string().min(4, '비밀번호는 4자 이상 입력해주세요'),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

/**
 * 예약자 정보 입력 페이지
 * - 임시 예약된 좌석에 대한 예약자 정보 입력
 * - 이름, 핸드폰 번호, 비밀번호 입력
 * - 예약 생성 및 완료
 */
export default function BookingPage({ params }: BookingPageProps) {
  const { id: concertId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('scheduleId');
  const { toast } = useToast();

  const { selectedSeats, tempReservationIds, getTotalPrice, clearSeats } = useSeatStore();

  const { data: concert } = useConcertDetailQuery(concertId);
  const createBooking = useCreateBookingMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
  });

  const selectedSchedule = concert?.schedules.find((s) => s.id === scheduleId);

  const onSubmit = async (data: BookingFormData) => {
    if (!scheduleId) return;

    try {
      const result = await createBooking.mutateAsync({
        scheduleId,
        name: data.name,
        phoneNumber: data.phoneNumber,
        password: data.password,
      });

      toast({
        title: '예약 완료',
        description: `예약번호: ${result.bookingNumber}`,
      });

      clearSeats();
      router.push(`/bookings/${result.bookingId}`);
    } catch (error) {
      toast({
        title: '예약 실패',
        description: '예약 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleBackClick = () => {
    router.push(`/concerts/${concertId}/seats?scheduleId=${scheduleId}`);
  };

  if (!concert || !selectedSchedule) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!tempReservationIds || tempReservationIds.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground mb-4">
            임시 예약된 좌석이 없습니다.
          </p>
          <Button onClick={() => router.push(`/concerts/${concertId}/seats?scheduleId=${scheduleId}`)}>
            좌석 선택하러 가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button variant="ghost" onClick={handleBackClick} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로가기
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">예약자 정보 입력</h1>
        <p className="text-muted-foreground">
          {concert.title} - {selectedSchedule.concertDate} {selectedSchedule.startTime}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>선택한 좌석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">선택 좌석</span>
                <span className="font-medium">{selectedSeats.length}석</span>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">좌석 번호</p>
                <p className="font-medium">
                  {selectedSeats.map((s) => s.seatNumber).join(', ')}
                </p>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">총 금액</span>
                  <span className="text-xl font-bold text-primary">
                    {getTotalPrice().toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>예약자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">핸드폰 번호 *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="010-1234-5678"
                  {...register('phoneNumber')}
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="예약 조회/취소용 (4자 이상)"
                  {...register('password')}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  예약 조회 및 취소 시 사용됩니다.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? '처리 중...' : '예약하기'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

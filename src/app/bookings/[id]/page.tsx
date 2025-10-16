'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface BookingCompletePage {
  params: Promise<{ id: string }>;
}

/**
 * 예약 완료 페이지
 * - 예약 성공 메시지 표시
 * - 예약 번호 표시
 */
export default function BookingCompletePage({ params }: BookingCompletePage) {
  const { id: bookingId } = use(params);
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">예약이 완료되었습니다!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">예약번호</p>
              <p className="text-2xl font-bold">{bookingId}</p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">안내사항</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 예약 확인 및 취소는 예약번호와 비밀번호로 가능합니다.</li>
                <li>• 공연 당일 예약자 정보로 본인 확인 후 입장 가능합니다.</li>
                <li>• 예약 취소는 공연 1일 전까지 가능합니다.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push('/concerts')}
              >
                공연 목록으로
              </Button>
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                onClick={() => router.push('/bookings/check')}
              >
                예약 확인하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

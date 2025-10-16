'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { ConcertDetail } from '@/features/concerts/lib/dto';

type Schedule = ConcertDetail['schedules'][number];

interface ConcertScheduleListProps {
  schedules: Schedule[];
  concertId: string;
}

/**
 * 콘서트 일정 목록 컴포넌트
 * @param schedules - 일정 목록
 * @param concertId - 콘서트 ID
 */
export function ConcertScheduleList({
  schedules,
  concertId,
}: ConcertScheduleListProps) {
  const router = useRouter();

  const handleSelectSchedule = (scheduleId: string) => {
    router.push(`/concerts/${concertId}/seats?scheduleId=${scheduleId}`);
  };

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        예매 가능한 일정이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => {
        const isAlmostSoldOut = schedule.availableSeats <= 10 && schedule.availableSeats > 0;

        return (
          <Card key={schedule.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(schedule.concertDate), 'yyyy년 MM월 dd일 (E)', {
                        locale: ko,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{schedule.concertTime}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    잔여 좌석: {schedule.availableSeats.toLocaleString()}석
                  </span>

                  {schedule.isSoldOut && <Badge variant="secondary">매진</Badge>}
                  {isAlmostSoldOut && (
                    <Badge variant="destructive">마감임박</Badge>
                  )}
                  {!schedule.isBookingOpen && (
                    <Badge variant="outline">예매 종료</Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={() => handleSelectSchedule(schedule.id)}
                disabled={schedule.isSoldOut || !schedule.isBookingOpen}
              >
                {schedule.isSoldOut ? '매진' : schedule.isBookingOpen ? '좌석 선택' : '예매 종료'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

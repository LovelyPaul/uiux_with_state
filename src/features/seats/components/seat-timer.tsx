'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';

interface SeatTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

/**
 * 좌석 예약 타이머 컴포넌트 (10분 카운트다운)
 * @param expiresAt - 만료 시간 (ISO 8601 형식)
 * @param onExpire - 만료 시 콜백
 */
export function SeatTimer({ expiresAt, onExpire }: SeatTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const seconds = differenceInSeconds(expiry, now);
      return Math.max(0, seconds);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft <= 60; // 1분 이하

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono ${
        isWarning
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-foreground'
      }`}
    >
      <Clock className="h-5 w-5" />
      <span className="text-lg font-semibold">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {isWarning && <span className="text-sm ml-2">시간이 얼마 남지 않았습니다!</span>}
    </div>
  );
}

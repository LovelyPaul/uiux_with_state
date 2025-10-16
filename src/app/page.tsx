'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Music, Ticket, Calendar, Heart } from 'lucide-react';
import Link from 'next/link';

/**
 * 콘서트 예약 시스템 랜딩 페이지
 */
export default function Home() {
  const router = useRouter();

  // 메인 페이지 접속 시 콘서트 목록으로 자동 리다이렉트
  useEffect(() => {
    router.push('/concerts');
  }, [router]);

  // 리다이렉트 전까지 보여줄 랜딩 페이지
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8">
            <Music className="h-24 w-24 mx-auto mb-6 text-primary" />
            <h1 className="text-5xl font-bold mb-4">콘서트 예약 시스템</h1>
            <p className="text-xl text-slate-300 mb-8">
              다양한 콘서트를 둘러보고 간편하게 예매하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-6">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <h3 className="text-lg font-semibold mb-2">간편한 예약</h3>
              <p className="text-sm text-slate-300">
                원하는 날짜와 좌석을 선택하고 빠르게 예약하세요
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-6">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold mb-2">실시간 좌석</h3>
              <p className="text-sm text-slate-300">
                5초마다 업데이트되는 실시간 좌석 현황을 확인하세요
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-6">
              <Heart className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h3 className="text-lg font-semibold mb-2">위시리스트</h3>
              <p className="text-sm text-slate-300">
                관심있는 콘서트를 저장하고 놓치지 마세요
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/concerts">
              <Button size="lg" className="text-lg px-8 py-6">
                콘서트 둘러보기
              </Button>
            </Link>
            <Link href="/my/bookings">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                내 예약 확인
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-slate-400">
            리다이렉트 중...
          </p>
        </div>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Ticket className="h-6 w-6" />
          <span className="font-bold text-xl">콘서트 예약</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/concerts">
            <Button variant="ghost">콘서트 목록</Button>
          </Link>
          <Link href="/bookings/check">
            <Button variant="ghost">예약 확인</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

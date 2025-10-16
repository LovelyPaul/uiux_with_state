'use client';

import { useBookingListQuery } from '@/features/bookings/hooks/use-booking-list-query';
import { BookingCard } from '@/features/bookings/components/booking-card';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { SkeletonCardGrid } from '@/components/common/skeleton-card';
import { useQueryParams } from '@/hooks/use-query-params';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ticket } from 'lucide-react';

/**
 * 예약 목록 페이지 (UC-004)
 * - 내 예약 목록 조회
 * - 상태별 필터링
 * - 페이지네이션
 */
export default function BookingsPage() {
  const { getQueryParam, setQueryParams } = useQueryParams();

  const page = Number(getQueryParam('page')) || 1;
  const status = (getQueryParam('status') as 'confirmed' | 'cancelled') || undefined;

  const { data, isLoading, error } = useBookingListQuery({
    page,
    limit: 12,
    status,
  });

  const handleStatusChange = (value: string) => {
    setQueryParams(
      {
        page: 1,
        status: value === 'all' ? undefined : value,
      },
      { scroll: true }
    );
  };

  const handlePageChange = (newPage: number) => {
    setQueryParams({ page: newPage }, { scroll: true });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">내 예약 내역</h1>
        <p className="text-muted-foreground">
          예약한 콘서트를 확인하고 관리하세요
        </p>
      </div>

      <div className="mb-6">
        <Select
          value={status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="confirmed">예약 확정</SelectItem>
            <SelectItem value="cancelled">취소됨</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          예약 목록을 불러오는데 실패했습니다. 다시 시도해주세요.
        </div>
      )}

      {isLoading && <SkeletonCardGrid count={12} variant="booking" />}

      {!isLoading && data && (
        <>
          {data.bookings.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="예약 내역이 없습니다"
              description="콘서트를 예매하고 공연을 즐겨보세요"
              actionLabel="콘서트 둘러보기"
              onAction={() => window.location.href = '/concerts'}
            />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>

              {data.total > data.limit && (
                <div className="mt-8">
                  <Pagination
                    currentPage={data.page}
                    totalPages={Math.ceil(data.total / data.limit)}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

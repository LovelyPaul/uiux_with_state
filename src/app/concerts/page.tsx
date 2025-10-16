'use client';

import { useConcertListQuery } from '@/features/concerts/hooks/use-concert-list-query';
import { ConcertCard } from '@/features/concerts/components/concert-card';
import { ConcertFilter } from '@/features/concerts/components/concert-filter';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { SkeletonCardGrid } from '@/components/common/skeleton-card';
import { useQueryParams } from '@/hooks/use-query-params';
import { Music } from 'lucide-react';

/**
 * 콘서트 목록 페이지 (UC-001)
 * - 콘서트 목록 조회
 * - 검색, 필터, 정렬 기능
 * - 페이지네이션
 */
export default function ConcertsPage() {
  const { getQueryParam, setQueryParams } = useQueryParams();

  const page = Number(getQueryParam('page')) || 1;
  const search = getQueryParam('search') || undefined;
  const genre = getQueryParam('genre') || undefined;
  const sortBy = (getQueryParam('sortBy') as 'latest' | 'popularity' | 'price') || 'latest';

  const { data, isLoading, error } = useConcertListQuery({
    page,
    limit: 12,
    search,
    genre,
    sortBy,
  });

  const handleFilterChange = (filters: {
    search?: string;
    genre?: string;
    sortBy?: 'latest' | 'popularity' | 'price';
  }) => {
    setQueryParams(
      {
        page: 1,
        search: filters.search,
        genre: filters.genre,
        sortBy: filters.sortBy,
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
        <h1 className="text-3xl font-bold mb-2">콘서트 예매</h1>
        <p className="text-muted-foreground">
          다양한 콘서트를 둘러보고 예매하세요
        </p>
      </div>

      <div className="mb-8">
        <ConcertFilter
          onFilterChange={handleFilterChange}
          initialSearch={search}
          initialGenre={genre}
          initialSortBy={sortBy}
        />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          콘서트 목록을 불러오는데 실패했습니다. 다시 시도해주세요.
        </div>
      )}

      {isLoading && <SkeletonCardGrid count={12} variant="concert" />}

      {!isLoading && data && (
        <>
          {data.concerts.length === 0 ? (
            <EmptyState
              icon={Music}
              title="검색 결과가 없습니다"
              description="다른 검색어나 필터를 시도해보세요"
            />
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.concerts.map((concert) => (
                  <ConcertCard key={concert.id} concert={concert} />
                ))}
              </div>

              {data.hasMore && (
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

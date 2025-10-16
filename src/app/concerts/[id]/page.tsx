'use client';

import { use } from 'react';
import { useConcertDetailQuery } from '@/features/concerts/hooks/use-concert-detail-query';
import { ConcertScheduleList } from '@/features/concerts/components/concert-schedule-list';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWishlistToggle } from '@/features/wishlists/hooks/use-wishlist-mutation';
import { Heart, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface ConcertDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 콘서트 상세 페이지 (UC-002)
 * - 콘서트 상세 정보 표시
 * - 위시리스트 추가/제거
 * - 일정 선택 후 좌석 선택 페이지 이동
 */
export default function ConcertDetailPage({ params }: ConcertDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: concert, isLoading, error } = useConcertDetailQuery(id);
  const { toggle, isLoading: isWishlistLoading } = useWishlistToggle();

  const handleWishlistClick = async () => {
    if (!concert) return;
    await toggle(concert.id, concert.isWishlisted);
  };

  const handleBackClick = () => {
    router.push('/concerts');
  };

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          콘서트 정보를 불러오는데 실패했습니다. 다시 시도해주세요.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-[400px] w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            콘서트 정보를 찾을 수 없습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={handleBackClick}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      <div className="mb-8">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted mb-6">
          <img
            src={concert.imageUrl || `https://picsum.photos/seed/${concert.id}/1200/675`}
            alt={concert.title}
            className="object-cover w-full h-full"
          />
        </div>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{concert.title}</h1>
            <p className="text-lg text-muted-foreground">{concert.artist}</p>
          </div>

          <Button
            variant={concert.isWishlisted ? 'default' : 'outline'}
            size="lg"
            onClick={handleWishlistClick}
            disabled={isWishlistLoading}
          >
            <Heart
              className={`h-5 w-5 mr-2 ${
                concert.isWishlisted ? 'fill-current' : ''
              }`}
            />
            {concert.isWishlisted ? '위시리스트 제거' : '위시리스트 추가'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {concert.genre && <Badge variant="outline">{concert.genre}</Badge>}
          {concert.availableSeats <= 10 && concert.availableSeats > 0 && (
            <Badge variant="destructive">마감임박</Badge>
          )}
          {concert.availableSeats === 0 && (
            <Badge variant="secondary">매진</Badge>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{concert.venue}</p>
              <p className="text-sm text-muted-foreground">{concert.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p>
              {format(new Date(concert.startDate), 'yyyy년 MM월 dd일', {
                locale: ko,
              })}
              {concert.startDate !== concert.endDate &&
                ` - ${format(new Date(concert.endDate), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}`}
            </p>
          </div>
        </div>

        {concert.description && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">공연 소개</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {concert.description}
            </p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">공연 일정 선택</h2>
        <ConcertScheduleList schedules={concert.schedules} concertId={concert.id} />
      </div>
    </div>
  );
}

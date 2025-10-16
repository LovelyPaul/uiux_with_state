'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ConcertItem } from '@/features/concerts/lib/dto';
import { useWishlistToggle } from '@/features/wishlists/hooks/use-wishlist-mutation';
import { useRouter } from 'next/navigation';

interface ConcertCardProps {
  concert: ConcertItem;
}

/**
 * 콘서트 카드 컴포넌트
 * @param concert - 콘서트 정보
 */
export function ConcertCard({ concert }: ConcertCardProps) {
  const router = useRouter();
  const { toggle, isLoading } = useWishlistToggle();

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggle(concert.id, concert.isWishlisted);
  };

  const handleCardClick = () => {
    router.push(`/concerts/${concert.id}`);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <img
          src={concert.imageUrl || `https://picsum.photos/seed/${concert.id}/800/450`}
          alt={concert.title}
          className="object-cover w-full h-full"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 hover:bg-background"
          onClick={handleWishlistClick}
          disabled={isLoading}
        >
          <Heart
            className={`h-5 w-5 ${
              concert.isWishlisted ? 'fill-red-500 text-red-500' : ''
            }`}
          />
        </Button>
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold line-clamp-2">{concert.title}</h3>
          {concert.availableSeats <= 10 && concert.availableSeats > 0 && (
            <Badge variant="destructive">마감임박</Badge>
          )}
          {concert.availableSeats === 0 && (
            <Badge variant="secondary">매진</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{concert.venue}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(new Date(concert.startDate), 'yyyy.MM.dd', { locale: ko })}
            {concert.startDate !== concert.endDate &&
              ` - ${format(new Date(concert.endDate), 'yyyy.MM.dd', { locale: ko })}`}
          </span>
        </div>

        {concert.genre && (
          <div className="flex gap-1 flex-wrap">
            <Badge variant="outline">{concert.genre}</Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="text-sm">
          <span className="text-muted-foreground">가격 </span>
          <span className="font-semibold">
            {concert.minPrice.toLocaleString()}원 ~
          </span>
        </div>
        <Button size="sm" disabled={concert.availableSeats === 0}>
          {concert.availableSeats === 0 ? '매진' : '예매하기'}
        </Button>
      </CardFooter>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const checkBookingSchema = z.object({
  bookingNumber: z.string().min(1, '예약번호를 입력해주세요'),
  phoneNumber: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '올바른 핸드폰 번호를 입력해주세요'),
  password: z.string().min(4, '비밀번호는 4자 이상 입력해주세요'),
});

type CheckBookingFormData = z.infer<typeof checkBookingSchema>;

/**
 * 예약 확인 페이지
 * - 예약번호, 핸드폰 번호, 비밀번호로 예약 조회
 */
export default function CheckBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckBookingFormData>({
    resolver: zodResolver(checkBookingSchema),
  });

  const onSubmit = async (data: CheckBookingFormData) => {
    setIsLoading(true);

    try {
      // TODO: API 호출하여 예약 조회
      // 임시로 예약번호를 그대로 사용
      toast({
        title: '예약 조회 중...',
        description: '예약 정보를 확인하고 있습니다.',
      });

      // 예약 상세 페이지로 이동
      router.push(`/bookings/detail?bookingNumber=${data.bookingNumber}&phone=${data.phoneNumber}&password=${data.password}`);
    } catch (error) {
      toast({
        title: '예약 조회 실패',
        description: '예약 정보를 찾을 수 없거나 입력 정보가 올바르지 않습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Search className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">예약 확인</CardTitle>
          <CardDescription>
            예약번호와 예약 시 입력한 정보로 예약을 확인하실 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookingNumber">예약번호 *</Label>
              <Input
                id="bookingNumber"
                placeholder="BK-XXXXXXXX"
                {...register('bookingNumber')}
                className={errors.bookingNumber ? 'border-destructive' : ''}
              />
              {errors.bookingNumber && (
                <p className="text-sm text-destructive">{errors.bookingNumber.message}</p>
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
                placeholder="예약 시 입력한 비밀번호"
                {...register('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? '조회 중...' : '예약 확인하기'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">안내</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 예약번호는 예약 완료 시 발급됩니다.</li>
              <li>• 예약 시 입력한 핸드폰 번호와 비밀번호를 입력해주세요.</li>
              <li>• 예약 취소는 공연 1일 전까지 가능합니다.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

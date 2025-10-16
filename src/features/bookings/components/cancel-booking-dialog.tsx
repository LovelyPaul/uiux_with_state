'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, reasonDetail?: string) => void;
  isLoading?: boolean;
}

const CANCEL_REASONS = [
  { value: 'schedule_conflict', label: '일정 변경' },
  { value: 'personal_reason', label: '개인 사정' },
  { value: 'duplicate_booking', label: '중복 예약' },
  { value: 'wrong_booking', label: '잘못된 예약' },
  { value: 'other', label: '기타' },
];

/**
 * 예약 취소 다이얼로그 컴포넌트
 * @param open - 다이얼로그 열림 상태
 * @param onOpenChange - 열림 상태 변경 핸들러
 * @param onConfirm - 취소 확인 핸들러
 * @param isLoading - 로딩 상태
 */
export function CancelBookingDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, reasonDetail || undefined);
  };

  const handleClose = () => {
    setReason('');
    setReasonDetail('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>예약 취소</DialogTitle>
          <DialogDescription>
            예약을 취소하시겠습니까? 취소 후 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">취소 사유</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="취소 사유를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonDetail">상세 사유 (선택)</Label>
            <Textarea
              id="reasonDetail"
              placeholder="추가로 전달하실 내용이 있다면 작성해주세요"
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            돌아가기
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason || isLoading}
          >
            {isLoading ? '처리 중...' : '취소하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

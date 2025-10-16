'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * URL 쿼리 파라미터를 관리하는 훅
 * @returns 현재 쿼리 파라미터와 업데이트 함수
 */
export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * 쿼리 파라미터를 업데이트하고 URL을 변경
   * @param updates - 업데이트할 파라미터 객체 (null 값은 제거됨)
   * @param options - 라우팅 옵션
   */
  const setQueryParams = useCallback(
    (
      updates: Record<string, string | number | null | undefined>,
      options?: { scroll?: boolean; shallow?: boolean }
    ) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      if (options?.shallow) {
        // shallow 라우팅: 페이지 리로드 없이 URL만 변경
        window.history.pushState(null, '', url);
      } else {
        router.push(url, { scroll: options?.scroll ?? true });
      }
    },
    [pathname, router, searchParams]
  );

  /**
   * 특정 쿼리 파라미터 값 가져오기
   * @param key - 파라미터 키
   * @returns 파라미터 값 또는 null
   */
  const getQueryParam = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  /**
   * 모든 쿼리 파라미터를 객체로 변환
   * @returns 쿼리 파라미터 객체
   */
  const getAllQueryParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  /**
   * 모든 쿼리 파라미터 제거
   */
  const clearQueryParams = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return {
    queryParams: searchParams,
    setQueryParams,
    getQueryParam,
    getAllQueryParams,
    clearQueryParams,
  };
}

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface ConcertFilterProps {
  onFilterChange: (filters: {
    search?: string;
    genre?: string;
    sortBy?: 'latest' | 'popularity' | 'price';
  }) => void;
  initialSearch?: string;
  initialGenre?: string;
  initialSortBy?: 'latest' | 'popularity' | 'price';
}

const GENRE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'rock', label: '록' },
  { value: 'pop', label: '팝' },
  { value: 'hiphop', label: '힙합' },
  { value: 'jazz', label: '재즈' },
  { value: 'classical', label: '클래식' },
  { value: 'edm', label: 'EDM' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popularity', label: '인기순' },
  { value: 'price', label: '가격순' },
];

/**
 * 콘서트 필터 컴포넌트
 * @param onFilterChange - 필터 변경 핸들러
 * @param initialSearch - 초기 검색어
 * @param initialGenre - 초기 장르
 * @param initialSortBy - 초기 정렬 기준
 */
export function ConcertFilter({
  onFilterChange,
  initialSearch = '',
  initialGenre = 'all',
  initialSortBy = 'latest',
}: ConcertFilterProps) {
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [genre, setGenre] = useState(initialGenre);
  const [sortBy, setSortBy] = useState(initialSortBy);

  const debouncedSearch = useDebounce(searchInput, 500);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    onFilterChange({
      search: undefined,
      genre: genre === 'all' ? undefined : genre,
      sortBy: sortBy as 'latest' | 'popularity' | 'price',
    });
  };

  const handleGenreChange = (value: string) => {
    setGenre(value);
    onFilterChange({
      search: debouncedSearch || undefined,
      genre: value === 'all' ? undefined : value,
      sortBy: sortBy as 'latest' | 'popularity' | 'price',
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as 'latest' | 'popularity' | 'price');
    onFilterChange({
      search: debouncedSearch || undefined,
      genre: genre === 'all' ? undefined : genre,
      sortBy: value as 'latest' | 'popularity' | 'price',
    });
  };

  // Debounced search가 변경될 때 필터 적용
  useEffect(() => {
    if (debouncedSearch !== initialSearch) {
      onFilterChange({
        search: debouncedSearch || undefined,
        genre: genre === 'all' ? undefined : genre,
        sortBy: sortBy as 'latest' | 'popularity' | 'price',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="콘서트 제목이나 아티스트를 검색하세요"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleSearchClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Select value={genre} onValueChange={handleGenreChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="장르 선택" />
          </SelectTrigger>
          <SelectContent>
            {GENRE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

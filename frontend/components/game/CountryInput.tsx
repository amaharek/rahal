'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { searchCountries } from '@/lib/api/game';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { debounce } from '@/lib/utils';
import { useDirection } from '@/lib/hooks/useDirection';

interface Country {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  flag_emoji: string | null;
}

interface CountryInputProps {
  onSelect: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CountryInput({
  onSelect,
  placeholder = '\u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u0627\u0644\u062F\u0648\u0644\u0629...',
  disabled,
  autoFocus,
}: CountryInputProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const direction = useDirection();

  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setDebouncedQuery(value);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetQuery(query);
  }, [query, debouncedSetQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ['countries', debouncedQuery],
    queryFn: () => searchCountries(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: 60000,
  });

  const suggestions = data?.suggestions || [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (country: Country) => {
    onSelect(country);
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    setIsOpen(debouncedQuery.length >= 1 && suggestions.length > 0);
    setSelectedIndex(0);
  }, [debouncedQuery, suggestions.length]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-text-muted" />
        </div>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => debouncedQuery.length >= 1 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="text-base ps-12 h-14 rounded-2xl"
          autoComplete="off"
          dir="rtl"
        />
      </div>

      {isLoading && (
        <div className="absolute end-4 top-1/2 -translate-y-1/2">
          <svg
            className="h-5 w-5 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-2xl shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {suggestions.map((country, index) => (
            <li
              key={country.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors first:rounded-t-2xl last:rounded-b-2xl',
                index === selectedIndex
                  ? 'bg-primary/5 text-primary'
                  : 'hover:bg-background'
              )}
              onClick={() => handleSelect(country)}
            >
              <span className="text-xl">{country.flag_emoji}</span>
              <span className="font-medium text-sm">{country.name_ar}</span>
              <span className="text-text-muted text-xs">
                ({country.name_en})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

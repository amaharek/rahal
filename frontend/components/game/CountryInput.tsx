'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  onFocusStart?: () => void;
  onCountryCommitted?: (countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function CountryInput({
  onSelect,
  onFocusStart,
  onCountryCommitted,
  placeholder = 'اكتب اسم الدولة...',
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

  // Debounce the search query
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setDebouncedQuery(value);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetQuery(query);
  }, [query, debouncedSetQuery]);

  // Fetch suggestions
  const { data, isLoading } = useQuery({
    queryKey: ['countries', debouncedQuery],
    queryFn: () => searchCountries(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: 60000,
  });

  const suggestions = data?.suggestions || [];

  // Handle keyboard navigation
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
    onCountryCommitted?.(country.code);
    onSelect(country);
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Show dropdown when typing
  useEffect(() => {
    setIsOpen(debouncedQuery.length >= 1 && suggestions.length > 0);
    setSelectedIndex(0);
  }, [debouncedQuery, suggestions.length]);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          onFocusStart?.();
          if (debouncedQuery.length >= 1) {
            setIsOpen(true);
          }
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="text-lg"
        autoComplete="off"
        dir={direction}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute start-4 top-1/2 -translate-y-1/2">
          <span className="animate-spin inline-block">⏳</span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {suggestions.map((country, index) => (
            <li
              key={country.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                index === selectedIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-gray-50'
              )}
              onClick={() => handleSelect(country)}
            >
              <span className="text-2xl">{country.flag_emoji}</span>
              <span className="font-medium">{country.name_ar}</span>
              <span className="text-text-secondary text-sm">
                ({country.name_en})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

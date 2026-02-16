'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { searchCountries } from '@/lib/api/game';
import { Input } from '@/components/ui/Input';

interface CountryOption {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  flag_emoji: string | null;
}

interface CountrySearchFieldProps {
  value: string | null;
  onChange: (countryCode: string | null) => void;
  label: string;
  placeholder: string;
}

export function CountrySearchField({
  value,
  onChange,
  label,
  placeholder,
}: CountrySearchFieldProps) {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!value) {
      setQuery('');
    }
  }, [value]);

  const { data, isLoading } = useQuery({
    queryKey: ['country-search-profile', query],
    queryFn: () => searchCountries(query, 8),
    enabled: query.trim().length >= 1,
    staleTime: 60_000,
  });

  const suggestions = data?.suggestions || [];

  const resolvedLabel = useMemo(
    () => (option: CountryOption) => (locale === 'ar' ? option.name_ar : option.name_en),
    [locale]
  );

  const selectCountry = (country: CountryOption) => {
    setQuery(resolvedLabel(country));
    onChange(country.code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        label={label}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isLoading && <p className="text-xs text-text-secondary mt-1">...</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((country) => (
            <li key={country.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-primary/10 flex items-center gap-2"
                onClick={() => selectCountry(country)}
              >
                <span>{country.flag_emoji}</span>
                <span>{resolvedLabel(country)}</span>
                <span className="text-xs text-text-secondary">({country.code})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

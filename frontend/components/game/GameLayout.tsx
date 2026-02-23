'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { MapPin, Home, HelpCircle, BarChart3, User } from 'lucide-react';
import { GameActionDock } from './GameActionDock';
import type { Country } from '@/types/game';

interface GameLayoutProps {
  /** Page header title */
  title: string;
  /** Page header subtitle */
  subtitle?: string;
  /** Back link — defaults to locale home */
  backHref?: string;
  /** Whether to show the mobile floating action dock */
  showMobileDock?: boolean;
  /** Mobile dock props — required when showMobileDock is true */
  dockProps?: {
    onCountrySelect: (country: Country) => void;
    onInputFocusStart: () => void;
    onCountryCommitted: (countryCode: string) => void;
    onHintRequest: () => void;
    hintDisabled: boolean;
    hintPending: boolean;
    disabled: boolean;
    placeholder: string;
    hintLabel: string;
  };
  children: React.ReactNode;
}

/**
 * Shared layout wrapper for Daily Game and Practice pages.
 * Provides: header bar, bottom navigation, and optional mobile action dock.
 */
export function GameLayout({
  title,
  subtitle,
  backHref,
  showMobileDock = false,
  dockProps,
  children,
}: GameLayoutProps) {
  const locale = useLocale();
  const t = useTranslations();
  const resolvedBackHref = backHref ?? `/${locale}`;

  return (
    <div className="min-h-screen pb-[12rem] lg:pb-20">
      <header className="bg-primary text-white py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href={resolvedBackHref}
            className="inline-flex min-h-6 items-center px-1 text-white text-sm mb-1"
          >
            ← {t('common.back')}
          </Link>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle && <p className="text-white/80 text-xs">{subtitle}</p>}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-3">
        {children}
      </div>

      {showMobileDock && dockProps && (
        <GameActionDock fixedMobile {...dockProps} />
      )}
    </div>
  );
}

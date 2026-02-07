'use client';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-end">
        {/* Global Controls - Always at the end (right in LTR, left in RTL) */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="dropdown" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

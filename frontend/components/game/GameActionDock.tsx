'use client';

import { CountryInput } from '@/components/game/CountryInput';
import { Button, Card, CardContent } from '@/components/ui';
import type { Country } from '@/types/game';

interface GameActionDockProps {
  onCountrySelect: (country: Country) => void;
  onInputFocusStart: () => void;
  onCountryCommitted: (countryCode: string) => void;
  onHintRequest: () => void;
  hintDisabled: boolean;
  hintPending: boolean;
  disabled: boolean;
  placeholder: string;
  hintLabel: string;
  fixedMobile?: boolean;
}

export function GameActionDock({
  onCountrySelect,
  onInputFocusStart,
  onCountryCommitted,
  onHintRequest,
  hintDisabled,
  hintPending,
  disabled,
  placeholder,
  hintLabel,
  fixedMobile = false,
}: GameActionDockProps) {
  return (
    <div
      className={fixedMobile ? 'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden' : ''}
      data-testid="game-action-dock"
    >
      <div className={fixedMobile ? 'mx-auto w-full max-w-7xl px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]' : ''}>
        <Card className={fixedMobile ? 'shadow-xl' : ''}>
          <CardContent className="space-y-3 py-3">
            <CountryInput
              onSelect={onCountrySelect}
              onFocusStart={onInputFocusStart}
              onCountryCommitted={onCountryCommitted}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={!fixedMobile}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={hintDisabled || hintPending}
              onClick={onHintRequest}
              data-testid="game-hint-button"
            >
              {hintLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

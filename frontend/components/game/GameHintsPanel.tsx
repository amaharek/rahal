'use client';

import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import type { HintResponse } from '@/types/game';

interface GameHintsPanelProps {
  hintsUsed: number;
  nextHintLabel: string;
  hintsTitle: string;
  hintsRemainingLabel: string;
  hintPending: boolean;
  currentHint: HintResponse | null;
  formatHintDisplay: (hint: HintResponse) => string;
  onHintRequest: () => void;
}

export function GameHintsPanel({
  hintsUsed,
  nextHintLabel,
  hintsTitle,
  hintsRemainingLabel,
  hintPending,
  currentHint,
  formatHintDisplay,
  onHintRequest,
}: GameHintsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {hintsTitle} ({3 - hintsUsed} {hintsRemainingLabel})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          disabled={hintsUsed >= 3 || hintPending}
          className="w-full"
          onClick={onHintRequest}
        >
          {nextHintLabel}
        </Button>
        {currentHint && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-900">{formatHintDisplay(currentHint)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

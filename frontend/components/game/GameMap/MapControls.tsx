'use client';

import { Plus, Minus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { MapControlsProps } from '@/types/geo';

export function MapControls({
  onZoomIn,
  onZoomOut,
  onReset,
  className,
}: MapControlsProps) {
  return (
    <div
      className={cn(
        'absolute bottom-4 left-4 flex flex-col gap-2 z-10',
        className
      )}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        className="w-10 h-10 p-0 bg-white shadow-md hover:bg-gray-50"
        aria-label="Zoom in"
      >
        <Plus className="Plus w-5 h-5" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        className="w-10 h-10 p-0 bg-white shadow-md hover:bg-gray-50"
        aria-label="Zoom out"
      >
        <Minus className="Minus w-5 h-5" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="w-10 h-10 p-0 bg-white shadow-md hover:bg-gray-50"
        aria-label="Reset view"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
}

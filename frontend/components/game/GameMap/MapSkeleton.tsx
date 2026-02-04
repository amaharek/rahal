'use client';

import { cn } from '@/lib/utils';

interface MapSkeletonProps {
  className?: string;
}

export function MapSkeleton({ className }: MapSkeletonProps) {
  return (
    <div
      className={cn(
        'relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl animate-spin inline-block">🌍</span>
          <p className="mt-2 text-sm text-text-secondary">Loading map...</p>
        </div>
      </div>
    </div>
  );
}

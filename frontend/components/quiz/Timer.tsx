'use client';

import { useState, useEffect, useRef } from 'react';
import { cn, formatArabicNumber } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface TimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  onTick?: (remaining: number) => void;
  isPaused?: boolean;
  resetTrigger?: number;
  showProgress?: boolean;
  locale: 'ar' | 'en' | 'es';
  useArabicNumerals?: boolean;
  format?: 'default' | 'compact';
  /** 'box' = original boxed timer, 'bar' = full-width progress bar (Kahoot-style) */
  variant?: 'box' | 'bar';
}

function formatTime(seconds: number, format: 'default' | 'compact' = 'default', useArabicNumerals = false): string {
  if (format === 'compact') {
    const display = useArabicNumerals ? formatArabicNumber(seconds) : seconds.toString();
    return `${display}s`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  if (useArabicNumerals) {
    return formatted.split('').map(char => {
      if (char >= '0' && char <= '9') {
        return formatArabicNumber(parseInt(char));
      }
      return char;
    }).join('');
  }

  return formatted;
}

export default function Timer({
  initialSeconds,
  onExpire,
  onTick,
  isPaused = false,
  resetTrigger,
  showProgress = false,
  locale,
  useArabicNumerals = false,
  format = 'default',
  variant = 'box',
}: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);
  const t = useTranslations();

  // Keep refs updated
  onExpireRef.current = onExpire;
  onTickRef.current = onTick;

  // Handle reset trigger changes
  useEffect(() => {
    setSeconds(initialSeconds);
    hasExpiredRef.current = false;
  }, [resetTrigger, initialSeconds]);

  // Main timer effect
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start if paused or already at 0
    if (isPaused || seconds <= 0) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 0) return 0;

        const newVal = prev - 1;

        if (newVal <= 0) {
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            setTimeout(() => onExpireRef.current?.(), 0);
          }
          return 0;
        }

        onTickRef.current?.(newVal);
        return newVal;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, seconds]);

  const percentage = (seconds / initialSeconds) * 100;
  const isWarning = seconds <= 5 && seconds > 3;
  const isCritical = seconds <= 3 && seconds > 0;
  const ariaLabel = t('common.timeRemaining');

  // Bar variant — full-width progress bar (Kahoot-style)
  if (variant === 'bar') {
    const barColor = isCritical
      ? 'bg-red-500'
      : isWarning
      ? 'bg-yellow-500'
      : 'bg-green-500';

    return (
      <div
        role="timer"
        aria-label={ariaLabel}
        aria-live={isCritical ? 'assertive' : 'polite'}
        className="w-full h-1.5 bg-border/50"
      >
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear rounded-r-full',
            barColor,
            isCritical && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }

  // Box variant — original boxed timer
  const displayTime = formatTime(seconds, format, useArabicNumerals);

  return (
    <div
      role="timer"
      aria-label={ariaLabel}
      aria-live={isCritical ? 'assertive' : 'polite'}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg',
        'bg-surface border border-border',
        isWarning && 'warning danger border-yellow-500 bg-yellow-50',
        isCritical && 'critical error border-red-500 bg-red-50'
      )}
    >
      {/* Timer icon */}
      <span role="img" aria-hidden="true" className="text-xl">
        ⏱️
      </span>

      {/* Time display */}
      <span
        className={cn(
          'font-mono text-xl font-bold',
          isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-text-primary'
        )}
      >
        {displayTime}
      </span>

      {/* Progress circle */}
      {showProgress && (
        <div
          role="progressbar"
          aria-valuenow={seconds}
          aria-valuemax={initialSeconds}
          aria-label="timer progress"
          className="ml-2"
        >
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-border"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(seconds / initialSeconds) * 88} 88`}
              className={cn(
                isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-primary'
              )}
            />
          </svg>
        </div>
      )}
    </div>
  );
}

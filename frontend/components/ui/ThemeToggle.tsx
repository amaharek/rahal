'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './Button';

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeLabels = {
  light: '\u0641\u0627\u062A\u062D',
  dark: '\u062F\u0627\u0643\u0646',
  system: '\u062D\u0633\u0628 \u0627\u0644\u0646\u0638\u0627\u0645',
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const Icon = themeIcons[theme];

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`\u0627\u0644\u0645\u0638\u0647\u0631 \u0627\u0644\u062D\u0627\u0644\u064A: ${themeLabels[theme]}. \u0627\u0646\u0642\u0631 \u0644\u0644\u062A\u0628\u062F\u064A\u0644`}
      title={themeLabels[theme]}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'system'; label: string; Icon: typeof Sun }> = [
    { value: 'light', label: '\u0641\u0627\u062A\u062D', Icon: Sun },
    { value: 'dark', label: '\u062F\u0627\u0643\u0646', Icon: Moon },
    { value: 'system', label: '\u062D\u0633\u0628 \u0627\u0644\u0646\u0638\u0627\u0645', Icon: Monitor },
  ];

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {themes.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            theme === value
              ? 'bg-primary text-white shadow-sm'
              : 'border border-border text-text-secondary hover:border-primary hover:text-primary'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

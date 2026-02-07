'use client';

import { useTheme } from '@/components/ThemeProvider';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './Button';

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('settings.themes');

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const Icon = themeIcons[theme];
  const currentThemeLabel = t(theme);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`${t('theme')}: ${currentThemeLabel}`}
      title={currentThemeLabel}
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
  const t = useTranslations('settings.themes');

  const themes: Array<{ value: 'light' | 'dark' | 'system'; Icon: typeof Sun }> = [
    { value: 'light', Icon: Sun },
    { value: 'dark', Icon: Moon },
    { value: 'system', Icon: Monitor },
  ];

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {themes.map(({ value, Icon }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(value)}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          <span>{t(value)}</span>
        </Button>
      ))}
    </div>
  );
}

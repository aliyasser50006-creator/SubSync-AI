'use client';

import { useEffect, useState } from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const label = mounted
    ? theme === 'dark'
      ? 'Switch to light mode'
      : theme === 'light'
      ? 'Use system theme'
      : 'Switch to dark mode'
    : 'Toggle theme';

  const Icon = !mounted ? Laptop : theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn('text-muted-foreground hover:text-foreground', className)}
          onClick={() => setTheme(nextTheme)}
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5 transition-transform duration-200" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

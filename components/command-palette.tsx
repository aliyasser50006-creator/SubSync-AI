'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Video,
  Subtitles,
  Settings,
  UserCircle,
  Sun,
  Moon,
  Monitor,
  Search,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Dashboard</span>
            <span className="ml-auto text-xs text-muted-foreground">Studio</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/library'))}
          >
            <Video className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Video Library</span>
            <span className="ml-auto text-xs text-muted-foreground">Browse</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/library/subtitles'))}
          >
            <Subtitles className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Subtitle Library</span>
            <span className="ml-auto text-xs text-muted-foreground">Assets</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/my-videos'))}
          >
            <Video className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>My Videos</span>
            <span className="ml-auto text-xs text-muted-foreground">Jobs</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/profile'))}
          >
            <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Create New Subtitle Job</span>
            <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
            <Monitor className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>System Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

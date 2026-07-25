'use client';

import { useState, useEffect } from 'react';
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
  Plus,
  ArrowRight,
  Keyboard,
  Sparkles,
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
      <CommandInput placeholder="Search commands, pages, and actions..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No results found.</p>
            <p className="text-xs text-muted-foreground/60">Try a different search term.</p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <LayoutDashboard className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Dashboard</span>
            <span className="ml-auto text-[10px] text-muted-foreground/60">Studio</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/library'))}
          >
            <Video className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Video Library</span>
            <span className="ml-auto text-[10px] text-muted-foreground/60">Browse</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/library/subtitles'))}
          >
            <Subtitles className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Subtitle Library</span>
            <span className="ml-auto text-[10px] text-muted-foreground/60">Assets</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/my-videos'))}
          >
            <Video className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>My Videos</span>
            <span className="ml-auto text-[10px] text-muted-foreground/60">Jobs</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/profile'))}
          >
            <UserCircle className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/dashboard'))}
          >
            <Plus className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Create New Subtitle Job</span>
            <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/40" />
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Appearance">
          <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
            <Sun className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
            <Moon className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
            <Monitor className="mr-2.5 h-4 w-4 text-muted-foreground" />
            <span>System Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

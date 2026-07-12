import Link from 'next/link';
import { Clapperboard, SearchX, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LibraryEmptyStateProps {
  type: 'empty' | 'no-results';
  searchQuery?: string;
  onClearFilters?: () => void;
}

export function LibraryEmptyState({ type, searchQuery, onClearFilters }: LibraryEmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background/45 px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
          <SearchX className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-5 text-xl font-semibold">
          {searchQuery
            ? <>No videos found matching &quot;{searchQuery}&quot;.</>
            : 'No videos match your filters'}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Try another keyword or adjust the status filter.
        </p>
        {onClearFilters && (
          <Button variant="outline" className="mt-6" onClick={onClearFilters}>
            Clear all filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-background/45 px-6 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 shadow-glow ring-1 ring-primary/20">
        <Clapperboard className="h-10 w-10 text-primary" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">Your library is empty</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Upload a video or generate subtitles from a URL on your dashboard to start building your library.
      </p>
      <div className="mt-8 flex justify-center">
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/dashboard">
            <Plus className="mr-2 h-5 w-5" />
            Add new video
          </Link>
        </Button>
      </div>
    </div>
  );
}

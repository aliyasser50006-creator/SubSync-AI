'use client';

export function SearchTrigger() {
  return (
    <button
      className="flex items-center gap-2 rounded-lg border border-border/40 bg-surface-hover/50 px-3 py-1 text-[11px] text-muted-foreground transition-all hover:border-border-strong hover:text-foreground"
      onClick={() => {
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true });
        document.dispatchEvent(event);
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <span>Search...</span>
      <span className="flex gap-0.5 ml-2">
        <span className="kbd">⌘</span>
        <span className="kbd">K</span>
      </span>
    </button>
  );
}

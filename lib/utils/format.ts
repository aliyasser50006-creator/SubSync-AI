export function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(email?: string): string {
  if (!email) return 'SS';
  return email.slice(0, 2).toUpperCase();
}

export function formatDate(value?: string | Date): string {
  if (!value) return 'Unavailable';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

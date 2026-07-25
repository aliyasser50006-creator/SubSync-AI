/**
 * Escapes special characters in a string for safe use in a Supabase / PostgreSQL
 * ILIKE pattern. Prevents accidental wildcard expansion when user input contains
 * `%`, `_`, or the escape character `\`.
 *
 * PostgreSQL ILIKE special characters:
 *  - `%`  — matches any sequence of characters
 *  - `_`  — matches any single character
 *  - `\`  — default escape character (must be escaped first)
 *
 * @example
 * // Raw user input: "100% done"
 * // Without escaping: ILIKE '%100% done%' — the bare `%` acts as a wildcard
 * // With escaping:    ILIKE '%100\% done%' — matches the literal string
 * escapeIlike('100% done') // → '100\\% done'
 */
export function escapeIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Returns a trimmed, ILIKE-safe version of the input, or `null` if the input
 * is empty or whitespace-only after trimming. Use the `null` return value as a
 * signal to skip the search query entirely.
 */
export function sanitizeSearchQuery(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return escapeIlike(trimmed);
}

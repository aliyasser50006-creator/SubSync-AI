export const VALIDATION = {
  MAX_CPS: 20,
  MAX_TOTAL_CHARS: 84,
  MAX_LINES_PER_CUE: 2,
  MAX_CHARS_PER_LINE: 42,
  MIN_DURATION_SECONDS: 0.5,
  MAX_DURATION_SECONDS: 10.0,
  MIN_GAP_MS: 80,
  MAX_SILENCE_SECONDS: 15.0,
  DEBOUNCE_MS: 400,
} as const;

export const HEALTH_SCORE_RATINGS = [
  { min: 95, label: 'Excellent', color: 'success' },
  { min: 80, label: 'Good', color: 'primary' },
  { min: 60, label: 'Needs Attention', color: 'warning' },
  { min: 0, label: 'Poor', color: 'destructive' },
] as const;

export function getHealthRating(score: number) {
  for (const rating of HEALTH_SCORE_RATINGS) {
    if (score >= rating.min) {
      return rating;
    }
  }
  return HEALTH_SCORE_RATINGS[HEALTH_SCORE_RATINGS.length - 1];
}

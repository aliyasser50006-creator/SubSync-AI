import { SubtitleSettings } from '@/lib/types/database';

export interface BrowseVideo {
  id: string;
  name: string;
  video_url: string;
  subtitle_url?: string | null;
  subtitle_file?: string | null;
  subtitle_settings?: SubtitleSettings | null;
  created_at?: string;
}

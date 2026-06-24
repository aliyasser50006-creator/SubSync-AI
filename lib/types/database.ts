export interface Job {
  id: string;
  user_id: string;
  title: string | null;
  video_url: string;
  subtitle_file: string;
  output_video: string | null;
  status: 'pending' | 'processing' | 'ready' | 'done' | 'failed';
  error_message: string | null;
  subtitle_settings: SubtitleSettings;
  created_at: string;
  updated_at: string;
}

export interface SubtitleSettings {
  fontSize?: number;
  fontColor?: string;
  position?: 'top' | 'bottom';
  alignment?: 'left' | 'center' | 'right';
  background?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
}

export interface Subtitle {
  id: string;
  user_id: string;
  title: string;
  format: 'srt' | 'vtt';
  line_count: number;
  size: number;
  subtitle_content: string;
  path: string;
  created_at: string;
  updated_at: string;
  job_status?: string;
}

export interface EditableCue {
  id: string;
  index: number;
  start: number;
  end: number;
  text: string;
}

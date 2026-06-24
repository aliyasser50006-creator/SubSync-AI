'use server';

import { createClient } from '@/lib/supabase/server';
import { Job, SubtitleSettings } from '@/lib/types/database';

export async function createJob(
  title: string,
  videoUrl: string,
  subtitleFile: string,
  subtitleSettings: SubtitleSettings
): Promise<{ data?: Job; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        title,
        video_url: videoUrl,
        subtitle_file: subtitleFile,
        subtitle_settings: subtitleSettings,
        status: 'ready',
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Job };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to create job' };
  }
}

export async function getJobById(jobId: string): Promise<{ data?: Job; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Job };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to fetch job' };
  }
}

export async function getUserJobs(): Promise<{ data?: Job[]; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: data as Job[] };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'Failed to fetch jobs' };
  }
}

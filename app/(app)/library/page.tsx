import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LibraryHeader } from '@/components/library/library-header';
import { LibraryClient } from '@/components/library/library-client';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Manage your uploaded videos, track processing status, and review generated subtitles.',
};

export default async function LibraryRoutePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch counts efficiently
  const { count: totalCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: readyCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['ready', 'done']);

  const { count: processingCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['processing', 'pending']);

  return (
    <div className="app-page pb-24">
      <LibraryHeader 
        totalCount={totalCount || 0} 
        readyCount={readyCount || 0} 
        processingCount={processingCount || 0} 
      />
      <LibraryClient initialTotalCount={totalCount || 0} />
    </div>
  );
}


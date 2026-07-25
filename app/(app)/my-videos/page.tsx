import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MyVideosClient } from '@/components/my-videos/my-videos-client';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'My Videos – SubSync AI',
  description: 'Review, edit, retry, download, and delete every video job in your workspace.',
};

export default async function MyVideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { count: availableCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .is('output_video', null)
    .eq('user_id', user.id);

  const { count: unavailableCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .not('output_video', 'is', null)
    .eq('user_id', user.id);

  return (
    <div className="app-page">
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Video management</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">My Videos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Review, edit, retry, download, and delete every video job in your workspace.
          </p>
        </div>
      </header>

      <MyVideosClient 
        initialAvailableCount={availableCount || 0}
        initialUnavailableCount={unavailableCount || 0}
      />
    </div>
  );
}

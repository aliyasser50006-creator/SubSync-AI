import { Metadata } from 'next';
import { SubtitleEditorPage } from '@/components/subtitles/editor/subtitle-editor-page';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Edit Subtitle – SubSync AI`,
    description: 'Professional subtitle editor with real-time preview and validation.',
  };
}

export default function SubtitleEditorRoute({ params }: Props) {
  return <SubtitleEditorPage subtitleId={params.id} />;
}

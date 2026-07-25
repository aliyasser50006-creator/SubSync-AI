import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SubSync AI',
    short_name: 'SubSync',
    description: 'Preview, style, and manage subtitle video workflows.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#07111f',
    theme_color: '#06b6d4',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

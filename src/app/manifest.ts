import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OONE Fleet — Company Car Booking',
    short_name: 'OONE Fleet',
    description: 'Book company vehicles, approve requests and dispatch drivers.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F6F8',
    theme_color: '#875A7B',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

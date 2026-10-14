import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'OONE Fleet — Company Car Booking',
  description: 'Book company vehicles, approve requests, dispatch drivers and manage the OONE fleet.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'OONE Fleet' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F6F8' },
    { media: '(prefers-color-scheme: dark)', color: '#0D111B' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Kantumruy+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        {/* Apply saved theme before paint to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('oone_fleet_theme_v3')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');var l=localStorage.getItem('oone_fleet_lang_v3');if(l==='kh')document.documentElement.lang='km'}catch(e){}`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { PassCheck } from '@/components/screens/pass-check';

export default function Home() {
  // Data lives in localStorage, so render only after mount to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [passToken, setPassToken] = useState<string | null>(null);
  useEffect(() => {
    // A scanned vehicle-pass QR opens /?pass=… → show the pass check instead of the app
    setPassToken(new URLSearchParams(window.location.search).get('pass'));
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div className="mx-auto min-h-dvh max-w-[430px] space-y-3 p-4 pt-16" suppressHydrationWarning>
        {[120, 72, 180, 180].map((h, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-muted" style={{ height: h }} suppressHydrationWarning />
        ))}
      </div>
    );
  }
  return passToken ? <PassCheck token={passToken} /> : <AppShell />;
}

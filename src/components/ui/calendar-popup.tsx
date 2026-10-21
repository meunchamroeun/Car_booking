'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

/**
 * Small centred popup for a calendar, shown above everything (including sheets) so the
 * whole month is visible without scrolling. Tap outside or press Esc to close.
 */
export function CalendarPopup({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Read by screen readers only. */
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          // Don't focus an input on open (it would pop up the phone keyboard); focus the panel instead
          onOpenAutoFocus={e => (e.preventDefault(), (e.currentTarget as HTMLElement).focus())}
          className="fixed left-1/2 top-1/2 z-[81] w-[min(360px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-float outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

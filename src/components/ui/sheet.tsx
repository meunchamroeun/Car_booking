'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobile bottom sheet built on Radix Dialog (focus trap, Esc to close,
 * scroll lock, aria wiring). Footer stays pinned above the safe area.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  hideHeader,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideHeader?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-black/60" />
        <Dialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[430px] flex-col rounded-t-[28px] bg-background shadow-float outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200',
            className
          )}
        >
          <div className="flex justify-center pb-1 pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-foreground/15" />
          </div>
          <div className={cn('flex items-start justify-between gap-3 px-5 pb-3 pt-1', hideHeader && 'sr-only')}>
            <div className="min-w-0">
              <Dialog.Title className="text-[18px] font-bold tracking-tight">{title}</Dialog.Title>
              {description && <Dialog.Description className="mt-0.5 text-[13px] text-muted-foreground">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground" aria-label="Close">
              <X className="size-[18px]" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
          {footer && <div className="pb-safe border-t bg-background/95 px-5 pt-3 backdrop-blur">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Small key/value row used in detail sheets. */
export function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-medium text-muted-foreground">{label}</div>
        <div className="text-[14px] font-semibold">{children}</div>
      </div>
    </div>
  );
}

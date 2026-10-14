import * as React from 'react';
import { cn } from '@/lib/utils';

const field =
  'w-full rounded-xl border border-input bg-card px-3.5 text-[14.5px] text-foreground placeholder:text-muted-foreground/70 transition-[border-color,box-shadow] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/12 disabled:opacity-50 aria-[invalid=true]:border-destructive';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(field, 'h-11', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-[84px] resize-none py-2.5 leading-relaxed', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-foreground/85">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        {hint && <span className="text-[12px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[12.5px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,box-shadow,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        navy: 'bg-navy text-navy-foreground hover:bg-navy/90 dark:bg-primary dark:text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        soft: 'bg-primary-soft text-primary hover:bg-primary/15',
        outline: 'border border-input bg-card hover:bg-muted',
        ghost: 'hover:bg-muted',
        success: 'bg-success text-white hover:bg-success/90 dark:text-background',
        destructive: 'bg-destructive text-white hover:bg-destructive/90 dark:text-background',
        'destructive-soft': 'bg-destructive-soft text-destructive hover:bg-destructive/15',
        glass: 'bg-white/12 text-white ring-1 ring-inset ring-white/20 backdrop-blur hover:bg-white/20',
        link: 'text-primary underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        default: 'h-11 rounded-xl px-4 text-[14px]',
        sm: 'h-9 rounded-lg px-3 text-[13px] [&_svg]:size-4',
        lg: 'h-12 rounded-2xl px-5 text-[15px]',
        icon: 'size-10 rounded-full',
        'icon-sm': 'size-8 rounded-full [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-primary via-fuchsia-500 to-accent text-primary-foreground shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:brightness-110',
        outline:
          'border border-white/20 bg-transparent text-foreground hover:bg-white/10 hover:text-white shadow-md shadow-white/5',
        ghost: 'bg-transparent text-foreground hover:bg-white/10 hover:text-white',
        destructive:
          'bg-red-500/90 text-white shadow-lg shadow-red-500/30 hover:bg-red-500 focus-visible:ring-red-400/60',
        secondary:
          'bg-secondary text-secondary-foreground shadow-lg shadow-black/30 hover:bg-secondary/80',
      } satisfies Record<ButtonVariant, string>,
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      } satisfies Record<ButtonSize, string>,
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);

Button.displayName = 'Button';

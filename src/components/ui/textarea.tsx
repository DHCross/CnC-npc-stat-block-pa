import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-white/15 bg-slate-950/60 px-4 py-3 text-sm text-foreground shadow-inner shadow-black/30 placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

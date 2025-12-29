# Chunk 24

### src/components/ui/aspect-ratio.tsx

```tsx
// Aspect Ratio component
```

### src/components/ui/alert-dialog.tsx

```tsx
// Alert Dialog component
```

### src/components/ui/pagination.tsx

```tsx
// Pagination component
```

### src/components/ui/tabs.tsx

```tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

### src/components/ui/card.tsx

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-white/10 bg-card/90 text-card-foreground shadow-xl shadow-black/30 backdrop-blur-xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/20',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-2 p-6 pb-4', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-tight tracking-tight text-card-foreground', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-card-foreground/70', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 text-card-foreground/90', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0 text-card-foreground/90', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

```

### src/components/ui/slider.tsx

```tsx
// Slider component
```

### src/components/ui/popover.tsx

```tsx
// Popover component
```

### src/components/ui/progress.tsx

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

### src/components/ui/input-otp.tsx

```tsx
// Input OTP component
```

### src/components/ui/chart.tsx

```tsx
// Chart component
```

### src/components/ui/hover-card.tsx

```tsx
// Hover Card component
```

### src/components/ui/sheet.tsx

```tsx
// Sheet component
```

### src/components/ui/scroll-area.tsx

```tsx
'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
```

### src/components/ui/resizable.tsx

```tsx
// Resizable component
```

### src/components/ui/label.tsx

```tsx
// Label component
```

### src/components/ui/sonner.tsx

```tsx
import * as React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export const Toaster: React.FC<ToasterProps> = (props) => (
  <SonnerToaster position="top-right" richColors closeButton {...props} />
);

```

### src/components/ui/navigation-menu.tsx

```tsx
// Navigation Menu component
```

### src/components/ui/accordion.tsx

```tsx
// Accordion component
```

### src/components/ui/drawer.tsx

```tsx
// Drawer component
```

### src/components/ui/tooltip.tsx

```tsx
// Tooltip component
```

### src/components/ui/alert.tsx

```tsx
import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'destructive';
}

export const Alert: React.FC<AlertProps> = ({ variant = 'default', className = '', children, ...props }) => {
        const base = 'rounded-xl border px-4 py-3 flex items-start gap-3 shadow-lg backdrop-blur-md';
        const variants = {
                default: 'bg-slate-900/70 border-white/15 text-foreground',
                destructive: 'bg-red-500/15 border-red-500/40 text-red-100',
        } satisfies Record<NonNullable<AlertProps['variant']>, string>;
        return (
                <div className={`${base} ${variants[variant]} ${className}`} {...props}>
                        {children}
                </div>
        );
};

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
        <div className={`text-sm leading-relaxed ${className}`} {...props}>
                {children}
        </div>
);
```

### src/components/ui/switch.tsx

```tsx
import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/15 bg-white/10 transition-all shadow-inner shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary/70 data-[state=unchecked]:bg-white/10',
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg shadow-primary/30 transition-transform data-[state=checked]:translate-x-[1.4rem] data-[state=unchecked]:translate-x-1'
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

```

### src/components/ui/calendar.tsx

```tsx
// Calendar component
```

### src/components/ui/breadcrumb.tsx

```tsx
// Breadcrumb component
```

### src/components/ui/radio-group.tsx

```tsx
// Radio Group component
```

### src/components/ui/command.tsx

```tsx
// Command component
```

### src/components/ui/toggle-group.tsx

```tsx
// Toggle Group component
```

### src/components/ui/avatar.tsx

```tsx
// Avatar component
```

### src/components/ui/menubar.tsx

```tsx
// Menubar component
```

### src/components/ui/dialog.tsx

```tsx
'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

### src/components/ui/badge.tsx

```tsx
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: 'default' | 'outline' | 'destructive';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', children, ...props }) => {
        const base =
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors';
        const variants = {
                default: 'border-primary/50 bg-primary/10 text-primary',
                outline: 'border-white/25 bg-white/5 text-foreground/80',
                destructive: 'border-red-500/40 bg-red-500/10 text-red-200',
        } satisfies Record<NonNullable<BadgeProps['variant']>, string>;

        return (
                <span className={`${base} ${variants[variant]} ${className}`} {...props}>
                        {children}
                </span>
        );
};
```

### src/components/ui/sidebar.tsx

```tsx
// Sidebar component
```

### src/components/ui/table.tsx

```tsx
// Table component
```

### src/components/ui/separator.tsx

```tsx
import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';

export type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-white/10',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';

```

### src/components/ui/button.tsx

```tsx
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

```

### src/components/ui/toggle.tsx

```tsx
// Toggle component
```

### src/components/ui/checkbox.tsx

```tsx
// Checkbox component
```

### src/components/ui/collapsible.tsx

```tsx
import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '@/lib/utils';

export const Collapsible = CollapsiblePrimitive.Root;

export const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger ref={ref} className={cn('flex w-full', className)} {...props} />
));
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

export const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Content ref={ref} className={cn('overflow-hidden', className)} {...props} />
));
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

```

### src/components/ui/dropdown-menu.tsx

```tsx
// Dropdown Menu component
```

### src/components/ui/select.tsx

```tsx
// Select component
```

### src/components/ui/textarea.tsx

```tsx
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

```

### src/components/ui/input.tsx

```tsx
// Input component
```

### src/components/ui/skeleton.tsx

```tsx
// Skeleton component
```

### src/components/ui/context-menu.tsx

```tsx
// Context Menu component
```

### src/components/ui/form.tsx

```tsx
// Form component
```

### src/components/ui/carousel.tsx

```tsx
// Carousel component
```

### src/app/api/jules/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const julesApiKey = process.env.JULES_API_KEY;
    
    if (!julesApiKey) {
      return NextResponse.json(
        { error: 'Jules API key not configured' },
        { status: 500 }
      );
    }

    // Get the last user message as the prompt
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || '';

    // Note: The actual Jules API (https://jules.googleapis.com/v1alpha/) is session-based
    // and designed for GitHub repository automation, not real-time chat.
    // For a proper implementation, you would need to:
    // 1. List sources (GitHub repos) connected to Jules
    // 2. Create a session with a source context
    // 3. Send messages within that session
    // 4. Poll for activities/responses
    
    // For now, return a helpful explanation
    return NextResponse.json({
      message: `I received your message: "${prompt}"

Note: The Jules API is designed for GitHub repository automation (creating PRs, fixing bugs, etc.), not real-time chat. 

To use Jules properly, you would need to:
1. Connect your GitHub repository to Jules via the web app
2. Create a session with your repo as the source
3. Send development tasks (e.g., "Fix bug in authentication module")
4. Jules will create a plan, make code changes, and create PRs

For a simple chat interface, you might want to use a different AI API like:
- OpenAI's GPT API
- Anthropic's Claude API  
- Google's Gemini API

Would you like help setting up one of these alternatives instead?`,
      usage: null,
    });
  } catch (error) {
    console.error('Error calling Jules API:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with Jules API' },
      { status: 500 }
    );
  }
}

```


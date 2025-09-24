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
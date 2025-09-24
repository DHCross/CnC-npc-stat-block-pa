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
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: 'default' | 'outline' | 'destructive';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', children, ...props }) => {
	const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border';
	const variants = {
		default: 'bg-gray-100 text-gray-800 border-gray-200',
		outline: 'bg-white text-gray-800 border-gray-300',
		destructive: 'bg-red-100 text-red-800 border-red-300',
	};
	return (
		<span className={`${base} ${variants[variant]} ${className}`} {...props}>
			{children}
		</span>
	);
};
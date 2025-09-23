import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'destructive';
}

export const Alert: React.FC<AlertProps> = ({ variant = 'default', className = '', children, ...props }) => {
	const base = 'rounded border px-4 py-3 flex items-center gap-2';
	const variants = {
		default: 'bg-gray-50 border-gray-200 text-gray-800',
		destructive: 'bg-red-50 border-red-200 text-red-800',
	};
	return (
		<div className={`${base} ${variants[variant]} ${className}`} {...props}>
			{children}
		</div>
	);
};

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
	<div className={`text-sm ${className}`} {...props}>
		{children}
	</div>
);
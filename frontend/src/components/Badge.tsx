import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
    pulse?: boolean;
    className?: string;
}

export default function Badge({
    children,
    variant = 'default',
    pulse = false,
    className
}: BadgeProps) {
    const variants = {
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        info: 'badge-info',
        default: 'bg-white/10 text-white/80 border border-white/20',
    };

    return (
        <span className={clsx('badge', variants[variant], pulse && 'animate-glow-pulse', className)}>
            {pulse && (
                <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
            )}
            {children}
        </span>
    );
}

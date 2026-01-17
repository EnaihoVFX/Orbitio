import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'strong' | 'subtle';
    hover?: boolean;
    glow?: boolean;
    id?: string;
    style?: React.CSSProperties;
}

export default function Card({
    children,
    className,
    variant = 'default',
    hover = false,
    glow = false,
    id,
    style
}: CardProps) {
    const variants = {
        default: 'group relative bg-card/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300',
        strong: 'group relative bg-card/80 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl overflow-hidden',
        subtle: 'group relative bg-card/20 backdrop-blur-md border border-white/5 shadow-lg rounded-2xl overflow-hidden',
    };

    return (
        <div
            id={id}
            style={style}
            className={clsx(
                variants[variant],
                hover && 'card-interactive',
                glow && 'neon-border',
                className
            )}
        >
            {/* Gradient Glow Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

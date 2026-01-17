import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'premium' | 'glass' | 'text';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    children,
    className,
    disabled,
    style,
    ...props
}: ButtonProps) {
    const baseStyles = clsx(
        'group relative inline-flex items-center justify-center gap-2.5 font-semibold',
        'transition-all duration-300 ease-out',
        'rounded-2xl overflow-visible',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
        'active:scale-[0.98]',
        'cursor-pointer'
    );

    const variants = {
        primary: clsx(
            'bg-gradient-to-r from-primary via-blue-500 to-primary',
            'text-white font-semibold',
            'border border-white/20',
            'shadow-[0_0_20px_rgba(99,102,241,0.3),0_8px_32px_rgba(99,102,241,0.2)]',
            'backdrop-blur-sm',
            'hover:shadow-[0_0_30px_rgba(99,102,241,0.5),0_12px_40px_rgba(99,102,241,0.3)]',
            'hover:border-white/30',
            'hover:-translate-y-0.5',
            'focus:ring-primary/50'
        ),
        secondary: clsx(
            'bg-white/[0.05]',
            'text-white/90',
            'border border-white/10',
            'backdrop-blur-xl',
            'shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
            'hover:bg-white/[0.1]',
            'hover:border-white/20',
            'hover:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
            'hover:-translate-y-0.5',
            'focus:ring-white/20'
        ),
        ghost: clsx(
            'bg-transparent',
            'text-white/60',
            'border border-transparent',
            'hover:bg-white/[0.05]',
            'hover:text-white',
            'hover:border-white/5',
            'focus:ring-white/10'
        ),
        danger: clsx(
            'bg-gradient-to-r from-red-500/20 to-red-600/20',
            'text-red-400',
            'border border-red-500/30',
            'backdrop-blur-xl',
            'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
            'hover:from-red-500/30 hover:to-red-600/30',
            'hover:border-red-500/50',
            'hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]',
            'hover:text-red-300',
            'focus:ring-red-500/30'
        ),
        success: clsx(
            'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20',
            'text-emerald-400',
            'border border-emerald-500/30',
            'backdrop-blur-xl',
            'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
            'hover:from-emerald-500/30 hover:to-emerald-600/30',
            'hover:border-emerald-500/50',
            'hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
            'hover:text-emerald-300',
            'focus:ring-emerald-500/30'
        ),
        premium: clsx(
            'bg-gradient-to-r from-primary via-secondary to-accent',
            'text-white font-bold',
            'border border-white/20',
            'shadow-[0_0_30px_rgba(139,92,246,0.3),0_8px_32px_rgba(99,102,241,0.2)]',
            'hover:shadow-[0_0_40px_rgba(139,92,246,0.5),0_12px_48px_rgba(99,102,241,0.3)]',
            'hover:border-white/30',
            'hover:-translate-y-1',
            'focus:ring-secondary/50'
        ),
        glass: '',
        text: clsx(
            'bg-transparent',
            'text-white',
            'border-none shadow-none',
            'hover:text-primary transition-colors',
            'p-0 min-h-0', // Removing padding/min-height to strictly be "just text" as requested? 
            // Actually, if I remove padding it breaks layout flow potentially compared to other buttons.
            // But "just the text" implies minimal footprint.
            // Let's keep padding for now but make it transparent. 
            // Wait, if I say "just the text", I probably mean I don't want the box.
            // I will keep standard button padding for hit area but make it invisible box.
            'hover:bg-transparent'
        )
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs min-h-[32px]',
        md: 'px-5 py-2.5 text-sm min-h-[40px]',
        lg: 'px-7 py-3.5 text-base min-h-[48px]',
    };

    // CSS custom properties for the animated gradient border
    const gradientBorderStyles = variant === 'glass' ? {
        '--c1': '#dddddd',
        '--c2': '#555555',
        '--c3': '#333333',
    } as React.CSSProperties : {};

    return (
        <button
            className={clsx(
                baseStyles,
                variant !== 'glass' && variants[variant],
                sizes[size],
                variant === 'glass' && 'glass-button',
                className
            )}
            disabled={disabled || isLoading}
            style={{ ...gradientBorderStyles, ...style }}
            {...props}
        >
            {/* Glass variant specific styles */}
            {variant === 'glass' && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        @property --c1 {
                            syntax: "<color>";
                            inherits: false;
                            initial-value: #dddddd;
                        }
                        @property --c2 {
                            syntax: "<color>";
                            inherits: false;
                            initial-value: #555555;
                        }
                        @property --c3 {
                            syntax: "<color>";
                            inherits: false;
                            initial-value: #333333;
                        }
                        
                        .glass-button {
                            appearance: none;
                            position: relative;
                            background: rgba(255, 255, 255, 0.05);
                            backdrop-filter: blur(3px);
                            color: white;
                        }
                        
                        .glass-button:before {
                            content: "";
                            position: absolute;
                            pointer-events: none;
                            inset: 0px;
                            border-radius: inherit;
                            padding: 2px;
                            background: linear-gradient(
                                to bottom right,
                                var(--c1) 0%,
                                var(--c3) 33%,
                                var(--c2) 62%,
                                var(--c3) 100%
                            );
                            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                            -webkit-mask-composite: xor;
                            mask-composite: exclude;
                            transition: --c1 300ms ease, --c2 300ms ease, --c3 300ms ease;
                        }
                        
                        .glass-button:hover:before {
                            --c1: #525252;
                            --c2: #878787;
                            --c3: #414141;
                        }
                        
                        .glass-button:active:before {
                            --c1: #525252;
                            --c2: #414141;
                            --c3: #414141;
                        }
                    `
                }} />
            )}

            {/* Shine effect on hover (for all variants) */}
            <span className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </span>

            {/* Inner highlight for premium variants */}
            {(variant === 'primary' || variant === 'premium') && (
                <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-2xl" />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="opacity-80">Loading...</span>
                    </>
                ) : (
                    <>
                        {icon && <span className="flex-shrink-0">{icon}</span>}
                        {children}
                    </>
                )}
            </span>
        </button>
    );
}
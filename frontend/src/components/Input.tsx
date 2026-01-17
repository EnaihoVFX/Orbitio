import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
    helperText?: string;
    containerClassName?: string;
    focusColor?: 'primary' | 'secondary' | 'accent';
}

export default function Input({
    label,
    icon: Icon,
    error,
    helperText,
    containerClassName,
    className,
    focusColor = 'primary',
    ...props
}: InputProps) {
    const focusStyles = {
        primary: 'focus-within:text-primary focus:border-primary/50 focus:bg-primary/5',
        secondary: 'focus-within:text-secondary focus:border-secondary/50 focus:bg-secondary/5',
        accent: 'focus-within:text-accent focus:border-accent/50 focus:bg-accent/5',
    };

    const iconColorStyles = {
        primary: 'group-focus-within:text-primary',
        secondary: 'group-focus-within:text-secondary',
        accent: 'group-focus-within:text-accent',
    };

    return (
        <div className={clsx("space-y-1.5 group/input", containerClassName)}>
            {label && (
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1 transition-colors group-focus-within/input:text-white/90">
                    {label}
                </label>
            )}

            <div className="relative group">
                <div className={clsx(
                    "absolute inset-0 rounded-xl transition-all duration-300 opacity-0 group-focus-within:opacity-100",
                    focusColor === 'primary' ? 'bg-primary/20 blur-md' :
                        focusColor === 'secondary' ? 'bg-secondary/20 blur-md' : 'bg-accent/20 blur-md'
                )} />

                {Icon && (
                    <div className={clsx(
                        "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40 transition-all duration-300 z-10",
                        "group-focus-within:scale-110",
                        iconColorStyles[focusColor]
                    )}>
                        <Icon size={18} />
                    </div>
                )}

                <input
                    className={clsx(
                        "relative z-10 w-full bg-black/40 backdrop-blur-sm border rounded-xl py-3.5 text-sm transition-all duration-300 placeholder:text-white/10 shadow-inner",
                        "hover:bg-black/60 hover:border-white/20",
                        "focus:outline-none focus:bg-black/80 focus:shadow-lg",
                        Icon ? "pl-11 pr-4" : "px-4",
                        error
                            ? "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                            : `border-white/5 ${focusStyles[focusColor]}`,
                        className
                    )}
                    {...props}
                />
            </div>

            {error && (
                <p className="ml-1 text-xs text-red-400 font-medium animate-fade-in">
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p className="ml-1 text-[10px] text-white/30 uppercase tracking-wide">
                    {helperText}
                </p>
            )}
        </div>
    );
}

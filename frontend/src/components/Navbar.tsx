import React, { useState, useEffect } from 'react';
import { Terminal, Menu, X, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
    hideLinks?: boolean;
}

export default function Navbar({ hideLinks = false }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // Logic: Hide logo on Home ('/') until scrolled > 500px. Show always on other pages.
    const isHome = location.pathname === '/';
    const [showLogo, setShowLogo] = useState(!isHome);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY;
            setScrolled(currentScroll > 20);

            if (isHome) {
                setShowLogo(currentScroll > 20);
            } else {
                setShowLogo(true);
            }
        };

        // Initial check
        handleScroll();

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHome]);

    const navLinks = [
        { name: 'Features', href: '/#features' },
        { name: 'Live Demo', href: '/#demo' },
        { name: 'Docs', href: '/docs' },
    ];

    return (

        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">

                {/* 1. Logo Circle - Pops in on scroll */}
                <Link
                    to="/"
                    className={clsx(
                        "relative flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden",
                        showLogo
                            ? "w-12 h-12 opacity-100 scale-100 bg-[#030305]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-lg"
                            : "w-0 h-12 opacity-0 scale-0 border-transparent"
                    )}
                >
                    {/* CSS Orbit Logo - White Rings (Scaled down slightly for the 12x12 container) */}
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/10 blur-lg rounded-full opacity-50 transition-opacity" />
                        <div className="absolute w-full h-full border border-white/60 rounded-full animate-[spin_8s_linear_infinite]" />
                        <div className="absolute w-3/4 h-3/4 border border-white/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    </div>
                </Link>

                {/* 2. Nav Pill - Morphs from transparent to glass */}
                <div
                    className={clsx(
                        "flex items-center gap-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        scrolled
                            ? "px-6 py-3 bg-[#030305]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-black/50"
                            : "px-6 py-2 bg-transparent border-transparent"
                    )}
                >
                    {!hideLinks && (
                        <>
                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="hover:text-white transition-colors relative group py-1"
                                    >
                                        {link.name}
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white rounded-full transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
                                    </a>
                                ))}

                                <div className="w-px h-4 bg-white/10 mx-2" /> {/* Divider */}

                                <Link
                                    to={isAuthenticated ? "/dashboard" : "/login"}
                                    className="group relative"
                                >
                                    <div className={clsx(
                                        "absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-0 transition duration-500",
                                        scrolled ? "group-hover:opacity-40" : "group-hover:opacity-30"
                                    )} />
                                    <div className={clsx(
                                        "relative flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300",
                                        scrolled
                                            ? "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
                                            : "bg-white/5 border border-white/5 hover:bg-white/10"
                                    )}>
                                        <span className="text-sm font-semibold text-white">
                                            {isAuthenticated ? 'Dashboard' : 'Sign In'}
                                        </span>
                                        <ChevronRight size={14} className="text-white/40 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-1 text-white/60 hover:text-white transition relative z-50"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Content (Outside the pill) */}
                <div
                    className={clsx(
                        "fixed inset-0 bg-black/95 backdrop-blur-xl z-[40] flex flex-col items-center justify-center gap-8 transition-all duration-300 md:hidden pointer-events-auto",
                        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    )}
                >
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-2xl font-bold text-white/80 hover:text-white hover:scale-110 transition-all font-outfit"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.name}
                        </a>
                    ))}
                    <Link
                        to={isAuthenticated ? "/dashboard" : "/login"}
                        className="mt-4"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <Button variant="primary" size="lg" icon={<ChevronRight size={18} />}>
                            {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}

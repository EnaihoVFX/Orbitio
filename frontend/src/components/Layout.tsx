import React from 'react';
import Navbar from './Navbar';
import { clsx } from 'clsx';

interface LayoutProps {
    children: React.ReactNode;
    className?: string;
    hideNavbar?: boolean;
    showBackground?: boolean;
}

export default function Layout({
    children,
    className,
    hideNavbar = false,
    showBackground = true
}: LayoutProps) {
    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#0a0a0f] bg-background text-foreground">

            {/* Standard Animated Background */}
            {showBackground && (
                <>
                    <div className="fixed inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
                    <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float pointer-events-none" />
                    <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1s' }} />
                </>
            )}

            {/* Navbar */}
            {!hideNavbar && <Navbar />}

            {/* Main Content */}
            <main className={clsx("flex-1 relative z-10 pt-24 pb-12 px-6", className)}>
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}

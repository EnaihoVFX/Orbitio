import { Github, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="footer relative mt-auto pb-12 px-6 pointer-events-none">
            <div className="max-w-7xl mx-auto pointer-events-auto">
                {/* Glass Card Container */}
                <div className="bg-[#030305]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 p-10 md:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                {/* Mini Orbit Logo */}
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <div className="absolute w-full h-full border border-white/60 rounded-full animate-[spin_8s_linear_infinite]" />
                                    <div className="absolute w-2/3 h-2/3 border border-white/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                                    <div className="absolute w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                <span className="font-outfit text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/10 lowercase px-2">orbitio</span>
                            </div>
                            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-4">
                                Enterprise-grade trade attribution for Hyperliquid builders.
                                Track the true performance of your strategy.
                            </p>
                            <p className="text-white/20 text-xs">
                                Built with ♡ for Hyperliquid builders
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">
                                Product
                            </h4>
                            <ul className="space-y-3">
                                <li><a href="/#features" className="footer-link text-sm hover:text-white transition-colors">Features</a></li>
                                <li><a href="/docs" className="footer-link text-sm hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="/docs#playground" className="footer-link text-sm hover:text-white transition-colors">API Playground</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">
                                Connect
                            </h4>
                            <ul className="space-y-3">
                                <li><a href="/login" className="footer-link text-sm hover:text-white transition-colors">Sign In</a></li>
                                <li><a href="/admin" className="footer-link text-sm hover:text-white transition-colors">Dashboard</a></li>
                            </ul>
                            {/* Social Icons */}
                            <div className="flex items-center gap-4 mt-6">
                                <a href="#" className="social-icon text-white/40 hover:text-white transition-colors" aria-label="GitHub">
                                    <Github size={20} />
                                </a>
                                <a href="#" className="social-icon text-white/40 hover:text-white transition-colors" aria-label="Twitter">
                                    <Twitter size={20} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-white/30 text-xs">
                            © {new Date().getFullYear()} Orbitio. All rights reserved.
                        </p>
                        <p className="text-white/20 text-xs font-mono">
                            v1.0.4
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

import React, { useState } from 'react';
import { Search, Terminal, ArrowRight, Sparkles } from 'lucide-react';
import { getPnL } from '../lib/api';
import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Layout from '../components/Layout';
import Input from '../components/Input';
import RealisticEarth from '../components/RealisticEarth';
import OrbitingLogo from '../components/OrbitingLogo';
import Footer from '../components/Footer';

const DEMO_KEY = "pk_ROIDo_UrLbLtgDRhxSPAKw";

export default function Landing() {
    const [address, setAddress] = useState('0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae');
    const [result, setResult] = useState<any>(null);

    const searchMutation = useMutation({
        mutationFn: async () => {
            const data = await getPnL(address, DEMO_KEY);
            return data;
        },
        onSuccess: (data) => setResult(data),
    });

    return (
        <Layout className="relative flex flex-col items-center" hideNavbar={false} showBackground={false}> {/* Disable default BG */}
            {/* 1. Deep Space Background - Fixed z-0 */}
            <div className="fixed inset-0 bg-[#030305] z-0 pointer-events-none" />

            {/* 2. Earth Model - Fixed z-10 */}
            <div className="fixed inset-0 z-10 pointer-events-none">
                <RealisticEarth />
            </div>

            {/* 3. Darkening Overlay - Fixed z-20 */}
            {/* This sits ON TOP of Earth but BELOW the Logo. It darkens the Earth. */}
            <div className="fixed inset-0 z-20 bg-black/70 pointer-events-none" />

            {/* 4. Orbitio Title - Absolute z-50 (Fixed top offset) */}
            {/* Sits high up on the page to reduce top space, font changed to Outfit */}
            {/* 4. Orbitio Title - Absolute z-50 (Fixed top offset) */}
            {/* Sits high up on the page to reduce top space, font changed to Outfit */}
            <div className="absolute top-32 left-0 right-0 z-50 pointer-events-none overflow-visible flex justify-center">
                <OrbitingLogo />
            </div>

            {/* 5. Scrollable Content - Relative z-40 */}
            {/* sits above overlay but below logo visually if they overlapped (they don't really) */}
            {/* 5. Scrollable Content - Relative z-40 */}
            {/* Reduced padding to bring content up closer to the logo/earth horizon */}
            <section className="pt-[32vh] pb-20 px-6 text-center max-w-4xl mx-auto relative w-full z-40">

                {/* Visual spacer to replace deleted subtitle if needed, or just let content flow */}

                <p className="text-lg text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    Stop guessing your user's PnL. PeakPNL filters out trades made on other frontends,
                    giving you the <span className="text-white font-semibold">true performance metric</span> of your strategy.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <Button
                        variant="text"
                        size="lg"
                        className="w-full sm:w-auto min-w-[200px] text-lg py-4 font-bold tracking-wide hover:no-underline opacity-80 hover:opacity-100 transition-opacity"
                        icon={<Terminal size={20} className="stroke-[2.5]" />}
                        onClick={() => window.location.href = '/docs'}
                    >
                        Start Building
                    </Button>
                    <Button
                        variant="glass"
                        size="lg"
                        className="w-full sm:w-auto min-w-[200px] text-lg py-4 group hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                        icon={<ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        Live Demo
                    </Button>
                </div>

                {/* Logic Demo Container */}
                <div id="demo" className="max-w-3xl mx-auto w-full mb-20 relative z-10 animate-slide-up mt-[40vh]">
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />

                        {/* Use Card container for shape, but customize internals */}
                        <div className="relative bg-[#09090b] ring-1 ring-white/10 rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row items-center gap-2 shadow-2xl">
                            <div className="flex-1 w-full sm:w-auto relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae" // Matches screenshot placeholder style
                                    className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/5 rounded-xl text-sm font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                                />
                            </div>
                            <Button
                                variant="primary"
                                className="w-full sm:w-auto !bg-blue-600 hover:!bg-blue-500 !text-white !border-none !shadow-lg !shadow-blue-900/20 py-4 px-8 text-base font-semibold rounded-xl"
                                onClick={() => searchMutation.mutate()}
                                isLoading={searchMutation.isPending}
                            >
                                {searchMutation.isPending ? 'Syncing...' : 'Check PnL'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Result Card */}
                {result && (
                    <Card variant="strong" className="max-w-xl mx-auto p-6 text-left animate-slide-up border-blue-500/20 shadow-blue-900/10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-blue-400 font-mono flex items-center gap-2">
                                <Sparkles size={14} className="text-blue-500" />
                                SNAPSHOT LINE #12
                            </span>
                            <Badge variant={result.tainted ? 'warning' : 'success'}>
                                {result.tainted ? "Tainted Trades Detected" : "100% Builder Attribution"}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5 hover-lift">
                                <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Unrealized PnL</div>
                                <div className={clsx("text-2xl font-mono font-bold", Number(result.unrealizedPnl) >= 0 ? "text-green-400" : "text-red-400")}>
                                    ${Number(result.unrealizedPnl).toLocaleString()}
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 border border-white/5 hover-lift">
                                <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Realized PnL</div>
                                <div className={clsx("text-2xl font-mono font-bold", Number(result.realizedPnl) >= 0 ? "text-green-400" : "text-red-400")}>
                                    ${Number(result.realizedPnl).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </section>

            {/* Footer - Replaces Features Section */}
            <div className="relative z-40 w-full mt-24">
                <Footer />
            </div>
        </Layout>
    );
}



import { useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Search, Key, Wallet, ShieldCheck, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';
import Badge from '../components/Badge';

// Helper to format currency
const formatMoney = (amount: number | string) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(val || 0);
};

export default function Demo() {
    const [apiKey, setApiKey] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey || !address) return;

        setLoading(true);
        setError('');
        setResult(null);
        setHasSearched(false);

        try {
            // Use direct axios call to avoid admin auth interceptors
            // Assuming backend is at localhost:8000 based on standard setup, 
            // but effectively we should use the same base URL as the app.
            // We'll try relative path first if proxied, or standard fallback.
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            const response = await axios.get(`${baseUrl}/v1/pnl`, {
                params: {
                    user: address,
                    builderOnly: true // Key flag for the demo!
                },
                headers: {
                    'X-API-Key': apiKey
                }
            });

            setResult(response.data);
            setHasSearched(true);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to fetch data. Check your API Key and Address.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout hideNavbar className="bg-[#050505]">
            {/* Styling to differentiate from "Orbitio" - maybe a blue/cyan theme for "PeakPNL" */}
            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

            <div className="relative z-10 w-full max-w-4xl mx-auto">

                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in-down">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                            <Activity className="text-blue-400 w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                            PeakPNL Client
                        </h1>
                    </div>
                    <p className="text-white/60 text-lg">
                        Official Partner Validation Platform
                    </p>
                </div>

                {/* Configuration / Input Card */}
                <Card variant="default" className="p-8 mb-8 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                    <form onSubmit={handleCheck} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Input
                                label="Builder API Key"
                                icon={Key}
                                placeholder="Paste your Orbitio Key..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                focusColor="primary" // Blue-ish in this theme context?
                                type="password"
                            />
                            <Input
                                label="Target Wallet Address"
                                icon={Wallet}
                                placeholder="0x..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                focusColor="primary"
                            />
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full md:w-auto min-w-[200px] bg-blue-600 hover:bg-blue-500"
                                isLoading={loading}
                                icon={Search}
                            >
                                Verify Trader
                            </Button>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 flex items-center gap-3 animate-pulse">
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </Card>

                {/* Results Section */}
                {hasSearched && result && (
                    <div className="space-y-6 animate-scale-in">

                        {/* Status Banner */}
                        <div className={clsx(
                            "p-6 rounded-2xl border flex items-center justify-between shadow-2xl backdrop-blur-md",
                            result.tainted
                                ? "bg-red-500/10 border-red-500/50 shadow-red-900/20"
                                : "bg-emerald-500/10 border-emerald-500/50 shadow-emerald-900/20"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "p-4 rounded-full",
                                    result.tainted ? "bg-red-500/20" : "bg-emerald-500/20"
                                )}>
                                    {result.tainted ? (
                                        <ShieldAlert className="w-8 h-8 text-red-400" />
                                    ) : (
                                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                                    )}
                                </div>
                                <div>
                                    <h2 className={clsx(
                                        "text-2xl font-bold",
                                        result.tainted ? "text-red-400" : "text-emerald-400"
                                    )}>
                                        {result.tainted ? "TAINTED TRADER" : "VERIFIED TRADER"}
                                    </h2>
                                    <p className="text-white/60">
                                        {result.tainted
                                            ? "This address has conflicting trade history with other builders."
                                            : "This address is exclusively trading on your platform."
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Score / ID Badge */}
                            <div className="hidden md:block text-right">
                                <div className="text-sm text-white/40 uppercase tracking-widest font-mono mb-1">Status Code</div>
                                <div className={clsx(
                                    "text-xl font-mono",
                                    result.tainted ? "text-red-400" : "text-emerald-400"
                                )}>
                                    {result.tainted ? "ERR_CONFLICT_0x" : "OK_CLEAN_0x"}
                                </div>
                            </div>
                        </div>

                        {/* PnL Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-6 bg-gradient-to-br from-white/5 to-transparent border-white/10">
                                <p className="text-white/40 mb-2 text-sm uppercase tracking-wider">Realized PnL</p>
                                <p className={clsx(
                                    "text-2xl font-bold font-mono",
                                    parseFloat(result.realizedPnl) >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {formatMoney(result.realizedPnl)}
                                </p>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-white/5 to-transparent border-white/10">
                                <p className="text-white/40 mb-2 text-sm uppercase tracking-wider">Unrealized PnL</p>
                                <p className={clsx(
                                    "text-2xl font-bold font-mono",
                                    parseFloat(result.unrealizedPnl) >= 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {formatMoney(result.unrealizedPnl)}
                                </p>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-white/5 to-transparent border-white/10">
                                <p className="text-white/40 mb-2 text-sm uppercase tracking-wider">Volume / Trades</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white font-mono">{result.tradeCount}</span>
                                    <span className="text-white/40 text-sm">trades</span>
                                </div>
                            </Card>
                        </div>

                        {/* Simulation Footer */}
                        <div className="mt-12 text-center border-t border-white/5 pt-8">
                            <p className="text-white/20 text-xs font-mono">
                                POWERED BY ORBITIO INFRASTRUCTURE • V2.4.0 • LATENCY: 12ms
                            </p>
                        </div>

                    </div>
                )}
            </div>
        </Layout>
    );
}

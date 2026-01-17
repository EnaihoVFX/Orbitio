import { useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Search, Key, Wallet, ShieldCheck, ShieldAlert, ArrowRight, Activity, Terminal } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';
import Badge from '../components/Badge';
import LiveTerminal from '../components/LiveTerminal';

// Helper to format currency
const formatMoney = (amount: number | string) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(val || 0);
};

interface Log {
    timestamp: string;
    level: 'INFO' | 'DEBUG' | 'SUCCESS' | 'WARN';
    message: string;
}

export default function Demo() {
    const [apiKey, setApiKey] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);

    const addLog = (level: Log['level'], message: string) => {
        setLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 }),
            level,
            message
        }]);
    };

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey || !address) return;

        setLoading(true);
        setError('');
        setResult(null);
        setHasSearched(false);
        setLogs([]); // Clear previous logs

        try {
            // Simulation Sequence
            addLog('INFO', `Initializing Orbitio PnL Engine v2.4`);
            await sleep(400);
            addLog('INFO', `Resolving address: ${address}`);
            await sleep(300);
            addLog('INFO', `Connecting to Hyperliquid Info API (Mainnet)...`);
            await sleep(600);
            addLog('DEBUG', `GET https://api.hyperliquid.xyz/info/user_fills`);
            await sleep(200);
            addLog('SUCCESS', `Connection Established (12ms)`);
            addLog('INFO', `Fetching trade history for verification...`);
            await sleep(800);

            // Actual API Call
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            // Start the simulated "heavy lifting" while waiting for real response
            const responsePromise = axios.get(`${baseUrl}/v1/pnl`, {
                params: { user: address, builderOnly: true },
                headers: { 'X-API-Key': apiKey }
            });

            // More simulated logs while waiting
            addLog('DEBUG', `Stream user_fills: processing chunk 1...`);
            await sleep(400);
            addLog('DEBUG', `Stream user_fills: processing chunk 2...`);
            await sleep(400);
            addLog('INFO', `Calculating Realized PnL vs Asset Positions...`);

            const response = await responsePromise;

            addLog('SUCCESS', `Data Received: ${response.data.tradeCount} trades processed`);
            addLog('INFO', `Verifying Builder Attribution...`);
            await sleep(300);

            if (response.data.tainted) {
                addLog('WARN', `CONFLICT DETECTED: Address has trades with external builders`);
            } else {
                addLog('SUCCESS', `VERIFICATION PASSED: Exclusive Orbitio Builder`);
            }

            setResult(response.data);
            setHasSearched(true);
        } catch (err: any) {
            console.error(err);
            addLog('WARN', `Connection Error: ${err.message}`);
            setError(err.response?.data?.detail || 'Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout hideNavbar className="bg-[#050505] min-h-screen">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12">

                {/* Header Section */}
                <div className="text-center mb-12 animate-fade-in-down">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
                            <Activity className="text-blue-400 w-8 h-8" />
                        </div>
                        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 tracking-tight">
                            PeakPNL Client
                        </h1>
                    </div>
                    <p className="text-blue-200/60 text-lg font-light tracking-wide">
                        Hyperliquid Partner Validation & Analytics Platform
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* Input Column */}
                    <div className="space-y-6">
                        <Card variant="default" className="p-8 border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] backdrop-blur-xl bg-black/40">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                                <ShieldCheck className="text-blue-400" size={20} />
                                Verify Trader
                            </h2>
                            <form onSubmit={handleCheck} className="space-y-6">
                                <Input
                                    label="Builder API Key"
                                    icon={Key}
                                    placeholder="Paste your Orbitio Key..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    focusColor="primary"
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

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium py-3 shadow-lg shadow-blue-500/25"
                                    isLoading={loading}
                                    icon={Search}
                                >
                                    Verify & Analyze
                                </Button>
                            </form>

                            {error && (
                                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-200 flex items-center gap-3 animate-pulse text-sm">
                                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                        </Card>

                        {/* Live Terminal Log */}
                        {(logs.length > 0 || loading) && (
                            <div className="animate-fade-in-up">
                                <LiveTerminal logs={logs} className="h-96 shadow-2xl" />
                            </div>
                        )}
                    </div>

                    {/* Results Column */}
                    <div className="space-y-6">
                        {hasSearched && result ? (
                            <div className="space-y-6 animate-scale-in">
                                {/* Status Banner */}
                                <div className={clsx(
                                    "p-6 rounded-2xl border flex flex-col gap-6 shadow-2xl backdrop-blur-md relative overflow-hidden",
                                    result.tainted
                                        ? "bg-red-500/10 border-red-500/30 shadow-red-900/20"
                                        : "bg-emerald-500/10 border-emerald-500/30 shadow-emerald-900/20"
                                )}>
                                    {/* Gradient Glow */}
                                    <div className={clsx(
                                        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] pointer-events-none",
                                        result.tainted ? "bg-red-500/30" : "bg-emerald-500/30"
                                    )} />

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "p-4 rounded-full border",
                                                result.tainted ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                            )}>
                                                {result.tainted ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
                                            </div>
                                            <div>
                                                <h2 className={clsx(
                                                    "text-2xl font-bold tracking-tight",
                                                    result.tainted ? "text-red-100" : "text-emerald-100"
                                                )}>
                                                    {result.tainted ? "Verification Failed" : "Trader Verified"}
                                                </h2>
                                                <p className={clsx("text-sm mt-1", result.tainted ? "text-red-300/70" : "text-emerald-300/70")}>
                                                    {result.tainted ? "Conflicting builder history found" : "Exclusive Orbitio builder coverage"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs uppercase tracking-widest opacity-50 mb-1">Status</div>
                                            <div className="font-mono text-lg">{result.tainted ? "CONFLICT" : "CLEAN"}</div>
                                        </div>
                                    </div>

                                    {/* PnL Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Card className="p-4 bg-black/40 border-white/5">
                                            <p className="text-white/40 mb-1 text-xs uppercase tracking-wider">Realized PnL</p>
                                            <p className={clsx(
                                                "text-xl font-bold font-mono",
                                                parseFloat(result.realizedPnl) >= 0 ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {formatMoney(result.realizedPnl)}
                                            </p>
                                        </Card>
                                        <Card className="p-4 bg-black/40 border-white/5">
                                            <p className="text-white/40 mb-1 text-xs uppercase tracking-wider">Unrealized PnL</p>
                                            <p className={clsx(
                                                "text-xl font-bold font-mono",
                                                parseFloat(result.unrealizedPnl) >= 0 ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {formatMoney(result.unrealizedPnl)}
                                            </p>
                                        </Card>
                                        <Card className="col-span-2 p-4 bg-black/40 border-white/5 flex items-center justify-between">
                                            <p className="text-white/40 text-xs uppercase tracking-wider">Trade Volume</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-white font-mono">{result.tradeCount}</span>
                                                <span className="text-white/40 text-xs">executions</span>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-3xl text-white/20 min-h-[400px]">
                                <Activity size={48} className="mb-4 opacity-20" />
                                <p>Ready to analyze on-chain data</p>
                                <p className="text-sm">Connects directly to Hyperliquid L1</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-20 text-center border-t border-white/5 pt-8">
                    <p className="text-blue-300/30 text-xs font-mono tracking-widest">
                        CONNECTED TO HYPERLIQUID MAINNET • ORBITIO NODE VA-7
                    </p>
                </div>
            </div>
        </Layout>
    );
}

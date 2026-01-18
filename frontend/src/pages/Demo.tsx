import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { Search, Key, Wallet, ShieldCheck, ShieldAlert, Activity, Terminal, Trophy, TrendingUp, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';
import LiveTerminal from '../components/LiveTerminal';
import Tabs from '../components/Tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    const [history, setHistory] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);
    const [activeTab, setActiveTab] = useState<'verify' | 'leaderboard'>('verify');

    // Websocket Ref
    const wsRef = useRef<WebSocket | null>(null);

    const addLog = (level: Log['level'], message: string) => {
        setLogs(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 }),
            level,
            message
        }]);
    };

    // Load Leaderboard on mount
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const res = await axios.get(`${baseUrl}/v1/leaderboard`);
                setLeaderboard(res.data);
            } catch (e) {
                console.error("Leaderboard fetch failed", e);
            }
        };
        fetchLeaderboard();
    }, []);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey || !address) return;

        setLoading(true);
        setError('');
        setResult(null);
        setHistory([]);
        setHasSearched(false);
        setLogs([]);

        // Close existing WS if any
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        try {
            // Simulation Sequence
            addLog('INFO', `Initializing Orbitio PnL Engine v2.4`);
            await sleep(100);
            addLog('INFO', `Connecting to Hyperliquid Info API (Mainnet)...`);
            await sleep(200);
            addLog('DEBUG', `GET https://api.hyperliquid.xyz/info/user_fills`);
            await sleep(100);
            addLog('SUCCESS', `Connection Established (12ms)`);
            addLog('INFO', `Fetching trade history...`);

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            // Parallel Fetch: PnL + History
            const pnlPromise = axios.get(`${baseUrl}/v1/pnl`, {
                params: { user: address, builderOnly: true },
                headers: { 'X-API-Key': apiKey }
            });

            const historyPromise = axios.get(`${baseUrl}/v1/pnl/history`, {
                params: { user: address, builderOnly: true },
                headers: { 'X-API-Key': apiKey }
            });

            // WebSocket Connection
            addLog('INFO', `Opening Real-Time WebSocket stream...`);
            const wsUrl = baseUrl.replace('http', 'ws') + `/ws/events/${address}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                addLog('SUCCESS', `WebSocket Connected: Listening for fills...`);
            };
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                addLog('INFO', `LIVE EVENT: ${msg.type} - ${JSON.stringify(msg.data || msg).substring(0, 50)}...`);
            };
            wsRef.current = ws;

            // Wait for data
            const [pnlRes, historyRes] = await Promise.all([pnlPromise, historyPromise]);

            // Parse History for Chart
            const formattedHistory = historyRes.data.map((h: any) => ({
                time: new Date(h.time).toLocaleDateString(),
                timestamp: h.time,
                pnl: parseFloat(h.netPnl) // Ensure float
            }));

            addLog('SUCCESS', `Data Received: ${pnlRes.data.tradeCount} trades processed`);

            if (pnlRes.data.tainted) {
                addLog('WARN', `CONFLICT DETECTED: Address has trades with external builders`);
            } else {
                addLog('SUCCESS', `VERIFICATION PASSED: Exclusive Orbitio Builder`);
            }

            setResult(pnlRes.data);
            setHistory(formattedHistory);
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
        <Layout hideNavbar className="bg-[#050505] min-h-screen font-sans">
            <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Activity className="text-blue-400 w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Orbitio Demo</h1>
                            <p className="text-blue-200/50 text-xs uppercase tracking-widest">Builder Analytics Platform</p>
                        </div>
                    </div>
                    <Tabs
                        tabs={[
                            { id: 'verify', label: 'Verify Trader' },
                            { id: 'leaderboard', label: 'Leaderboard' }
                        ]}
                        activeTab={activeTab}
                        onChange={(id) => setActiveTab(id as any)}
                    />
                </div>

                {activeTab === 'leaderboard' ? (
                    <div className="animate-fade-in-up">
                        <Card className="p-0 overflow-hidden border-blue-500/20 bg-black/40 backdrop-blur-xl">
                            <div className="p-6 border-b border-white/10 flex items-center gap-2">
                                <Trophy className="text-yellow-400" />
                                <h2 className="text-xl font-bold text-white">Top Traders</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-white/40 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Rank</th>
                                            <th className="p-4">User</th>
                                            <th className="p-4 text-right">PnL</th>
                                            <th className="p-4 text-right">Trades</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {leaderboard.length === 0 ? (
                                            <tr><td colSpan={4} className="p-8 text-center text-white/20">No data available</td></tr>
                                        ) : leaderboard.map((entry, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-mono text-white/60">#{entry.rank}</td>
                                                <td className="p-4 font-mono text-blue-300">
                                                    {entry.user.substring(0, 6)}...{entry.user.substring(38)}
                                                </td>
                                                <td className={clsx("p-4 text-right font-bold font-mono", parseFloat(entry.metricValue) >= 0 ? "text-emerald-400" : "text-red-400")}>
                                                    {formatMoney(entry.metricValue)}
                                                </td>
                                                <td className="p-4 text-right text-white/60">{entry.tradeCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: Inputs & Terminal */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card variant="default" className="p-6 border-blue-500/20 shadow-lg backdrop-blur-xl bg-black/40">
                                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ShieldCheck className="text-blue-400" size={18} />
                                    Validate Address
                                </h2>
                                <form onSubmit={handleCheck} className="space-y-4">
                                    <Input
                                        label="API Key"
                                        icon={Key}
                                        placeholder="pk_..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        focusColor="primary"
                                        type="password"
                                    />
                                    <Input
                                        label="Target Wallet"
                                        icon={Wallet}
                                        placeholder="0x..."
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        focusColor="primary"
                                    />
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full bg-blue-600 hover:bg-blue-500"
                                        isLoading={loading}
                                        icon={Search}
                                    >
                                        Run Analysis
                                    </Button>
                                </form>
                                {error && (
                                    <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-xs flex gap-2">
                                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                                        {error}
                                    </div>
                                )}
                            </Card>

                            <div className="animate-fade-in-up">
                                <LiveTerminal logs={logs} className="h-80 shadow-2xl border-blue-500/10" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Results & Charts */}
                        <div className="lg:col-span-8 space-y-6">
                            {hasSearched && result ? (
                                <div className="space-y-6 animate-scale-in">
                                    {/* Status Hero */}
                                    <div className={clsx(
                                        "p-6 rounded-2xl border flex flex-col items-center sm:flex-row sm:justify-between gap-6 shadow-2xl backdrop-blur-md relative overflow-hidden",
                                        result.tainted
                                            ? "bg-red-500/10 border-red-500/30 shadow-red-900/20"
                                            : "bg-emerald-500/10 border-emerald-500/30 shadow-emerald-900/20"
                                    )}>
                                        <div className="flex items-center gap-4 z-10">
                                            <div className={clsx(
                                                "p-3 rounded-full border",
                                                result.tainted ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                            )}>
                                                {result.tainted ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
                                            </div>
                                            <div>
                                                <h2 className={clsx("text-2xl font-bold", result.tainted ? "text-red-100" : "text-emerald-100")}>
                                                    {result.tainted ? "User Tainted" : "Exclusive Builder"}
                                                </h2>
                                                <p className={clsx("text-sm", result.tainted ? "text-red-300/70" : "text-emerald-300/70")}>
                                                    {result.tainted ? "Found conflicting trades on other platforms" : "100% Volume on Orbitio"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Stats Row */}
                                        <div className="flex gap-4 z-10">
                                            <div className="text-right">
                                                <div className="text-xs text-white/40 uppercase">Realized PnL</div>
                                                <div className={clsx("text-xl font-bold font-mono", parseFloat(result.realizedPnl) >= 0 ? "text-emerald-400" : "text-red-400")}>
                                                    {formatMoney(result.realizedPnl)}
                                                </div>
                                            </div>
                                            <div className="text-right border-l border-white/10 pl-4">
                                                <div className="text-xs text-white/40 uppercase">Trades</div>
                                                <div className="text-xl font-bold font-white font-mono">{result.tradeCount}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Equity Curve Chart */}
                                    <Card className="p-6 bg-black/40 border-white/10 min-h-[350px]">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="text-blue-400" size={18} />
                                                <h3 className="font-semibold text-white">Equity Curve (PnL History)</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <span>Net PnL</span>
                                            </div>
                                        </div>
                                        <div className="h-[280px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={history}>
                                                    <defs>
                                                        <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                    <XAxis
                                                        dataKey="time"
                                                        stroke="#ffffff40"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        minTickGap={30}
                                                    />
                                                    <YAxis
                                                        stroke="#ffffff40"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(val) => `$${val}`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                                                        itemStyle={{ color: '#fff' }}
                                                        formatter={(val: number) => [formatMoney(val), 'Net PnL']}
                                                        labelStyle={{ color: '#888' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="pnl"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill="url(#colorPnl)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-3xl text-white/20 min-h-[400px]">
                                    <BarChart2 size={64} className="mb-6 opacity-20" />
                                    <h3 className="text-xl font-medium text-white/40">Analysis Dashboard</h3>
                                    <p className="max-w-md mt-2">Enter a wallet address to visualize trade history, analyze PnL performance, and verify builder loyalty in real-time.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generateKey, listKeys, revokeKey, getStats, updateSetting, getSettings, getRecentActivity } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Key, Activity, Settings, Plus, Copy, Check, LogOut, Zap, TrendingUp, Clock, Shield, ChevronRight, Sparkles, Globe, Users } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function Admin() {
    const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'settings'>('overview');
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#06060a] flex">
            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[150px]" />
            </div>

            {/* Premium Sidebar */}
            <aside className="w-72 border-r border-white/5 p-6 flex flex-col bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-xl relative z-10">
                {/* Logo Section */}
                <div className="flex items-center gap-3 px-2 mb-10">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <div className="absolute w-full h-full border border-white/60 rounded-full animate-[spin_8s_linear_infinite]" />
                        <div className="absolute w-2/3 h-2/3 border border-white/30 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    <div>
                        <span className="font-outfit text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/10 lowercase">
                            orbitio
                        </span>
                        <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest pl-0.5">Admin Console</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1 flex-1">
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3 px-3">Navigation</div>
                    <NavItem icon={<Activity />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <NavItem icon={<Key />} label="API Keys" active={activeTab === 'keys'} onClick={() => setActiveTab('keys')} badge="3" />
                    <NavItem icon={<Settings />} label="Configuration" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>

                {/* User Section */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white/90 truncate">{user?.email}</div>
                            <div className="text-[10px] text-white/40">Administrator</div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/50 hover:text-white"
                        icon={<LogOut size={16} />}
                        onClick={logout}
                    >
                        Sign Out
                    </Button>
                    <div className="flex items-center justify-between px-2">
                        <a href="/" className="text-xs text-white/30 hover:text-white/60 transition">← Home</a>
                        <span className="text-[10px] text-white/20 font-mono">v2.1.0</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto relative z-10">
                <div className="max-w-6xl mx-auto">
                    {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
                    {activeTab === 'keys' && <KeysTab />}
                    {activeTab === 'settings' && <SettingsTab />}
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active, onClick, badge }: any) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                active
                    ? "bg-gradient-to-r from-primary/20 to-primary/5 text-white shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] border border-primary/20"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
            )}
        >
            <div className="flex items-center gap-3">
                {React.cloneElement(icon, { size: 18, className: active ? "text-primary" : "" })}
                {label}
            </div>
            {badge && (
                <span className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-full font-mono",
                    active ? "bg-primary/30 text-primary-foreground" : "bg-white/10 text-white/50"
                )}>
                    {badge}
                </span>
            )}
        </button>
    );
}

function OverviewTab({ onNavigate }: { onNavigate: (tab: 'overview' | 'keys' | 'settings') => void }) {
    const [duration, setDuration] = useState("24h");
    const { data: stats } = useQuery({
        queryKey: ['stats', duration],
        queryFn: () => getStats(duration)
    });

    const { data: keys } = useQuery({
        queryKey: ['api-keys'],
        queryFn: listKeys
    });

    const { data: activity } = useQuery({
        queryKey: ['activity'],
        queryFn: () => getRecentActivity(5),
        refetchInterval: 5000 // Poll every 5s for live feed
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Dashboard
                        </h1>
                    </div>
                    <p className="text-white/40">Real-time analytics and system performance</p>
                </div>
                <div className="flex bg-white/5 rounded-xl p-1 gap-1 border border-white/5">
                    {["1h", "24h", "7d", "30d"].map(d => (
                        <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                                duration === d
                                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Globe />}
                    label="Total Requests"
                    value={stats?.total_requests || 0}
                    trend="+12.5%"
                    color="primary"
                    description="API calls processed"
                />
                <StatCard
                    icon={<Clock />}
                    label="Avg Latency"
                    value={`${Math.round(stats?.avg_latency_ms || 0)}ms`}
                    trend="-8%"
                    color="accent"
                    description="Response time"
                />
                <StatCard
                    icon={<Key />}
                    label="Active Keys"
                    value={keys?.length || 0}
                    trend="0%"
                    color="secondary"
                    description="API credentials"
                />
                <StatCard
                    icon={<Shield />}
                    label="Uptime"
                    value="99.9%"
                    trend="+0.1%"
                    color="success"
                    description="System availability"
                />
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Traffic Chart */}
                <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Traffic Overview</h3>
                            <p className="text-sm text-white/40">Requests over time ({duration})</p>
                        </div>
                        <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                            <TrendingUp size={12} className="mr-1" /> Live
                        </Badge>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.chart_data?.length ? stats.chart_data : [{ name: 'Now', val: 0 }]}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    stroke="#3f3f46"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        if (duration === '1h') return val.split(' ')[1]?.slice(0, 5) || val;
                                        if (duration === '24h') return val.split(' ')[1]?.slice(0, 2) + 'h' || val;
                                        return val.slice(5);
                                    }}
                                />
                                <YAxis stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        borderColor: '#27272a',
                                        borderRadius: '12px',
                                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#fafafa' }}
                                    labelStyle={{ color: '#71717a' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="val"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorVal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <QuickAction
                            icon={<Plus />}
                            label="Generate API Key"
                            description="Create new credentials"
                            color="primary"
                            onClick={() => onNavigate('keys')}
                        />
                        <QuickAction
                            icon={<Settings />}
                            label="Update Builder"
                            description="Modify target address"
                            color="secondary"
                            onClick={() => onNavigate('settings')}
                        />
                        <QuickAction
                            icon={<Users />}
                            label="View Activity"
                            description="Recent API usage"
                            color="accent"
                            onClick={() => document.querySelector('.recharts-responsive-container')?.scrollIntoView({ behavior: 'smooth' })}
                        />
                    </div>

                    {/* System Status */}
                    <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/40">System Status</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-emerald-400 font-medium">Operational</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recent Activity Preview */}
            <Card className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                    <Button variant="ghost" size="sm" className="text-white/40">
                        View All <ChevronRight size={14} />
                    </Button>
                </div>
                <div className="space-y-4">
                    {activity?.length > 0 ? (
                        activity.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="flex items-center gap-4">
                                    <div className={clsx("w-2 h-2 rounded-full", item.status_code >= 400 ? "bg-red-500" : "bg-emerald-500")} />
                                    <span className="font-mono text-sm text-white/80">{item.endpoint}</span>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <Badge variant={item.status_code >= 400 ? 'error' : 'success'} className="font-mono">{item.status_code}</Badge>
                                    <span className="text-white/40 w-16 text-right whitespace-nowrap">{Math.round(item.latency_ms)}ms</span>
                                    <span className="text-white/30 w-24 text-right whitespace-nowrap text-xs">
                                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-white/30">No recent activity found.</div>
                    )}
                </div>
            </Card>
        </div>
    );
}

function StatCard({ icon, label, value, trend, color, description }: any) {
    const isPositive = trend?.startsWith('+');
    const isNeutral = trend === '0%';

    const colorClasses: Record<string, string> = {
        primary: 'from-primary/20 to-primary/5 border-primary/20',
        secondary: 'from-secondary/20 to-secondary/5 border-secondary/20',
        accent: 'from-accent/20 to-accent/5 border-accent/20',
        success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    };

    const iconColorClasses: Record<string, string> = {
        primary: 'text-primary bg-primary/10',
        secondary: 'text-secondary bg-secondary/10',
        accent: 'text-accent bg-accent/10',
        success: 'text-emerald-400 bg-emerald-500/10',
    };

    return (
        <Card className={clsx(
            "p-5 bg-gradient-to-br border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-default",
            colorClasses[color] || colorClasses.primary
        )}>
            <div className="flex items-start justify-between mb-4">
                <div className={clsx("p-2 rounded-lg", iconColorClasses[color] || iconColorClasses.primary)}>
                    {React.cloneElement(icon, { size: 18 })}
                </div>
                {trend && (
                    <Badge
                        variant={isNeutral ? 'default' : isPositive ? 'success' : 'error'}
                        className="text-[10px] font-mono"
                    >
                        {trend}
                    </Badge>
                )}
            </div>
            <div className="text-2xl font-bold font-mono text-white mb-1">{value}</div>
            <div className="text-sm text-white/50">{label}</div>
            <div className="text-xs text-white/30 mt-1">{description}</div>
        </Card>
    );
}

function QuickAction({ icon, label, description, color, onClick }: any) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary/10 text-primary group-hover:bg-primary/20',
        secondary: 'bg-secondary/10 text-secondary group-hover:bg-secondary/20',
        accent: 'bg-accent/10 text-accent group-hover:bg-accent/20',
    };

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group text-left"
        >
            <div className={clsx("p-2 rounded-lg transition-colors", colorClasses[color])}>
                {React.cloneElement(icon, { size: 16 })}
            </div>
            <div className="flex-1">
                <div className="text-sm font-medium text-white/90">{label}</div>
                <div className="text-xs text-white/40">{description}</div>
            </div>
            <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors" />
        </button>
    );
}


function KeysTab() {
    const [newKeyName, setNewKeyName] = useState('');
    const [createdKey, setCreatedKey] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const { data: keys, refetch } = useQuery({
        queryKey: ['api-keys'],
        queryFn: listKeys
    });

    const createMutation = useMutation({
        mutationFn: (name: string) => generateKey(name),
        onSuccess: (data) => {
            setCreatedKey(data);
            setNewKeyName('');
            refetch();
        }
    });

    const revokeMutation = useMutation({
        mutationFn: (id: number) => revokeKey(id),
        onSuccess: () => refetch()
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const sampleKey = createdKey?.key || (keys && keys.length > 0 ? keys[0].key : 'pk_YOUR_API_KEY');

    const curlSnippet = `curl -X GET "${window.location.origin}/v1/pnl?user=0x..." \\
  -H "X-API-Key: ${sampleKey}"`;

    const jsSnippet = `const response = await fetch('${window.location.origin}/v1/pnl?user=0x...', {
  headers: {
    'X-API-Key': '${sampleKey}'
  }
});
const data = await response.json();`;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-accent/10 rounded-lg">
                        <Key className="w-5 h-5 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        API Keys
                    </h1>
                </div>
                <p className="text-white/40">Manage access credentials for your integrations</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Create Key Card */}
                    <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/20 rounded-lg">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Generate New Key</h3>
                        </div>
                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                placeholder="Key name (e.g. Production)"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-white placeholder:text-white/30 transition-all"
                                value={newKeyName}
                                onChange={e => setNewKeyName(e.target.value)}
                            />
                            <Button
                                variant="primary"
                                onClick={() => createMutation.mutate(newKeyName)}
                                isLoading={createMutation.isPending}
                                disabled={!newKeyName}
                                icon={<Plus size={16} />}
                            >
                                Create
                            </Button>
                        </div>

                        {createMutation.isSuccess && createdKey && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-scale-in">
                                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2 flex items-center gap-2">
                                    <Check size={12} /> Key Generated Successfully
                                </div>
                                <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg font-mono text-sm">
                                    <span className="text-emerald-300 break-all">{createdKey.key}</span>
                                    <button
                                        className="ml-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-emerald-400"
                                        onClick={() => handleCopy(createdKey.key)}
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Active Keys */}
                    <div>
                        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Active Keys</h3>
                        <div className="space-y-3">
                            {keys?.map((key: any) => (
                                <Card key={key.id} className="p-4 bg-white/[0.02] border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                                <Key size={16} className="text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white/90">{key.name}</div>
                                                <div className="text-xs text-white/40 font-mono">{key.key.substr(0, 12)}...</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-white/40 hover:text-white"
                                                onClick={() => handleCopy(key.key)}
                                            >
                                                <Copy size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => {
                                                    if (confirm('Revoke this key?')) revokeMutation.mutate(key.id)
                                                }}
                                            >
                                                Revoke
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {(!keys || keys.length === 0) && (
                                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                                    <Key size={32} className="mx-auto text-white/20 mb-3" />
                                    <p className="text-white/30 text-sm">No active API keys</p>
                                    <p className="text-white/20 text-xs mt-1">Create one to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Integration */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Quick Integration</h3>
                        <p className="text-white/40 text-sm">Copy these snippets to start making requests</p>
                    </div>

                    <CodeSnippet lang="cURL" code={curlSnippet} />
                    <CodeSnippet lang="JavaScript" code={jsSnippet} />

                    <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
                        <div className="flex gap-3">
                            <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-white/60 leading-relaxed">
                                All requests must include the <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">X-API-Key</code> header to be authenticated.
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function CodeSnippet({ lang, code }: { lang: string; code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl overflow-hidden bg-[#0d0d12] border border-white/10">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">{lang}</span>
                <button
                    onClick={handleCopy}
                    className="text-white/40 hover:text-white transition-colors p-1"
                >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-blue-300/90 leading-relaxed">
                {code}
            </pre>
        </div>
    );
}

function SettingsTab() {
    const [builder, setBuilder] = useState('');
    const [saved, setSaved] = useState(false);

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings
    });

    React.useEffect(() => {
        if (settings?.TARGET_BUILDER) {
            setBuilder(settings.TARGET_BUILDER);
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: (val: string) => updateSetting('TARGET_BUILDER', val),
        onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    });

    return (
        <div className="max-w-3xl space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                        <Settings className="w-5 h-5 text-secondary" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Configuration
                    </h1>
                </div>
                <p className="text-white/40">Global settings that apply to all API instances</p>
            </div>

            {/* Builder Config Card */}
            <Card className="p-8 bg-gradient-to-br from-white/[0.03] to-transparent border-white/5">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-secondary/10 rounded-xl">
                        <Shield className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Target Builder Address</h3>
                        <p className="text-sm text-white/40">All PnL calculations will use this address for attribution validation</p>
                    </div>
                </div>

                <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm font-mono focus:outline-none focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 text-white placeholder:text-white/30 transition-all mb-4"
                    placeholder="0x..."
                    value={builder}
                    onChange={e => setBuilder(e.target.value)}
                />

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-white/30">
                        <Check size={12} className="text-emerald-500" />
                        Changes apply immediately to all requests
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => mutation.mutate(builder)}
                        isLoading={mutation.isPending}
                        icon={saved ? <Check size={14} /> : undefined}
                        className={saved ? "bg-emerald-600 hover:bg-emerald-500" : ""}
                    >
                        {mutation.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                    </Button>
                </div>
            </Card>

            {/* Additional Settings Placeholder */}
            <Card className="p-6 bg-white/[0.02] border-white/5 border-dashed">
                <div className="text-center py-8">
                    <Sparkles size={32} className="mx-auto text-white/20 mb-3" />
                    <h4 className="text-white/40 font-medium mb-1">More Settings Coming Soon</h4>
                    <p className="text-white/20 text-sm">Rate limits, webhooks, and advanced configuration</p>
                </div>
            </Card>
        </div>
    );
}

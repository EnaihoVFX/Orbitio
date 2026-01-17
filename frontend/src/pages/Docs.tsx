import { useState } from 'react';
import Layout from '../components/Layout';
import { Book, Code, Zap, Shield, Terminal, Key, CheckCircle } from 'lucide-react';
import Card from '../components/Card';
import CodeSnippet from '../components/CodeSnippet';
import ApiPlayground from '../components/ApiPlayground';
import Badge from '../components/Badge';
import Tabs from '../components/Tabs';
import { endpoints } from '../lib/codeGenerator';

export default function Docs() {
    const [activeSection, setActiveSection] = useState<'quickstart' | 'reference' | 'playground'>('quickstart');

    return (
        <Layout>
            {/* Hero */}
            <section className="text-center max-w-4xl mx-auto mb-16">
                <Badge variant="info" className="mb-6 mx-auto">
                    <Book size={12} />
                    Developer Documentation
                </Badge>

                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 font-orbit text-white">
                    Build with <span className="text-white">Orbitio</span>
                </h1>

                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                    Integrate builder-attributed PnL tracking into your Hyperliquid frontend.
                    Get started in minutes with our simple REST API.
                </p>

                <Tabs
                    tabs={[
                        { id: 'quickstart', label: 'Quick Start', icon: <Zap size={16} /> },
                        { id: 'reference', label: 'API Reference', icon: <Book size={16} /> },
                        { id: 'playground', label: 'Playground', icon: <Terminal size={16} /> },
                    ]}
                    activeTab={activeSection}
                    onChange={(id) => setActiveSection(id as any)}
                    className="inline-flex"
                />
            </section>

            {/* Content */}
            <div className="max-w-5xl mx-auto">
                {activeSection === 'quickstart' && <QuickStart />}
                {activeSection === 'reference' && <ApiReference />}
                {activeSection === 'playground' && <PlaygroundSection />}
            </div>
        </Layout>
    );
}

function QuickStart() {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Authentication */}
            <div className="card-premium p-8 aurora-glow">
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-primary/20 rounded-xl icon-glow">
                        <Key className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-3 text-white">1. Get Your API Key</h2>
                        <p className="text-white/60 mb-4">
                            Contact the admin to generate your API key. Include it in the <code className="px-2 py-1 bg-black/60 rounded text-sm text-primary">X-API-Key</code> header for all requests.
                        </p>
                        <div className="code-gradient-border">
                            <div className="bg-black/80 rounded-lg p-4 font-mono text-sm">
                                <span className="text-white/40">X-API-Key:</span> <span className="text-primary">pk_your_api_key_here</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* First Request */}
            <div className="card-premium p-8 aurora-glow">
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-secondary/20 rounded-xl icon-glow">
                        <Code className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-3 text-white">2. Make Your First Request</h2>
                        <p className="text-white/60 mb-4">
                            Fetch PnL data for any Hyperliquid address. Set <code className="px-2 py-1 bg-black/60 rounded text-sm text-secondary">builderOnly=true</code> to filter for builder-attributed trades only.
                        </p>
                        <CodeSnippet
                            endpoint={endpoints.getPnL}
                            apiKey="pk_your_api_key_here"
                        />
                    </div>
                </div>
            </div>

            {/* Response */}
            <div className="card-premium p-8 aurora-glow">
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-accent/20 rounded-xl icon-glow">
                        <CheckCircle className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-3 text-white">3. Handle the Response</h2>
                        <p className="text-white/60 mb-4">
                            The API returns JSON with PnL metrics, trade counts, and taint status.
                        </p>
                        <div className="code-gradient-border">
                            <pre className="bg-black/80 rounded-lg p-4 font-mono text-sm text-white/80 overflow-x-auto">
                                {`{
  "realizedPnl": "1250.50",
  "unrealizedPnl": "320.75",
  "feesPaid": "10.20",
  "tradeCount": 42,
  "tainted": false
}`}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Concepts */}
            <div className="card-premium p-8 border-l-4 border-primary">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                        <Shield className="w-5 h-5 text-primary" />
                        Understanding Taint Logic
                    </h3>
                    <p className="text-white/60 leading-relaxed">
                        When <code className="px-2 py-1 bg-black/60 rounded text-sm text-primary">builderOnly=true</code>, the API tracks position lifecycles.
                        If a user makes <strong className="text-white">any</strong> trade on a different frontend during an open position,
                        that entire lifecycle is marked as "tainted" and excluded from PnL calculations.
                        This ensures your metrics reflect only trades made through your platform.
                    </p>
                </div>
            </div>
        </div>
    );
}

function ApiReference() {
    return (
        <div className="space-y-6 animate-fade-in">
            <EndpointCard
                method="GET"
                path="/v1/pnl"
                description="Retrieve aggregated PnL metrics for a specific user address"
                params={[
                    { name: 'user', type: 'string', required: true, description: 'Hyperliquid wallet address (0x...)' },
                    { name: 'builderOnly', type: 'boolean', required: false, description: 'Filter for builder-attributed trades only (default: false)' },
                ]}
                response={{
                    realizedPnl: 'string',
                    unrealizedPnl: 'string',
                    feesPaid: 'string',
                    tradeCount: 'number',
                    tainted: 'boolean'
                }}
                example={endpoints.getPnL}
            />

            <EndpointCard
                method="GET"
                path="/v1/trades"
                description="Retrieve detailed trade history with individual fill data"
                params={[
                    { name: 'user', type: 'string', required: true, description: 'Hyperliquid wallet address (0x...)' },
                    { name: 'builderOnly', type: 'boolean', required: false, description: 'Filter for builder-attributed trades only' },
                ]}
                response={{
                    trades: 'array',
                    count: 'number'
                }}
                example={endpoints.getTrades}
            />

            <EndpointCard
                method="GET"
                path="/v1/leaderboard"
                description="Get top performers ranked by realized PnL (requires persistence enabled)"
                params={[]}
                response={{
                    leaderboard: 'array',
                    updatedAt: 'string'
                }}
                example={endpoints.getLeaderboard}
            />
        </div>
    );
}

interface EndpointCardProps {
    method: string;
    path: string;
    description: string;
    params: Array<{ name: string; type: string; required: boolean; description: string }>;
    response: any;
    example: any;
}

function EndpointCard({ method, path, description, params, response, example }: EndpointCardProps) {
    return (
        <div className="card-premium p-6 aurora-glow">
            <div className="relative z-10">
                <div className="flex items-start gap-3 mb-4">
                    <Badge variant={method === 'GET' ? 'info' : 'success'}>
                        {method}
                    </Badge>
                    <code className="text-lg font-mono font-semibold text-white">{path}</code>
                </div>

                <p className="text-white/60 mb-6">{description}</p>

                {params.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-white/80 mb-3">Parameters</h4>
                        <div className="space-y-2">
                            {params.map((param) => (
                                <div key={param.name} className="flex items-start gap-3 text-sm">
                                    <code className="px-2 py-1 bg-black/60 rounded font-mono text-primary">
                                        {param.name}
                                    </code>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white/40">{param.type}</span>
                                            {param.required && <Badge variant="warning">required</Badge>}
                                        </div>
                                        <p className="text-white/60">{param.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-white/80 mb-3">Response Schema</h4>
                    <div className="code-gradient-border">
                        <pre className="bg-black/80 rounded-lg p-4 font-mono text-xs text-white/80 overflow-x-auto">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                </div>

                <CodeSnippet endpoint={example} />
            </div>
        </div>
    );
}

function PlaygroundSection() {
    return (
        <div className="animate-fade-in">
            <Card variant="subtle" className="p-6 mb-6 border-l-4 border-accent">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-accent" />
                    Interactive API Playground
                </h3>
                <p className="text-white/60 text-sm">
                    Test API endpoints in real-time. Configure parameters, execute requests, and inspect responses.
                </p>
            </Card>

            <ApiPlayground />
        </div>
    );
}

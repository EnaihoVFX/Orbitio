import { useState } from 'react';
import { Play, Clock, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { clsx } from 'clsx';
import Button from './Button';
import Card from './Card';
import JsonViewer from './JsonViewer';
import Badge from './Badge';
import { api } from '../lib/api';

interface ApiPlaygroundProps {
    className?: string;
}

export default function ApiPlayground({ className }: ApiPlaygroundProps) {
    const [endpoint, setEndpoint] = useState('/v1/pnl');
    const [userAddress, setUserAddress] = useState('0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae');
    const [apiKey, setApiKey] = useState('pk_ROIDo_UrLbLtgDRhxSPAKw');
    const [builderOnly, setBuilderOnly] = useState(true);
    const [response, setResponse] = useState<any>(null);
    const [latency, setLatency] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const executeMutation = useMutation({
        mutationFn: async () => {
            const startTime = performance.now();
            setError(null);

            try {
                const res = await api.get(endpoint, {
                    params: {
                        user: userAddress,
                        builderOnly: builderOnly
                    },
                    headers: { 'X-API-Key': apiKey }
                });

                const endTime = performance.now();
                setLatency(Math.round(endTime - startTime));
                return res.data;
            } catch (err: any) {
                const endTime = performance.now();
                setLatency(Math.round(endTime - startTime));
                throw err;
            }
        },
        onSuccess: (data) => {
            setResponse(data);
        },
        onError: (err: any) => {
            setError(err.response?.data?.detail || err.message || 'Request failed');
            setResponse(null);
        }
    });

    const handleExecute = () => {
        executeMutation.mutate();
    };

    return (
        <div className={clsx('space-y-6', className)}>
            {/* Request Builder */}
            <Card variant="strong" className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Play size={20} className="text-primary" />
                    API Request Builder
                </h3>

                <div className="space-y-4">
                    {/* Endpoint Selection */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Endpoint</label>
                        <select
                            value={endpoint}
                            onChange={(e) => setEndpoint(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus-ring"
                        >
                            <option value="/v1/pnl">GET /v1/pnl - Get PnL</option>
                            <option value="/v1/trades">GET /v1/trades - Get Trades</option>
                            <option value="/v1/leaderboard">GET /v1/leaderboard - Leaderboard</option>
                        </select>
                    </div>

                    {/* Parameters */}
                    {endpoint !== '/v1/leaderboard' && (
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">User Address</label>
                            <input
                                type="text"
                                value={userAddress}
                                onChange={(e) => setUserAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus-ring"
                            />
                        </div>
                    )}

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="pk_..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus-ring"
                        />
                    </div>

                    {/* Builder Only Toggle */}
                    {endpoint !== '/v1/leaderboard' && (
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="builderOnly"
                                checked={builderOnly}
                                onChange={(e) => setBuilderOnly(e.target.checked)}
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary"
                            />
                            <label htmlFor="builderOnly" className="text-sm text-white/80">
                                Builder Only Mode
                            </label>
                        </div>
                    )}

                    {/* Execute Button */}
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleExecute}
                        isLoading={executeMutation.isPending}
                        icon={<Play size={16} />}
                        className="w-full"
                    >
                        Execute Request
                    </Button>
                </div>
            </Card>

            {/* Response Section */}
            {(response || error) && (
                <Card variant="default" className="p-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Response</h3>
                        <div className="flex items-center gap-3">
                            {latency !== null && (
                                <Badge variant="info">
                                    <Clock size={12} />
                                    {latency}ms
                                </Badge>
                            )}
                            {error ? (
                                <Badge variant="error">Error</Badge>
                            ) : (
                                <Badge variant="success">200 OK</Badge>
                            )}
                        </div>
                    </div>

                    {error ? (
                        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-medium mb-1">Request Failed</div>
                                <div className="text-sm opacity-80">{error}</div>
                            </div>
                        </div>
                    ) : (
                        <JsonViewer data={response} />
                    )}
                </Card>
            )}
        </div>
    );
}

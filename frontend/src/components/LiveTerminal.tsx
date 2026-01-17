import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Terminal } from 'lucide-react';

interface Log {
    timestamp: string;
    level: 'INFO' | 'DEBUG' | 'SUCCESS' | 'WARN';
    message: string;
}

interface LiveTerminalProps {
    logs: Log[];
    className?: string;
}

export default function LiveTerminal({ logs, className }: LiveTerminalProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className={clsx("rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/10 font-mono text-xs", className)}>
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-white/40" />
                    <span className="text-white/40">Orbitio System Hook</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
            </div>

            {/* Logs Content */}
            <div className="p-4 space-y-1.5 h-64 overflow-y-auto">
                {logs.length === 0 && (
                    <div className="text-white/20 italic">Waiting for connection...</div>
                )}

                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 animate-fade-in-up">
                        <span className="text-white/30 shrink-0 select-none">
                            [{log.timestamp}]
                        </span>
                        <span className={clsx("font-bold shrink-0 w-16",
                            log.level === 'INFO' && "text-blue-400",
                            log.level === 'DEBUG' && "text-purple-400",
                            log.level === 'SUCCESS' && "text-emerald-400",
                            log.level === 'WARN' && "text-yellow-400",
                        )}>
                            {log.level}
                        </span>
                        <span className="text-white/80 break-all">
                            {highlightKeywords(log.message)}
                        </span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Status Line */}
            <div className="px-4 py-1 bg-blue-500/10 border-t border-blue-500/20 text-blue-300 flex justify-between">
                <span>Connected: hyperliquid-mainnet</span>
                <span className="animate-pulse">● Live</span>
            </div>
        </div>
    );
}

function highlightKeywords(msg: string) {
    const parts = msg.split(/(\b(?:Hyperliquid|Info|API|GET|POST|200 OK|user_fills|clearinghouse_state|User|Address|0x[a-fA-F0-9]+)\b)/g);
    return parts.map((part, i) => {
        if (part.match(/^(Hyperliquid|Info|API)/)) return <span key={i} className="text-cyan-300 font-bold">{part}</span>;
        if (part.match(/^(GET|POST)/)) return <span key={i} className="text-yellow-300">{part}</span>;
        if (part.match(/^(200 OK)/)) return <span key={i} className="text-emerald-300">{part}</span>;
        if (part.match(/^(user_fills|clearinghouse_state)/)) return <span key={i} className="text-pink-300 italic">{part}</span>;
        if (part.startsWith('0x')) return <span key={i} className="text-blue-300 underline decoration-blue-500/30">{part}</span>;
        return part;
    });
}

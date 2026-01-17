import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface JsonViewerProps {
    data: any;
    className?: string;
}

export default function JsonViewer({ data, className }: JsonViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={clsx('relative', className)}>
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all z-10"
                title="Copy JSON"
            >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
            <pre className="code-block max-h-96 overflow-auto">
                <JsonNode data={data} level={0} />
            </pre>
        </div>
    );
}

function JsonNode({ data, level }: { data: any; level: number }) {
    const [isExpanded, setIsExpanded] = useState(level < 2);

    if (data === null) {
        return <span className="syntax-keyword">null</span>;
    }

    if (typeof data === 'string') {
        return <span className="syntax-string">"{data}"</span>;
    }

    if (typeof data === 'number') {
        return <span className="syntax-number">{data}</span>;
    }

    if (typeof data === 'boolean') {
        return <span className="syntax-keyword">{data.toString()}</span>;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return <span>[]</span>;

        return (
            <span>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center hover:text-primary transition-colors"
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span className="syntax-operator">[</span>
                {isExpanded && (
                    <div className="ml-4">
                        {data.map((item, i) => (
                            <div key={i}>
                                <JsonNode data={item} level={level + 1} />
                                {i < data.length - 1 && <span className="syntax-operator">,</span>}
                            </div>
                        ))}
                    </div>
                )}
                <span className="syntax-operator">]</span>
            </span>
        );
    }

    if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 0) return <span>{'{}'}</span>;

        return (
            <span>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center hover:text-primary transition-colors"
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <span className="syntax-operator">{'{'}</span>
                {isExpanded && (
                    <div className="ml-4">
                        {keys.map((key, i) => (
                            <div key={key}>
                                <span className="syntax-property">"{key}"</span>
                                <span className="syntax-operator">: </span>
                                <JsonNode data={data[key]} level={level + 1} />
                                {i < keys.length - 1 && <span className="syntax-operator">,</span>}
                            </div>
                        ))}
                    </div>
                )}
                <span className="syntax-operator">{'}'}</span>
            </span>
        );
    }

    return <span>{String(data)}</span>;
}

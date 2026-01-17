import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import Tabs from './Tabs';
import { type Language, generateCodeSnippet } from '../lib/codeGenerator';

interface CodeSnippetProps {
    endpoint: {
        method: string;
        path: string;
        params?: Record<string, string>;
    };
    apiKey?: string;
    className?: string;
}

export default function CodeSnippet({ endpoint, apiKey = 'your_api_key_here', className }: CodeSnippetProps) {
    const [language, setLanguage] = useState<Language>('curl');
    const [copied, setCopied] = useState(false);

    const code = generateCodeSnippet(language, endpoint, apiKey);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const tabs = [
        { id: 'curl', label: 'cURL' },
        { id: 'javascript', label: 'JavaScript' },
        { id: 'typescript', label: 'TypeScript' },
        { id: 'python', label: 'Python' },
    ];

    return (
        <div className={clsx('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <Tabs
                    tabs={tabs}
                    activeTab={language}
                    onChange={(id) => setLanguage(id as Language)}
                />
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-sm"
                >
                    {copied ? (
                        <>
                            <Check size={16} className="text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={16} />
                            Copy
                        </>
                    )}
                </button>
            </div>

            <pre className="code-block">
                <code className="text-xs leading-relaxed">
                    <SyntaxHighlight code={code} language={language} />
                </code>
            </pre>
        </div>
    );
}

function SyntaxHighlight({ code, language }: { code: string; language: Language }) {
    // Simple syntax highlighting
    const lines = code.split('\n');

    return (
        <>
            {lines.map((line, i) => (
                <div key={i}>
                    {highlightLine(line, language)}
                </div>
            ))}
        </>
    );
}

function highlightLine(line: string, language: Language): React.ReactNode {
    if (language === 'python') {
        return highlightPython(line);
    } else if (language === 'javascript' || language === 'typescript') {
        return highlightJavaScript(line);
    } else {
        return line;
    }
}

function highlightPython(line: string): React.ReactNode {
    // Keywords
    line = line.replace(/(import|requests|def|return|print)/g, '<span class="syntax-keyword">$1</span>');
    // Strings
    line = line.replace(/(['"])(.*?)\1/g, '<span class="syntax-string">$1$2$1</span>');

    return <span dangerouslySetInnerHTML={{ __html: line }} />;
}

function highlightJavaScript(line: string): React.ReactNode {
    // Keywords
    line = line.replace(/(const|let|var|await|async|fetch|interface|function|return|console)/g, '<span class="syntax-keyword">$1</span>');
    // Strings
    line = line.replace(/(['"`])(.*?)\1/g, '<span class="syntax-string">$1$2$1</span>');
    // Functions
    line = line.replace(/(\w+)\(/g, '<span class="syntax-function">$1</span>(');

    return <span dangerouslySetInnerHTML={{ __html: line }} />;
}

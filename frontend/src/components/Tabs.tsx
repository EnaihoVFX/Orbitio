import { clsx } from 'clsx';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
    return (
        <div className={clsx('flex bg-white/5 rounded-lg p-1 gap-1', className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                        activeTab === tab.id
                            ? 'bg-primary text-white shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

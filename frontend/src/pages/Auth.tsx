import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import Button from '../components/Button';
import Tabs from '../components/Tabs';
import { Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import Input from '../components/Input';
import RealisticEarth from '../components/RealisticEarth';

export default function Auth() {
    const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register(email, password);
            setError('');
            setActiveTab('signin');
            setPassword('');
            setConfirmPassword('');
            alert('Account created successfully! Please sign in.');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'signin', label: 'Sign In', icon: <LogIn size={16} /> },
        { id: 'signup', label: 'Sign Up', icon: <UserPlus size={16} /> },
    ];

    return (
        <div className="min-h-screen bg-[#030305] relative flex items-center justify-center overflow-hidden">
            {/* 1. Deep Space Background - Fixed z-0 */}
            <div className="fixed inset-0 bg-[#030305] z-0 pointer-events-none" />

            {/* 2. Earth Model - Fixed z-10 */}
            <div className="fixed inset-0 z-10 pointer-events-none">
                <RealisticEarth />
            </div>

            {/* 3. Darkening Overlay - Fixed z-20 */}
            <div className="fixed inset-0 z-20 bg-black/70 pointer-events-none" />

            {/* Main Content - Centered z-30 */}
            <div className="relative z-30 w-full max-w-md mx-auto px-6">
                <div className="animate-fade-in-up">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex flex-col items-center mb-2">
                            {/* Styled Logo matching Landing but smaller */}
                            <h1 className="text-6xl font-black tracking-tighter font-outfit cursor-default select-none px-4 leading-none">
                                <span className="inline-block p-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/10 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                    orbitio
                                </span>
                            </h1>
                        </div>
                        <p className="text-white/50 text-lg">Sign in to manage your API keys</p>
                    </div>

                    {/* Auth Card Container */}
                    <div className="glass-card p-8">
                        {/* Tabs */}
                        <Tabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={(id) => {
                                setActiveTab(id as 'signin' | 'signup');
                                setError('');
                            }}
                        />

                        {/* Error Message */}
                        {error && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-scale-in">
                                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-red-400">{error}</span>
                            </div>
                        )}

                        {/* Sign In Form */}
                        {activeTab === 'signin' && (
                            <form onSubmit={handleSignIn} className="mt-6 space-y-5">
                                <Input
                                    label="Email Address"
                                    icon={Mail}
                                    type="email"
                                    required
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    focusColor="primary"
                                />

                                <Input
                                    label="Password"
                                    icon={Lock}
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    focusColor="secondary"
                                />

                                <Button
                                    type="submit"
                                    variant="premium"
                                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
                                    isLoading={loading}
                                    disabled={loading}
                                >
                                    Sign In
                                </Button>
                            </form>
                        )}

                        {/* Sign Up Form */}
                        {activeTab === 'signup' && (
                            <form onSubmit={handleSignUp} className="mt-6 space-y-5">
                                <Input
                                    label="Email Address"
                                    icon={Mail}
                                    type="email"
                                    required
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    focusColor="primary"
                                />

                                <Input
                                    label="Password"
                                    icon={Lock}
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    focusColor="accent"
                                    helperText="8+ chars • 1 Uppercase • 1 Symbol"
                                />

                                <Input
                                    label="Confirm Password"
                                    icon={Lock}
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={confirmPassword && password !== confirmPassword ? "Passwords do not match" : undefined}
                                    focusColor="accent"
                                />

                                <Button
                                    type="submit"
                                    variant="premium"
                                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
                                    isLoading={loading}
                                    disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
                                >
                                    Create Account
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Back to Home */}
                    <div className="mt-8 text-center">
                        <a
                            href="/"
                            className="text-sm text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-2"
                        >
                            <span>←</span>
                            <span>Back to Home</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

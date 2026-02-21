import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Truck,
    Mail,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    ShieldCheck,
    MapPin,
    Users,
    LineChart
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { cn } from '../../lib/utils';

const FEATURES = [
    { icon: ShieldCheck, text: 'Real-time fleet tracking' },
    { icon: MapPin, text: 'Smart trip dispatching' },
    { icon: Users, text: 'Driver compliance monitoring' },
    { icon: LineChart, text: 'Financial analytics & exports' },
];

const QUICK_LOGINS = [
    { role: 'Fleet Manager', email: 'manager@fleet.com', icon: ShieldCheck, color: 'bg-blue-100 text-blue-600' },
    { role: 'Dispatcher', email: 'dispatcher@fleet.com', icon: MapPin, color: 'bg-emerald-100 text-emerald-600' },
    { role: 'Safety Officer', email: 'safety@fleet.com', icon: Users, color: 'bg-amber-100 text-amber-600' },
    { role: 'Financial Analyst', email: 'finance@fleet.com', icon: LineChart, color: 'bg-indigo-100 text-indigo-600' },
];

export default function Login() {
    const [formData, setFormData] = React.useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = React.useState(false);
    const { login, isAuthenticated, isLoading, error: authError, clearError } = useAuthStore();
    const { success: toastSuccess, error: toastError } = useToast();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
        return () => clearError();
    }, [isAuthenticated, navigate, clearError]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (!formData.email || !formData.password) {
            toastError('Please fill in all fields');
            return;
        }

        const res = await login(formData.email, formData.password);
        if (res?.success) {
            toastSuccess('Welcome back to FleetFlow!');
            navigate('/dashboard');
        }
    };

    const handleQuickLogin = (email) => {
        setFormData({ email, password: 'password123' });
        // Trigger login slightly after to show the auto-fill effect
        setTimeout(async () => {
            try {
                const res = await login(email, 'password123');
                if (res?.success) {
                    toastSuccess('Authenticated via Quick Login');
                    navigate('/dashboard');
                }
            } catch (err) {
                // Error handled by store/interceptor
            }
        }, 400);
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden">
            {/* Left Panel - Brand Side */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-900 via-slate-900 to-black p-12 flex-col justify-between overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                            <Truck className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-3xl font-extrabold text-white tracking-tighter italic">
                            FleetFlow
                        </span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-5xl font-bold text-white leading-tight">
                            The command center for your entire fleet.
                        </h1>
                        <p className="text-slate-400 text-lg max-w-md">
                            Streamline operations, monitor drivers, and optimize routes with our all-in-one logistics management platform.
                        </p>
                    </div>

                    <div className="mt-16 space-y-4">
                        {FEATURES.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className="h-10 w-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                                    <feature.icon className="h-5 w-5 text-blue-400 group-hover:text-white" />
                                </div>
                                <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                                    {feature.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 border-t border-slate-800 pt-8">
                    <p className="text-slate-500 text-sm">
                        v1.0.4 • Built for logistics excellence
                    </p>
                </div>
            </div>

            {/* Right Panel - Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
                <div className="w-full max-w-md space-y-8 py-12">
                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                            <Truck className="h-8 w-8 text-blue-600" />
                            <span className="text-2xl font-bold text-slate-900 tracking-tighter">FleetFlow</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Welcome back
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Sign in to manage your fleet operations
                        </p>
                    </div>

                    {/* Error Alert */}
                    {authError && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-4">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="font-medium">{authError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    className="pl-10 h-12 bg-white dark:bg-slate-900"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 h-12 bg-white dark:bg-slate-900"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                                    Authenticating...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    {/* Quick Logins (Hackathon Mode) */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            Quick Login (Demo Mode)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {QUICK_LOGINS.map((q) => (
                                <button
                                    key={q.role}
                                    onClick={() => handleQuickLogin(q.email)}
                                    disabled={isLoading}
                                    className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-500 hover:shadow-md transition-all active:scale-95 group"
                                >
                                    <div className={cn("p-2 rounded-lg mb-2 group-hover:scale-110 transition-transform", q.color)}>
                                        <q.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase">
                                        {q.role.split(' ')[0]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

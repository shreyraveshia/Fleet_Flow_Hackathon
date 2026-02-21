import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Truck,
    User,
    Mail,
    Lock,
    ShieldCheck,
    MapPin,
    Users,
    LineChart,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { cn } from '../../lib/utils';

const ROLES = [
    {
        id: 'fleet_manager',
        title: 'Fleet Manager',
        desc: 'Manage vehicles, oversee operations',
        icon: ShieldCheck,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-900/10'
    },
    {
        id: 'dispatcher',
        title: 'Dispatcher',
        desc: 'Create trips, assign drivers',
        icon: MapPin,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-900/10'
    },
    {
        id: 'safety_officer',
        title: 'Safety Officer',
        desc: 'Monitor compliance & safety',
        icon: Users,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-900/10'
    },
    {
        id: 'financial',
        title: 'Financial Analyst',
        desc: 'Track costs, generate reports',
        icon: LineChart,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 dark:bg-indigo-900/10'
    }
];

export default function Register() {
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'fleet_manager'
    });

    const { register, isLoading, error: authError, clearError } = useAuthStore();
    const { success: toastSuccess, error: toastError } = useToast();
    const navigate = useNavigate();

    React.useEffect(() => {
        return () => clearError();
    }, [clearError]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (formData.password !== formData.confirmPassword) {
            toastError('Passwords do not match');
            return;
        }

        const { confirmPassword, ...registerData } = formData;
        const res = await register(registerData);

        if (res.success) {
            toastSuccess('Account created successfully!');
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
                        <Truck className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter italic">
                        FleetFlow
                    </span>
                </div>

                <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    <div className="h-1.5 w-full bg-blue-600" />
                    <CardContent className="p-8 md:p-12">
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Create your account
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">
                                Join our platform to streamline your fleet operations
                            </p>
                        </div>

                        {authError && (
                            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="font-medium">{authError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Basic Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            className="pl-10 h-11"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@company.com"
                                            className="pl-10 h-11"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-11"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-11"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Role Selection Cards */}
                            <div className="space-y-4">
                                <Label className="text-base font-bold text-slate-900 dark:text-white">Choose your role</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ROLES.map((role) => (
                                        <div
                                            key={role.id}
                                            onClick={() => setFormData({ ...formData, role: role.id })}
                                            className={cn(
                                                "relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md",
                                                formData.role === role.id
                                                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-blue-200/20"
                                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                                            )}
                                        >
                                            <div className={cn("p-2.5 rounded-lg mr-4 shrink-0 transition-transform group-hover:scale-110", role.bg, role.color)}>
                                                <role.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm line-tight">{role.title}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{role.desc}</p>
                                            </div>
                                            {formData.role === role.id && (
                                                <CheckCircle2 className="h-5 w-5 text-blue-600 absolute top-2 right-2" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <LoadingSpinner size="sm" color="white" className="mr-2" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>

                                <p className="text-center text-sm text-slate-500">
                                    Already have an account?{' '}
                                    <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

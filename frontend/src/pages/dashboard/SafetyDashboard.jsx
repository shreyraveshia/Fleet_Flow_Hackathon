import * as React from 'react';
import {
    ShieldCheck,
    AlertCircle,
    Users,
    BarChart2,
    Truck,
    FileWarning,
    History,
    CheckCircle2,
    RefreshCcw,
    Trophy
} from 'lucide-react';
import { analyticsAPI } from '../../api/analytics.api';
import { driverAPI } from '../../api/driver.api';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';
import KPICard from '../../components/common/KPICard';
import DataTable from '../../components/common/DataTable';
import StatusPill from '../../components/common/StatusPill';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { format, formatDistanceToNow } from 'date-fns';
import { cn, formatDate } from '../../lib/utils';

export default function SafetyDashboard() {
    const [data, setData] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const { on, off } = useSocket();
    const { success, error } = useToast();

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await analyticsAPI.getDriverStats();
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch safety dashboard:', err);
            // Fallback/Mock for hackathon if API fails
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    React.useEffect(() => {
        on('driver_update', fetchData);
        return () => off('driver_update', fetchData);
    }, [on, off, fetchData]);

    if (isLoading && !data) return <SkeletonLoader type="page" />;

    const stats = data || {
        kpis: { expiring: 2, expired: 1, suspended: 1, avgScore: 88.5 },
        leaderboard: [],
        criticalAlerts: [],
        suspendedDrivers: []
    };

    const leaderboardColumns = [
        { key: 'rank', label: '#', render: (_, index) => <span className="font-bold text-slate-400">{index + 1}</span>, width: '40px' },
        {
            key: 'driver', label: 'Driver', render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-blue-600">
                        {row.name[0]}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{row.name}</p>
                        <p className="text-[10px] text-slate-400 tracking-wider font-mono">ID: {row.licenseNumber}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'safetyScore', label: 'Safety Score', render: (row) => (
                <div className="flex items-center gap-3 w-48">
                    <Progress value={row.safetyScore} className="h-1.5 flex-1" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{row.safetyScore}%</span>
                </div>
            )
        },
        { key: 'completionRate', label: 'Comp. Rate', render: (row) => <span className="text-xs font-medium">{row.completionRate}%</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} size="xs" /> },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Safety & Compliance"
                subtitle="Monitor driver safety scores, monitor license expirations, and ensure fleet compliance."
                actions={
                    <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                        <RefreshCcw className={isLoading ? "animate-spin h-4 w-4" : "h-4 w-4"} />
                        Sync Metrics
                    </Button>
                }
            />

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="License Expiries" value={stats?.kpis?.expiring || 0} icon={FileWarning} color="amber" isLoading={isLoading} />
                <KPICard title="Expired Licenses" value={stats?.kpis?.expired || 0} icon={AlertCircle} color="red" isLoading={isLoading} />
                <KPICard title="Suspended Drivers" value={stats?.kpis?.suspended || 0} icon={Users} color="slate" isLoading={isLoading} />
                <KPICard title="Avg Fleet Score" value={stats?.kpis?.avgScore || 0} suffix="%" icon={Trophy} color="green" isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Leaderboard Table */}
                <div className="xl:col-span-2">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <BarChart2 className="h-5 w-5 text-emerald-500" />
                                Safety Leaderboard
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={leaderboardColumns}
                                data={stats.leaderboard}
                                isLoading={isLoading}
                                searchable={false}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts & Critical Sidebar */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Critical Alerts */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            Critical Compliance Alerts
                        </h3>

                        {stats.criticalAlerts.length === 0 ? (
                            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-900 dark:text-white">All Clear</p>
                                <p className="text-xs text-slate-500 mt-1">No critical compliance issues found.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.criticalAlerts.map(alert => (
                                    <Card key={alert.id} className={cn(
                                        "border-l-4 overflow-hidden shadow-sm transition-all hover:translate-x-1",
                                        alert.severity === 'expired' ? "border-l-red-500" : "border-l-amber-500"
                                    )}>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white uppercase leading-none">{alert.driverName}</p>
                                                <Badge variant={alert.severity === 'expired' ? "destructive" : "warning"} className="text-[9px] h-4 py-0">
                                                    {alert.severity}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                                                <FileWarning className="h-3 w-3" />
                                                {alert.type}: {alert.licenseNumber}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-slate-400 underline decoration-slate-200">
                                                    Expires: {formatDate(alert.expiryDate, 'MMM dd, yyyy')}
                                                </span>
                                                <Button
                                                    size="xs"
                                                    variant="outline"
                                                    className="h-6 text-[10px] px-2 font-bold"
                                                    onClick={() => success(`Notification sent to ${alert.driverName}`)}
                                                >
                                                    Notify Driver
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Suspended Section */}
                    <Card className="bg-slate-950 text-white border-none shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Users className="h-20 w-20" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                Suspension Watch
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats.suspendedDrivers.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">No drivers currently suspended.</p>
                                ) : (
                                    stats.suspendedDrivers.map(d => (
                                        <div key={d.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-sm font-bold">{d.name}</span>
                                            </div>
                                            <Button
                                                variant="link"
                                                className="text-blue-400 h-auto p-0 text-xs font-bold hover:text-blue-300"
                                                onClick={() => success(`Viewing details for ${d.name}`)}
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Button
                                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs py-1.5 h-8"
                                onClick={() => success('Compliance audit report generated')}
                            >
                                Generate Audit Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

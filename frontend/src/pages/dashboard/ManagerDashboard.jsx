import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck,
    Wrench,
    Activity,
    Package,
    AlertTriangle,
    PlusCircle,
    MapPin,
    ArrowRight,
    BarChart3,
    Calendar
} from 'lucide-react';
import { analyticsAPI } from '../../api/analytics.api';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';
import KPICard from '../../components/common/KPICard';
import DataTable from '../../components/common/DataTable';
import StatusPill from '../../components/common/StatusPill';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { cn, formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export default function ManagerDashboard() {
    const [data, setData] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const { on, off } = useSocket();
    const { info } = useToast();
    const navigate = useNavigate();

    const fetchDashboard = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await analyticsAPI.getDashboard();
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch manager dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchDashboard();

        // Auto refresh every 60 seconds
        const interval = setInterval(fetchDashboard, 60000);
        return () => clearInterval(interval);
    }, [fetchDashboard]);

    React.useEffect(() => {
        const handleUpdate = () => {
            fetchDashboard();
            info('Dashboard data updated in real-time');
        };

        on('fleet_update', handleUpdate);
        on('trip_status_change', handleUpdate);

        return () => {
            off('fleet_update', handleUpdate);
            off('trip_status_change', handleUpdate);
        };
    }, [on, off, fetchDashboard, info]);

    if (isLoading && !data) {
        return <SkeletonLoader type="page" />;
    }

    const kpis = data?.kpis || {};
    const recentTrips = data?.recentTrips || [];
    const expiryAlerts = data?.expiryAlerts || [];

    const tripColumns = [
        { key: 'tripId', label: 'Trip ID', render: (row) => <span className="font-mono font-bold">{row.tripId}</span> },
        { key: 'vehicle', label: 'Vehicle', render: (row) => row.vehicle?.plateNumber || 'N/A' },
        { key: 'driver', label: 'Driver', render: (row) => row.driver?.name || 'Unassigned' },
        {
            key: 'route', label: 'Route', render: (row) => (
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="truncate max-w-[80px]">{row.origin}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[80px]">{row.destination}</span>
                </div>
            )
        },
        { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} size="xs" /> },
        { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt, 'MMM dd, HH:mm') },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Manager Dashboard"
                subtitle={`Welcome back! Here's what's happening in your fleet today, ${formatDate(new Date(), 'MMMM dd, yyyy')}.`}
                actions={
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={isLoading}>
                            Refresh
                        </Button>
                        <Button size="sm" onClick={() => navigate('/analytics')}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Full Reports
                        </Button>
                    </div>
                }
            />

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Active Fleet"
                    value={kpis.activeFleet || 0}
                    icon={Truck}
                    color="blue"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Maintenance Alerts"
                    value={kpis.maintenanceAlerts || 0}
                    icon={Wrench}
                    color="amber"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Utilization Rate"
                    value={kpis.utilizationRate || 0}
                    suffix="%"
                    icon={Activity}
                    color="green"
                    isLoading={isLoading}
                />
                <KPICard
                    title="Pending Cargo"
                    value={kpis.pendingCargo || 0}
                    icon={Package}
                    color="purple"
                    isLoading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Trips Table */}
                <div className="xl:col-span-2">
                    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-500" />
                                Recent Trip Activity
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/trips')}>
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={tripColumns}
                                data={recentTrips}
                                isLoading={isLoading}
                                pagination={false}
                                searchable={false}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* License Expiry Section */}
                <div className="xl:col-span-1">
                    <Card className="h-full border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                License Expiry Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                            {expiryAlerts.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-sm text-slate-500">No urgent license renewals</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {expiryAlerts.map((driver) => (
                                        <div key={driver._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{driver?.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">#{driver?.licenseNumber}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <Badge
                                                    variant={driver?.daysRemaining <= 7 ? "destructive" : "warning"}
                                                    className="text-[10px] font-bold h-5 px-1.5"
                                                >
                                                    {driver?.daysRemaining || 0} days left
                                                </Badge>
                                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(driver?.licenseExpiry, 'MMM dd')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-8 space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Quick Actions</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl text-xs font-bold group" onClick={() => navigate('/vehicles?action=add')}>
                                        <PlusCircle className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                        Add Vehicle
                                    </Button>
                                    <Button variant="outline" className="h-20 flex-col gap-2 rounded-xl text-xs font-bold group" onClick={() => navigate('/trips?action=create')}>
                                        <MapPin className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                        Create Trip
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

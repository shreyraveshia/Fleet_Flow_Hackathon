import * as React from 'react';
import {
    Truck,
    Users,
    MapPin,
    Package,
    Plus,
    ChevronRight,
    ArrowRight,
    Clock,
    ExternalLink
} from 'lucide-react';
import { analyticsAPI } from '../../api/analytics.api';
import { tripAPI } from '../../api/trip.api';
import { vehicleAPI } from '../../api/vehicle.api';
import { driverAPI } from '../../api/driver.api';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';
import KPICard from '../../components/common/KPICard';
import DataTable from '../../components/common/DataTable';
import StatusPill from '../../components/common/StatusPill';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export default function DispatcherDashboard() {
    const [data, setData] = React.useState(null);
    const [availableData, setAvailableData] = React.useState({ vehicles: [], drivers: [] });
    const [isLoading, setIsLoading] = React.useState(true);
    const { on, off } = useSocket();
    const { success, error } = useToast();

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [dashRes, vehiclesRes, driversRes] = await Promise.all([
                analyticsAPI.getDashboard(),
                vehicleAPI.getAvailable(),
                driverAPI.getAvailable()
            ]);
            setData(dashRes.data);
            setAvailableData({
                vehicles: vehiclesRes.data.vehicles.slice(0, 5),
                drivers: driversRes.data.drivers.slice(0, 5)
            });
        } catch (err) {
            console.error('Failed to fetch dispatcher dashboard:', err);
            error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, [error]);

    React.useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    React.useEffect(() => {
        on('trip_created', fetchData);
        on('trip_status_change', fetchData);
        on('fleet_update', fetchData);
        return () => {
            off('trip_created', fetchData);
            off('trip_status_change', fetchData);
            off('fleet_update', fetchData);
        };
    }, [on, off, fetchData]);

    const advanceStatus = async (tripId, currentStatus) => {
        // Basic status advancement logic
        const statusMap = {
            'Draft': 'Dispatched',
            'Dispatched': 'In Transit',
            'In Transit': 'Completed'
        };
        const nextStatus = statusMap[currentStatus];
        if (!nextStatus) return;

        try {
            await tripAPI.updateStatus(tripId, nextStatus);
            success(`Trip ${tripId} status updated to ${nextStatus}`);
            fetchData();
        } catch (err) {
            error(err.message || 'Failed to update status');
        }
    };

    if (isLoading && !data) return <SkeletonLoader type="page" />;

    const kpis = data?.kpis || {};
    const activeTrips = data?.recentTrips?.filter(t => ['Dispatched', 'In Transit'].includes(t.status)) || [];

    const tripColumns = [
        { key: 'tripId', label: 'Trip ID', render: (row) => <span className="font-bold">#{row.tripId}</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} size="xs" /> },
        {
            key: 'route', label: 'Route', render: (row) => (
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-medium truncate max-w-[80px]">{row.origin}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-medium truncate max-w-[80px]">{row.destination}</span>
                </div>
            )
        },
        {
            key: 'actions', label: 'Actions', render: (row) => {
                const statusMap = { 'Draft': 'Dispatch', 'Dispatched': 'Start', 'In Transit': 'Complete' };
                const btnText = statusMap[row.status];
                if (!btnText) return null;
                return (
                    <Button
                        size="xs"
                        variant="outline"
                        className="h-7 text-[10px] bg-white dark:bg-slate-800"
                        onClick={() => advanceStatus(row._id, row.status)}
                    >
                        {btnText}
                    </Button>
                );
            }
        }
    ];

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title="Dispatch Control"
                subtitle="Manage active trips, assign resources, and track deliveries."
            />

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Vehicle Availability" value={availableData.vehicles.length} icon={Truck} color="emerald" isLoading={isLoading} />
                <KPICard title="Driver Pool" value={availableData.drivers.length} icon={Users} color="blue" isLoading={isLoading} />
                <KPICard title="Active Trips" value={activeTrips.length} icon={MapPin} color="indigo" isLoading={isLoading} />
                <KPICard title="Pending Drafts" value={data?.recentTrips?.filter(t => t.status === 'Draft').length || 0} icon={Package} color="amber" isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Active Trips Table */}
                <div className="xl:col-span-2 space-y-6">
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    Active Shipments
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={tripColumns}
                                data={data?.recentTrips || []}
                                isLoading={isLoading}
                                pagination={false}
                                searchable={false}
                                emptyMessage="No active trips to display."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Available Resources Sidebar */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Available Vehicles */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-slate-500">
                                <Truck className="h-4 w-4" />
                                Available Resources
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 px-6">
                                <div className="py-4">
                                    <h4 className="text-xs font-bold text-slate-400 mb-3">VEHICLES</h4>
                                    <div className="space-y-3">
                                        {availableData.vehicles.map(v => (
                                            <div key={v._id} className="flex items-center justify-between group">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{v.plateNumber}</p>
                                                    <p className="text-[10px] text-slate-500">{v.make} {v.model}</p>
                                                </div>
                                                <Badge variant="secondary" className="text-[10px] h-5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 border-none">
                                                    {v.type}
                                                </Badge>
                                            </div>
                                        ))}
                                        {availableData.vehicles.length === 0 && <p className="text-xs text-slate-400 italic">No vehicles available</p>}
                                    </div>
                                </div>

                                <div className="py-4">
                                    <h4 className="text-xs font-bold text-slate-400 mb-3">DRIVERS</h4>
                                    <div className="space-y-4">
                                        {availableData.drivers.map(d => (
                                            <div key={d._id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                                        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 text-[10px]">
                                                            {d.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{d.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">Score: {d.safetyScore}%</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-slate-200 dark:border-slate-700">
                                                    {d.licenseCategory}
                                                </Badge>
                                            </div>
                                        ))}
                                        {availableData.drivers.length === 0 && <p className="text-xs text-slate-400 italic">No drivers available</p>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Floating Action Button */}
            <Button
                size="lg"
                className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center p-0 z-50 group hover:scale-110 transition-all border-4 border-white dark:border-slate-900"
                title="Create New Trip"
            >
                <Plus className="h-7 w-7 text-white" />
            </Button>
        </div>
    );
}

import * as React from 'react';
import {
    FileDown,
    BarChart2,
    Fuel,
    TrendingUp,
    Users,
    Activity,
    Download,
    AlertTriangle,
    CheckCircle2,
    Package,
    Clock,
    Truck,
    IndianRupee,
    MoreVertical,
    ChevronRight,
    ChevronDown,
    LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../../api/analytics.api';
import { exportAPI } from '../../api/export.api';
import { useDownload } from '../../hooks/useDownload';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusPill from '../../components/common/StatusPill';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import KPICard from '../../components/common/KPICard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Progress } from '../../components/ui/progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import FuelEfficiencyChart from '../../components/charts/FuelEfficiencyChart';
import CostTrendChart from '../../components/charts/CostTrendChart';
import ROIChart from '../../components/charts/ROIChart';
import DriverScoreChart from '../../components/charts/DriverScoreChart';
import { cn, formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export default function Analytics() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = React.useState('overview');
    const [data, setData] = React.useState({
        overview: null,
        fuel: null,
        roi: null,
        trends: null,
        drivers: null
    });
    const [loading, setLoading] = React.useState(true);

    const { downloadCSV, downloadPDF, isDownloading } = useDownload();
    const { error } = useToast();

    const fetchTabData = React.useCallback(async (tab) => {
        setLoading(true);
        try {
            let res;
            switch (tab) {
                case 'overview': res = await analyticsAPI.getFleetOverview(); break;
                case 'fuel': res = await analyticsAPI.getFuelEfficiency(); break;
                case 'roi': res = await analyticsAPI.getVehicleROI(); break;
                case 'trends': res = await analyticsAPI.getMonthlySummary(); break;
                case 'drivers': res = await analyticsAPI.getDriverStats(); break;
                default: return;
            }
            setData(prev => ({ ...prev, [tab]: res.data }));
        } catch (err) {
            error(`Failed to load ${tab} analytics`);
        } finally {
            setLoading(false);
        }
    }, [error]);

    React.useEffect(() => {
        fetchTabData(activeTab);
    }, [activeTab, fetchTabData]);

    // --- Column Definitions ---

    const fuelColumns = [
        { key: 'vehicle', label: 'Vehicle', render: (row) => <span className="font-bold text-xs uppercase">{row.plateNumber}</span>, sortable: true },
        { key: 'type', label: 'Type', render: (row) => <Badge variant="outline" className="text-[10px]">{row.type}</Badge> },
        { key: 'distance', label: 'Distance', render: (row) => <span className="text-xs">{row.totalDistance?.toLocaleString()} km</span> },
        { key: 'liters', label: 'Fuel (L)', render: (row) => <span className="text-xs">{row.totalLiters?.toLocaleString()} L</span> },
        { key: 'cost', label: 'Cost', render: (row) => <span className="text-xs font-bold">₹{row.totalFuelCost?.toLocaleString()}</span> },
        { key: 'efficiency', label: 'Efficiency', render: (row) => <span className={cn("font-black text-xs", row.efficiency > 15 ? "text-emerald-500" : "text-amber-500")}>{row.efficiency?.toFixed(1)} km/L</span> },
        { key: 'costPerKm', label: 'Cost/km', render: (row) => <span className="text-xs font-bold">₹{(row.totalFuelCost / row.totalDistance || 0).toFixed(2)}</span> },
    ];

    const roiColumns = [
        { key: 'vehicle', label: 'Vehicle', render: (row) => <span className="font-bold text-xs uppercase">{row?.licensePlate}</span> },
        { key: 'revenue', label: 'Total Revenue', render: (row) => <span className="text-emerald-600 font-bold">₹{row?.revenue?.toLocaleString() || '0'}</span> },
        { key: 'costs', label: 'Total Ops Cost', render: (row) => <span className="text-red-500 font-medium">₹{row?.totalOperationalCost?.toLocaleString() || '0'}</span> },
        { key: 'net', label: 'Net Profit', render: (row) => <span className={cn("font-black", (row?.netProfit || 0) > 0 ? "text-emerald-600" : "text-red-600")}>₹{row?.netProfit?.toLocaleString() || '0'}</span> },
        { key: 'roi', label: 'ROI %', render: (row) => <Badge className={cn((row?.roi || 0) > 0 ? "bg-emerald-500" : "bg-red-500")}>{(row?.roi || 0).toFixed(1)}%</Badge> },
    ];

    const trendColumns = [
        { key: 'month', label: 'Period', render: (row) => <span className="font-bold text-xs">{row.monthName} {row.year}</span> },
        { key: 'revenue', label: 'Revenue', render: (row) => <span className="text-emerald-600 font-bold">₹{row.revenue?.toLocaleString()}</span> },
        { key: 'fuel', label: 'Fuel', render: (row) => <span className="text-xs">₹{row.fuelCost?.toLocaleString()}</span> },
        { key: 'maintenance', label: 'Mnt.', render: (row) => <span className="text-xs">₹{row.maintenanceCost?.toLocaleString()}</span> },
        { key: 'trips', label: 'Trips', render: (row) => <span className="text-xs font-medium">{row.tripsCompleted}</span> },
        { key: 'net', label: 'Net Profit', render: (row) => <span className="font-black text-sm">₹{row.netProfit?.toLocaleString()}</span> },
    ];

    const driverColumns = [
        { key: 'driver', label: 'Driver', render: (row) => <span className="font-bold text-xs">{row.name}</span> },
        { key: 'safety', label: 'Safety Score', render: (row) => <div className="w-24"><Progress value={row.safetyScore} className="h-1.5" /></div> },
        { key: 'trips', label: 'Total Trips', render: (row) => <span className="text-xs">{row.totalTrips}</span> },
        { key: 'completion', label: 'Comp. Rate', render: (row) => <span className="text-xs font-bold text-emerald-500">{row.completionRate}%</span> },
        { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} size="xs" /> },
    ];

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title="Analytics & Reports"
                subtitle="Deep dive into fleet performance, financial ROI, and driver safety metrics."
                actions={
                    <div className="flex gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2" disabled={isDownloading}>
                                    <FileDown className="h-4 w-4" />
                                    Export CSV
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => downloadCSV(exportAPI.vehiclesCSV, 'fleet-vehicles.csv')}>Vehicles Registry</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadCSV(exportAPI.tripsCSV, 'fleet-trips.csv')}>Trip Logs</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadCSV(exportAPI.expensesCSV, 'fleet-expenses.csv')}>Expense Ledger</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={() => downloadPDF(exportAPI.analyticsPDF, 'fleet-analytics-report.pdf')} className="bg-slate-900 border-none hover:bg-slate-800 shadow-xl shadow-slate-200" disabled={isDownloading}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF Report
                        </Button>
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 h-auto p-0 gap-8">
                    {['Overview', 'Fuel Efficiency', 'Vehicle ROI', 'Monthly Trends', 'Driver Stats'].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab.toLowerCase().replace(' ', '-')}
                            className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-xs tracking-widest uppercase transition-all"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
                    {loading ? <SkeletonLoader type="page" /> : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                <KPICard title="Active Fleet" value={data.overview?.kpis?.activeCount || 0} icon={Truck} color="blue" />
                                <KPICard title="Mnt. Alerts" value={data.overview?.kpis?.maintenanceCount || 0} icon={AlertTriangle} color="amber" />
                                <KPICard title="Utilization" value={data.overview?.kpis?.utilization || 0} suffix="%" icon={Activity} color="emerald" />
                                <KPICard title="Total Assets" value={data.overview?.kpis?.totalVehicles || 0} icon={Package} color="slate" />
                                <KPICard title="Available" value={data.overview?.kpis?.availableDrivers || 0} icon={Users} color="indigo" />
                                <KPICard title="Pending" value={data.overview?.kpis?.pendingTrips || 0} icon={Clock} color="orange" />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <Card className="border-none shadow-sm"><CardContent className="p-6"><h4 className="text-xs font-black uppercase mb-4 text-slate-400">Monthly Revenue Trend</h4><CostTrendChart data={data.overview?.monthlySummary} compact /></CardContent></Card>
                                <Card className="border-none shadow-sm"><CardContent className="p-6"><h4 className="text-xs font-black uppercase mb-4 text-slate-400">Driver Performance Score</h4><DriverScoreChart data={data.overview?.kpis?.leaderboard} compact /></CardContent></Card>
                                <Card className="border-none shadow-sm"><CardContent className="p-6"><h4 className="text-xs font-black uppercase mb-4 text-slate-400">Fuel Economy km/L</h4><FuelEfficiencyChart data={data.overview?.fuelEfficiency} compact /></CardContent></Card>
                                <Card className="border-none shadow-sm"><CardContent className="p-6"><h4 className="text-xs font-black uppercase mb-4 text-slate-400">Vehicle Net Impact</h4><ROIChart data={data.overview?.roiData} compact /></CardContent></Card>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="fuel-efficiency" className="space-y-8 mt-0 outline-none">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="p-6 bg-slate-50 dark:bg-slate-800/50">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                <Fuel className="h-5 w-5 text-blue-500" />
                                Economy vs Operating Cost
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <FuelEfficiencyChart data={data.fuel?.chartData} />
                        </CardContent>
                    </Card>
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Payload Efficiency Ledger</h3>
                        <Card className="border-none shadow-sm overflow-hidden">
                            <DataTable columns={fuelColumns} data={data.fuel?.list || []} isLoading={loading} />
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="vehicle-roi" className="space-y-8 mt-0 outline-none">
                    <div className="grid grid-cols-3 gap-6">
                        <Card className="col-span-2 border-none shadow-sm">
                            <CardHeader className="p-6"><CardTitle className="text-lg font-black">Profitability Impact</CardTitle></CardHeader>
                            <CardContent className="p-6"><ROIChart data={data.roi?.chartData} /></CardContent>
                        </Card>
                        <div className="space-y-6">
                            <Card className="bg-emerald-600 text-white border-none shadow-xl">
                                <CardContent className="p-6 text-center">
                                    <TrendingUp className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                    <h4 className="text-3xl font-black">{data.roi?.profitableCount}</h4>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Profitable Assets</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-red-600 text-white border-none shadow-xl">
                                <CardContent className="p-6 text-center">
                                    <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                                    <h4 className="text-3xl font-black">{data.roi?.unprofitableCount}</h4>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Loss-Making Assets</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <Card className="border-none shadow-sm overflow-hidden">
                        <DataTable columns={roiColumns} data={data.roi?.list || []} isLoading={loading} />
                    </Card>
                </TabsContent>

                <TabsContent value="monthly-trends" className="space-y-8 mt-0 outline-none">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="p-6"><CardTitle className="text-lg font-black">Financial Momentum (6 Months)</CardTitle></CardHeader>
                        <CardContent className="p-6"><CostTrendChart data={data.trends?.chartData} /></CardContent>
                    </Card>
                    <Card className="border-none shadow-sm overflow-hidden">
                        <DataTable columns={trendColumns} data={data.trends?.list || []} isLoading={loading} />
                    </Card>
                </TabsContent>

                <TabsContent value="driver-stats" className="space-y-8 mt-0 outline-none">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="p-6"><CardTitle className="text-lg font-black">Safety Leaderboard Distribution</CardTitle></CardHeader>
                        <CardContent className="p-6"><DriverScoreChart data={data.drivers?.leaderboard} /></CardContent>
                    </Card>
                    <Card className="border-none shadow-sm overflow-hidden">
                        <DataTable columns={driverColumns} data={data.drivers?.leaderboard || []} isLoading={loading} />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

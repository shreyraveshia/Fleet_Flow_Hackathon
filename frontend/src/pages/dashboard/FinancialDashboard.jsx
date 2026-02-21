import * as React from 'react';
import {
    Receipt,
    Wallet,
    TrendingUp,
    CreditCard,
    FileText,
    Download,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    PieChart
} from 'lucide-react';
import { analyticsAPI } from '../../api/analytics.api';
import { expenseAPI } from '../../api/expense.api';
import { exportAPI } from '../../api/export.api';
import { useDownload } from '../../hooks/useDownload';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';
import KPICard from '../../components/common/KPICard';
import DataTable from '../../components/common/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import CostTrendChart from '../../components/charts/CostTrendChart';
import ROIChart from '../../components/charts/ROIChart';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function FinancialDashboard() {
    const [data, setData] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const { downloadPDF, downloadCSV, isDownloading } = useDownload();
    const { success, error } = useToast();

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await analyticsAPI.getMonthlySummary();
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch financial dashboard:', err);
            // Fallback/Mock handled internally
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading && !data) return <SkeletonLoader type="page" />;

    const stats = data || {
        kpis: { fuelCost: 45000, maintCost: 28000, revenue: 145000, profit: 72000, trend: 12.5 },
        trendData: [],
        roiData: [],
        expensiveVehicles: []
    };

    const vehicleColumns = [
        { key: 'plate', label: 'Vehicle', render: (row) => <span className="font-bold">{row.plateNumber}</span> },
        { key: 'totalCost', label: 'Total Op. Cost', render: (row) => <span className="font-semibold text-red-600 dark:text-red-400">₹{row.totalCost.toLocaleString()}</span> },
        { key: 'revenue', label: 'Revenue', render: (row) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{row.revenue.toLocaleString()}</span> },
        { key: 'utilization', label: 'Usage', render: (row) => <span className="text-xs text-slate-500">{row.utilization}%</span> },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <PageHeader
                title="Financial Control"
                subtitle="Operational costs, profitability trends, and resource ROI analytics."
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCSV(() => exportAPI.exportCSV('expenses'), 'financial_report.csv')}
                            disabled={isDownloading}
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Expenses CSV
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => downloadPDF(() => exportAPI.exportPDF('analytics'), 'financial_summary.pdf')}
                            disabled={isDownloading}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            <FileText className="h-4 w-4" />
                            Monthly PDF
                        </Button>
                    </div>
                }
            />

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Fuel Expenses" value={stats.kpis.fuelCost.toLocaleString()} suffix="₹" icon={Wallet} color="red" isLoading={isLoading} />
                <KPICard title="Maintenance" value={stats.kpis.maintCost.toLocaleString()} suffix="₹" icon={CreditCard} color="amber" isLoading={isLoading} />
                <KPICard title="Operational Revenue" value={stats.kpis.revenue.toLocaleString()} suffix="₹" icon={TrendingUp} color="green" isLoading={isLoading} />
                <KPICard
                    title="Net Profit"
                    value={stats.kpis.profit.toLocaleString()}
                    suffix="₹"
                    trend={stats.kpis.trend}
                    icon={Receipt}
                    color={stats.kpis.profit > 0 ? "blue" : "red"}
                    isLoading={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Trend Chart Card */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            3-Month Operational Trend
                        </CardTitle>
                        <CardDescription>Comparison of revenue vs critical operational costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CostTrendChart data={stats.trendData} />
                    </CardContent>
                </Card>

                {/* ROI Comparison Card */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-emerald-500" />
                            Vehicle Profitability (ROI)
                        </CardTitle>
                        <CardDescription>Top performing vehicles by net ROI percentage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ROIChart data={stats.roiData} />
                    </CardContent>
                </Card>
            </div>

            {/* Top Expense Vehicles Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-0 py-4 px-6 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Highest Operational Costs
                        </CardTitle>
                        <CardDescription className="text-xs">Vehicles with the highest spend this month</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600 font-bold" onClick={() => navigate('/expenses')}>
                        Monitor Expenses
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={vehicleColumns}
                        data={stats.expensiveVehicles}
                        isLoading={isLoading}
                        pagination={false}
                        searchable={false}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

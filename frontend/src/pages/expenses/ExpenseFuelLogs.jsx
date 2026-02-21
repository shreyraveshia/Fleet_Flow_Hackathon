import * as React from 'react';
import {
    Receipt,
    Wallet,
    TrendingUp,
    Activity,
    Plus,
    Filter,
    X,
    Calendar,
    Truck,
    User,
    MapPin,
    IndianRupee,
    MoreVertical,
    Trash2,
    Edit2,
    AlertCircle,
    Fuel
} from 'lucide-react';
import { expenseAPI } from '../../api/expense.api';
import { useVehicleStore } from '../../store/vehicleStore';
import { useDriverStore } from '../../store/driverStore';
import { useRBAC } from '../../hooks/useRBAC';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function ExpenseFuelLogs() {
    const [expenses, setExpenses] = React.useState([]);
    const [summary, setSummary] = React.useState({ fuel: 0, other: 0, total: 0, avgEfficiency: 0 });
    const [isLoading, setIsLoading] = React.useState(true);
    const [total, setTotal] = React.useState(0);
    const [pagination, setPagination] = React.useState({ page: 1, limit: 10 });
    const [filters, setFilters] = React.useState({ type: '', vehicleId: '', startDate: '', endDate: '' });

    const { vehicles, fetchVehicles } = useVehicleStore();
    const { drivers, fetchDrivers } = useDriverStore();
    const { can } = useRBAC();
    const { success, error } = useToast();

    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedExpense, setSelectedExpense] = React.useState(null);

    const [formData, setFormData] = React.useState({
        vehicleId: '',
        type: 'Fuel',
        date: format(new Date(), 'yyyy-MM-dd'),
        driverId: '',
        tripId: '',
        liters: '',
        costPerLiter: '',
        distanceCovered: '',
        totalCost: '',
        notes: ''
    });

    const fetchExpenses = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([
                expenseAPI.getAll({ ...filters, ...pagination }),
                expenseAPI.getMonthlySummary()
            ]);
            setExpenses(listRes.data.expenses);
            setTotal(listRes.data.total);
            setSummary(summaryRes.data);
        } catch (err) {
            error('Failed to load expense logs');
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination, error]);

    React.useEffect(() => {
        fetchExpenses();
        fetchVehicles({ limit: 100 });
        fetchDrivers({ limit: 100 });
    }, [fetchExpenses, fetchVehicles, fetchDrivers]);

    // Live Calculations
    const calcTotalCost = formData.type === 'Fuel' ? (parseFloat(formData.liters) * parseFloat(formData.costPerLiter) || 0) : formData.totalCost;
    const calcEfficiency = (parseFloat(formData.distanceCovered) / parseFloat(formData.liters)) || 0;

    const handleCreate = async () => {
        try {
            await expenseAPI.create({
                ...formData,
                totalCost: formData.type === 'Fuel' ? calcTotalCost : parseFloat(formData.totalCost),
                liters: parseFloat(formData.liters),
                distanceCovered: parseFloat(formData.distanceCovered),
                fuelEfficiency: formData.type === 'Fuel' ? calcEfficiency : undefined
            });
            success('Expense log added successfully');
            setIsAddModalOpen(false);
            fetchExpenses();
        } catch (err) {
            error(err.message || 'Failed to add expense');
        }
    };

    const handleDelete = async () => {
        try {
            await expenseAPI.delete(selectedExpense._id);
            success('Expense record deleted');
            setIsDeleteModalOpen(false);
            fetchExpenses();
        } catch (err) {
            error('Failed to delete record');
        }
    };

    const columns = [
        { key: 'date', label: 'Date', render: (row) => <span className="text-xs font-semibold">{format(new Date(row.date), 'MMM dd, yyyy')}</span> },
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{row.vehicle?.plateNumber}</span>
                    <span className="text-[10px] text-slate-500">{row.vehicle?.name}</span>
                </div>
            )
        },
        { key: 'driver', label: 'Driver', render: (row) => <span className="text-xs font-medium">{row.driver?.name || 'N/A'}</span> },
        { key: 'type', label: 'Type', render: (row) => <Badge variant="outline" className="text-[10px] font-bold uppercase">{row.type}</Badge> },
        {
            key: 'fuelDetails',
            label: 'Fuel Details',
            render: (row) => row.type === 'Fuel' ? (
                <span className="text-[10px] text-slate-500 font-medium">
                    {row.liters} L × ₹{row.costPerLiter || (row.totalCost / row.liters).toFixed(2)}
                </span>
            ) : <span className="text-slate-300">—</span>
        },
        { key: 'totalCost', label: 'Total Cost', render: (row) => <span className="font-black text-sm text-red-600 dark:text-red-400">₹{row.totalCost?.toLocaleString()}</span> },
        {
            key: 'efficiency',
            label: 'FE (km/L)',
            render: (row) => {
                if (row.type !== 'Fuel') return <span className="text-slate-300">—</span>;
                const eff = row.fuelEfficiency || (row.distanceCovered / row.liters);
                const color = eff > 15 ? "text-emerald-500" : eff > 10 ? "text-amber-500" : "text-red-500";
                return <span className={cn("font-bold text-xs", color)}>{eff?.toFixed(1)}</span>
            }
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                        {(can('financial') || can('manager')) && (
                            <>
                                <DropdownMenuItem><Edit2 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedExpense(row); setIsDeleteModalOpen(true); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </>
                        )}
                        <DropdownMenuItem><ClipboardList className="h-4 w-4 mr-2" /> Details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-8 pb-10">
            <PageHeader
                title="Expense & Fuel Logs"
                subtitle="Manage fleet expenditures, track fuel efficiency, and monitor operational costs."
                actions={
                    (can('financial') || can('manager')) && (
                        <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Expense Record
                        </Button>
                    )
                }
            />

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Monthly Fuel" value={summary.fuel?.toLocaleString()} suffix="₹" icon={Fuel} color="blue" />
                <KPICard title="Fixed/Operational" value={summary.other?.toLocaleString()} suffix="₹" icon={Wallet} color="amber" />
                <KPICard title="Total Spend" value={summary.total?.toLocaleString()} suffix="₹" icon={TrendingUp} color="red" />
                <KPICard title="Fleet Efficiency" value={summary.avgEfficiency?.toFixed(1)} suffix=" km/L" icon={Activity} color="emerald" />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <div className="flex flex-1 gap-4">
                    <Select value={filters.vehicleId} onValueChange={(v) => setFilters(f => ({ ...f, vehicleId: v }))}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Vehicles</SelectItem>
                            {vehicles.map(v => <SelectItem key={v._id} value={v._id}>{v.plateNumber}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.type} onValueChange={(v) => setFilters(f => ({ ...f, type: v }))}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Types</SelectItem>
                            <SelectItem value="Fuel">Fuel</SelectItem>
                            <SelectItem value="Toll">Toll</SelectItem>
                            <SelectItem value="Repair">Repair</SelectItem>
                            <SelectItem value="Parking">Parking</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-4">
                    <Input type="date" value={filters.startDate} onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))} className="w-[160px]" />
                    <Input type="date" value={filters.endDate} onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))} className="w-[160px]" />
                    {(filters.vehicleId || filters.type || filters.startDate) && (
                        <Button variant="ghost" onClick={() => setFilters({ type: '', vehicleId: '', startDate: '', endDate: '' })}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <DataTable columns={columns} data={expenses} isLoading={isLoading} total={total} onPageChange={(p) => setPagination(pv => ({ ...pv, page: p }))} onLimitChange={(l) => setPagination(pv => ({ ...pv, limit: l }))} />
            </Card>

            {/* ADD MODAL */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Expense Record" size="lg">
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vehicle</Label>
                            <Select onValueChange={(v) => setFormData(p => ({ ...p, vehicleId: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => <SelectItem key={v._id} value={v._id}>{v.plateNumber} — {v.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Expense Type</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Fuel', 'Toll', 'Repair', 'Parking', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {formData.type === 'Fuel' ? (
                        <div className="space-y-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/30">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Liters (L)</Label>
                                    <Input type="number" step="0.01" value={formData.liters} onChange={(e) => setFormData(p => ({ ...p, liters: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cost Per Liter (₹/L)</Label>
                                    <Input type="number" step="0.01" value={formData.costPerLiter} onChange={(e) => setFormData(p => ({ ...p, costPerLiter: e.target.value }))} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-3 rounded-lg border">
                                <div className="text-xs font-bold text-slate-500 uppercase">Calculated Total</div>
                                <div className="text-xl font-black text-emerald-600">₹{calcTotalCost.toLocaleString()}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Distance Since Last Fill (km)</Label>
                                    <Input type="number" value={formData.distanceCovered} onChange={(e) => setFormData(p => ({ ...p, distanceCovered: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Efficiency</Label>
                                    <div className="h-10 px-3 flex items-center bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-blue-600">
                                        {calcEfficiency > 0 ? calcEfficiency.toFixed(2) : "0.00"} km/L
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Total Cost (₹)</Label>
                            <Input type="number" value={formData.totalCost} onChange={(e) => setFormData(p => ({ ...p, totalCost: e.target.value }))} />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Driver (Optional)</Label>
                            <Select onValueChange={(v) => setFormData(p => ({ ...p, driverId: v }))}>
                                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                                <SelectContent>
                                    {drivers.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!formData.vehicleId || isLoading}>Save ExpenseRecord</Button>
                    </div>
                </div>
            </Modal>

            {/* DELETE MODAL */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Permanently Delete Record?"
                message="This will remove the expense entry from all financial calculations. This action cannot be undone."
                variant="danger"
            />
        </div>
    );
}

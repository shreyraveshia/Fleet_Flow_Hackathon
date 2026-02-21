import * as React from 'react';
import {
    Wrench,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Plus,
    Search,
    Calendar,
    User,
    Gauge,
    IndianRupee,
    MoreVertical,
    Filter,
    X,
    Truck,
    Bus,
    Bike,
    ClipboardList
} from 'lucide-react';
import { maintenanceAPI } from '../../api/maintenance.api';
import { useVehicleStore } from '../../store/vehicleStore';
import { useRBAC } from '../../hooks/useRBAC';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusPill from '../../components/common/StatusPill';
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
import { cn, formatDate } from '../../lib/utils';
import { format } from 'date-fns';

export default function MaintenanceLogs() {
    const [logs, setLogs] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [total, setTotal] = React.useState(0);
    const [filters, setFilters] = React.useState({ status: '', vehicleId: '' });
    const [pagination, setPagination] = React.useState({ page: 1, limit: 10 });

    const { vehicles, fetchVehicles } = useVehicleStore();
    const { can } = useRBAC();
    const { success, error, info } = useToast();

    // Modal States
    const [isLogModalOpen, setIsLogModalOpen] = React.useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = React.useState(false);
    const [isConfirmInShopOpen, setIsConfirmInShopOpen] = React.useState(false);
    const [selectedLog, setSelectedLog] = React.useState(null);
    const [logFormData, setLogFormData] = React.useState({
        vehicleId: '',
        serviceType: '',
        description: '',
        cost: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        odometerAtService: '',
        technicianName: ''
    });

    const fetchLogs = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { page: pagination.page, limit: pagination.limit };
            if (filters.status) params.status = filters.status;
            if (filters.vehicleId) params.vehicle = filters.vehicleId;
            const response = await maintenanceAPI.getAll(params);
            setLogs(response.data.logs || []);
            setTotal(response.data.total || 0);
        } catch (err) {
            error('Failed to fetch maintenance logs');
        } finally {
            setIsLoading(false);
        }
    }, [filters, pagination, error]);

    React.useEffect(() => {
        fetchLogs();
        fetchVehicles({ limit: 100 });
    }, [fetchLogs, fetchVehicles]);

    const stats = React.useMemo(() => {
        const active = logs.filter(l => l.status === 'In Progress').length;
        const completedThisMonth = logs.filter(l => {
            const date = new Date(l.date);
            const now = new Date();
            return l.status === 'Completed' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;
        const totalCost = logs.reduce((acc, l) => acc + (l.cost || 0), 0);
        return { active, completedThisMonth, totalCost };
    }, [logs]);

    const handleLogSubmit = async () => {
        try {
            await maintenanceAPI.create({ ...logFormData, vehicle: logFormData.vehicleId });
            const vehicle = vehicles.find(v => v._id === logFormData.vehicleId);
            success(`Maintenance logged. ${vehicle?.licensePlate} moved to In Shop.`);
            setIsLogModalOpen(false);
            setIsConfirmInShopOpen(false);
            fetchLogs();
        } catch (err) {
            error(err.message || 'Failed to log maintenance');
        }
    };

    const handleResolve = async () => {
        try {
            await maintenanceAPI.resolve(selectedLog._id);
            success(`Maintenance resolved. Vehicle is now Available.`);
            setIsResolveModalOpen(false);
            fetchLogs();
        } catch (err) {
            error(err.message || 'Failed to resolve maintenance');
        }
    };

    const selectedVehicleForLog = vehicles.find(v => v._id === logFormData.vehicleId);

    const columns = [
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: (row) => {
                const Icon = row.vehicle?.type === 'Truck' ? Truck : row.vehicle?.type === 'Van' ? Bus : Bike;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">{row.vehicle?.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono uppercase">{row.vehicle?.licensePlate}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'serviceType',
            label: 'Service Type',
            render: (row) => <Badge variant="secondary" className="text-[10px] font-bold uppercase">{row.serviceType}</Badge>
        },
        {
            key: 'description',
            label: 'Description',
            render: (row) => (
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={row.description}>
                    {row.description}
                </p>
            )
        },
        {
            key: 'cost',
            label: 'Cost',
            render: (row) => <span className="font-bold text-sm">₹{row.cost?.toLocaleString()}</span>
        },
        {
            key: 'date',
            label: 'Date',
            render: (row) => <span className="text-xs font-medium text-slate-500">{formatDate(row.date, 'MMM dd, yyyy')}</span>
        },
        {
            key: 'technician',
            label: 'Technician',
            render: (row) => (
                <div className="flex items-center gap-2 text-xs font-medium">
                    <User className="h-3 w-3 text-slate-400" />
                    {row.technicianName || '—'}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusPill status={row.status} size="xs" />
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {row.status === 'In Progress' && can('manage_vehicles') && (
                            <DropdownMenuItem onClick={() => { setSelectedLog(row); setIsResolveModalOpen(true); }}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                                Mark Completed
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                            <ClipboardList className="h-4 w-4 mr-2 text-blue-500" />
                            View Full Details
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Maintenance & Service Logs"
                subtitle="Track fleet repairs, scheduled maintenance, and operational health."
                actions={
                    can('manage_vehicles') && (
                        <Button onClick={() => setIsLogModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200">
                            <Plus className="h-4 w-4 mr-2" />
                            Log New Service
                        </Button>
                    )
                }
            />

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Maintenance</p>
                            <h3 className="text-2xl font-black mt-1">₹{stats.totalCost.toLocaleString()}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <IndianRupee className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Services</p>
                            <h3 className="text-2xl font-black mt-1 text-amber-600">{stats.active}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-600">
                            <Wrench className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-none shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed (Month)</p>
                            <h3 className="text-2xl font-black mt-1 text-emerald-600">{stats.completedThisMonth}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <div className="flex-1 flex gap-4">
                    <Select value={filters.status || 'all'} onValueChange={(v) => setFilters(f => ({ ...f, status: v === 'all' ? '' : v }))}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.vehicleId || 'all'} onValueChange={(v) => setFilters(f => ({ ...f, vehicleId: v === 'all' ? '' : v }))}>
                        <SelectTrigger className="w-[250px]"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vehicles</SelectItem>
                            {vehicles.map(v => (
                                <SelectItem key={v._id} value={v._id}>{v.licensePlate} — {v.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {(filters.status || filters.vehicleId) && (
                    <Button variant="ghost" size="icon" onClick={() => setFilters({ status: '', vehicleId: '' })} className="text-slate-400">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Data Table */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={logs}
                        isLoading={isLoading}
                        total={total}
                        page={pagination.page}
                        limit={pagination.limit}
                        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                        onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l }))}
                    />
                </CardContent>
            </Card>

            {/* LOG SERVICE MODAL */}
            <Modal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                title="Schedule Maintenance"
                size="lg"
            >
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Vehicle</Label>
                            <Select onValueChange={(val) => setLogFormData(p => ({ ...p, vehicleId: val }))}>
                                <SelectTrigger className="h-12"><SelectValue placeholder="Select vehicle for service..." /></SelectTrigger>
                                <SelectContent>
                                    {vehicles.filter(v => v.status !== 'On Trip' && v.status !== 'Retired').map(v => (
                                        <SelectItem key={v._id} value={v._id}>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">{v.licensePlate}</span>
                                                <Badge variant="outline" className="text-[9px]">{v.status}</Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedVehicleForLog?.status === 'Available' && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                        Adding this log will move <b>{selectedVehicleForLog.name}</b> to 'In Shop' and remove it from the active dispatch pool.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Service Type</Label>
                                <Select onValueChange={(val) => setLogFormData(p => ({ ...p, serviceType: val }))}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        {['Oil Change', 'Tire Replacement', 'Engine Repair', 'Brake Service', 'Electrical', 'Body Work', 'Other'].map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Service Date</Label>
                                <Input type="date" value={logFormData.date} onChange={(e) => setLogFormData(p => ({ ...p, date: e.target.value }))} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Estimated Cost (₹)</Label>
                                <Input type="number" placeholder="0" value={logFormData.cost} onChange={(e) => setLogFormData(p => ({ ...p, cost: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Current Odometer (km)</Label>
                                <Input type="number" placeholder={selectedVehicleForLog?.odometer || 0} value={logFormData.odometerAtService} onChange={(e) => setLogFormData(p => ({ ...p, odometerAtService: e.target.value }))} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Technician / Garage Name</Label>
                            <Input placeholder="Enter name..." value={logFormData.technicianName} onChange={(e) => setLogFormData(p => ({ ...p, technicianName: e.target.value }))} />
                        </div>

                        <div className="space-y-2">
                            <Label>Description of Work</Label>
                            <Textarea placeholder="Explain the service required or performed..." className="min-h-[100px]" value={logFormData.description} onChange={(e) => setLogFormData(p => ({ ...p, description: e.target.value }))} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
                        {selectedVehicleForLog?.status === 'Available' ? (
                            <Button onClick={() => setIsConfirmInShopOpen(true)} className="bg-amber-600 hover:bg-amber-700">Continue Dispatch Fix</Button>
                        ) : (
                            <Button onClick={handleLogSubmit} disabled={!logFormData.vehicleId || !logFormData.serviceType}>Schedule Service</Button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* RESOLVE MAINTENANCE MODAL */}
            {selectedLog && (
                <ConfirmModal
                    isOpen={isResolveModalOpen}
                    onClose={() => setIsResolveModalOpen(false)}
                    title="Resolve Maintenance"
                    message={`Are you sure the service for ${selectedLog.vehicle?.licensePlate} is complete?`}
                    onConfirm={handleResolve}
                >
                    <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                            Confirming will move <b>{selectedLog.vehicle?.name}</b> back to 'Available' status and ready for trips.
                        </p>
                    </div>
                </ConfirmModal>
            )}

            {/* CONFIRM IN SHOP STEP MODAL */}
            <ConfirmModal
                isOpen={isConfirmInShopOpen}
                onClose={() => setIsConfirmInShopOpen(false)}
                title="Confirm In-Shop Transition"
                message={`This will move ${selectedVehicleForLog?.plateNumber} to 'In Shop' status. It cannot be dispatched until resolved. Continue?`}
                onConfirm={handleLogSubmit}
                variant="warning"
            />
        </div>
    );
}

import * as React from 'react';
import {
    Users,
    Plus,
    Search,
    LayoutGrid,
    Table as TableIcon,
    AlertCircle,
    AlertTriangle,
    User,
    Phone,
    Mail,
    Calendar,
    Award,
    Truck,
    Bus,
    Bike,
    MoreVertical,
    Edit2,
    Trash2,
    History,
    ShieldAlert,
    ChevronRight,
    Filter,
    X
} from 'lucide-react';
import { useDriverStore } from '../../store/driverStore';
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
import { Separator } from '../../components/ui/separator';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
// RadioGroup and Slider use native HTML elements
import { cn } from '../../lib/utils';
import { format, differenceInDays, isPast, addDays } from 'date-fns';

const EMPTY_FORM = {
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: format(addDays(new Date(), 730), 'yyyy-MM-dd'), // 2 years default
    licenseCategory: 'Truck',
    safetyScore: 100,
    joiningDate: format(new Date(), 'yyyy-MM-dd'),
};

export default function DriverProfiles() {
    const {
        drivers,
        total,
        isLoading,
        fetchDrivers,
        createDriver,
        updateDriver,
        updateDriverStatus,
        deleteDriver,
        expiryAlerts,
        fetchExpiryAlerts,
        setFilters,
    } = useDriverStore();

    const { can } = useRBAC();
    const { success, error, info } = useToast();

    const canManage = can('manage_drivers'); // fleet_manager + safety_officer

    const [viewMode, setViewMode] = React.useState('grid'); // 'grid' | 'table'
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedDriver, setSelectedDriver] = React.useState(null);

    const [formData, setFormData] = React.useState({ ...EMPTY_FORM });
    const [editData, setEditData] = React.useState({ ...EMPTY_FORM });
    const [statusData, setStatusData] = React.useState({ status: '', reason: '' });
    const [pagination, setPagination] = React.useState({ page: 1, limit: 12 });

    // Local search state — avoids re-render blocking typing, debounces API call
    const [searchInput, setSearchInput] = React.useState('');

    React.useEffect(() => {
        fetchExpiryAlerts();
    }, [fetchExpiryAlerts]);

    React.useEffect(() => {
        fetchDrivers(pagination);
    }, [fetchDrivers, pagination]);

    // Debounce search → push to store filter after 400ms
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({ search: searchInput });
            setPagination(prev => ({ ...prev, page: 1 }));
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput, setFilters]);

    const criticalExpiryCount = expiryAlerts.filter(a => a.daysUntilExpiry < 7).length;
    const warningExpiryCount = expiryAlerts.filter(a => a.daysUntilExpiry >= 7 && a.daysUntilExpiry < 30).length;

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleAddSubmit = async () => {
        if (!formData.name || !formData.licenseNumber) {
            error('Name and License Number are required');
            return;
        }
        const expiryDate = new Date(formData.licenseExpiry);
        if (isPast(expiryDate)) {
            error('License expiry cannot be in the past');
            return;
        }
        try {
            await createDriver(formData);
            success(`Driver ${formData.name} added successfully`);
            setIsAddModalOpen(false);
            setFormData({ ...EMPTY_FORM });
            fetchDrivers(pagination); // refresh list
        } catch (err) {
            error(err.message || 'Failed to create driver');
        }
    };

    const openEditModal = (driver) => {
        setSelectedDriver(driver);
        setEditData({
            name: driver.name,
            email: driver.email || '',
            phone: driver.phone || '',
            licenseNumber: driver.licenseNumber,
            licenseExpiry: driver.licenseExpiry ? format(new Date(driver.licenseExpiry), 'yyyy-MM-dd') : '',
            licenseCategory: driver.licenseCategory,
            safetyScore: driver.safetyScore,
            joiningDate: driver.joiningDate ? format(new Date(driver.joiningDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async () => {
        if (!editData.name || !editData.licenseNumber) {
            error('Name and License Number are required');
            return;
        }
        try {
            await updateDriver(selectedDriver._id, editData);
            success(`Driver ${editData.name} updated successfully`);
            setIsEditModalOpen(false);
            fetchDrivers(pagination);
        } catch (err) {
            error(err.message || 'Failed to update driver');
        }
    };

    const openStatusModal = (driver) => {
        setSelectedDriver(driver);
        setStatusData({ status: driver.status, reason: '' });
        setIsStatusModalOpen(true);
    };

    const handleStatusUpdate = async () => {
        try {
            await updateDriverStatus(selectedDriver._id, statusData);
            success(`Driver status updated to ${statusData.status}`);
            setIsStatusModalOpen(false);
            fetchDrivers(pagination);
        } catch (err) {
            error(err.message || 'Failed to update status');
        }
    };

    const handleDeleteSubmit = async () => {
        try {
            await deleteDriver(selectedDriver._id);
            success('Driver profile deleted');
            setIsDeleteModalOpen(false);
            fetchDrivers(pagination);
        } catch (err) {
            error(err.message || 'Failed to delete driver');
        }
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────

    const getExpiryDisplay = (expiryDate) => {
        if (!expiryDate) return { label: 'No Date', class: 'text-slate-400', indicator: 'text-slate-400' };
        const days = differenceInDays(new Date(expiryDate), new Date());
        if (isPast(new Date(expiryDate))) return { label: 'EXPIRED', class: 'bg-red-500 text-white px-1 rounded', indicator: 'text-red-500' };
        if (days < 7) return { label: `Expires in ${days}d`, class: 'text-red-500 font-bold animate-pulse', indicator: 'text-red-500' };
        if (days < 30) return { label: `Expires in ${days}d`, class: 'text-amber-500 font-bold', indicator: 'text-amber-500' };
        return { label: 'Valid', class: 'text-emerald-500 font-medium', indicator: 'text-emerald-500' };
    };

    const getScoreColor = (score) => {
        if (score > 80) return 'bg-emerald-500';
        if (score > 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    // ─── Table Columns ─────────────────────────────────────────────────────────

    const columns = [
        {
            key: 'driver',
            label: 'Driver',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm",
                        getScoreColor(row.safetyScore)
                    )}>
                        {row.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-none">{row.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{row.phone || 'No Phone'}</p>
                    </div>
                </div>
            )
        },
        { key: 'license', label: 'License #', render: (row) => <span className="font-mono text-xs uppercase">{row.licenseNumber}</span> },
        {
            key: 'category',
            label: 'Category',
            render: (row) => <Badge variant="secondary" className="text-[10px] font-bold uppercase">{row.licenseCategory}</Badge>
        },
        { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} size="xs" /> },
        {
            key: 'expiry',
            label: 'License Expiry',
            render: (row) => {
                const expiry = getExpiryDisplay(row.licenseExpiry);
                return <span className={cn("text-xs", expiry.class)}>{expiry.label}</span>;
            }
        },
        {
            key: 'safety',
            label: 'Safety Score',
            render: (row) => (
                <div className="flex items-center gap-2 w-28">
                    <Progress value={row.safetyScore} className="h-1.5 flex-1" />
                    <span className="text-xs font-bold">{row.safetyScore}%</span>
                </div>
            )
        },
        {
            key: 'trips',
            label: 'Trips',
            render: (row) => <span className="text-xs font-medium text-slate-600">{row.completedTrips || 0} / {row.totalTrips || 0}</span>
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {canManage && (
                            <DropdownMenuItem onClick={() => openStatusModal(row)}>
                                <History className="h-4 w-4 mr-2 text-blue-500" /> Change Status
                            </DropdownMenuItem>
                        )}
                        {canManage && (
                            <DropdownMenuItem onClick={() => openEditModal(row)}>
                                <Edit2 className="h-4 w-4 mr-2 text-emerald-500" /> Edit Details
                            </DropdownMenuItem>
                        )}
                        {!canManage && (
                            <DropdownMenuItem disabled>
                                <User className="h-4 w-4 mr-2" /> View Only
                            </DropdownMenuItem>
                        )}
                        {canManage && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedDriver(row); setIsDeleteModalOpen(true); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8 pb-10">
            <PageHeader
                title="Driver Profiles"
                subtitle="Manage fleet operators, track safety scores and monitor license compliance."
                actions={
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <Button
                                variant={viewMode === 'grid' ? 'white' : 'ghost'}
                                size="xs"
                                onClick={() => setViewMode('grid')}
                                className={cn("h-7 px-3", viewMode === 'grid' && "bg-white dark:bg-slate-900 shadow-sm")}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'white' : 'ghost'}
                                size="xs"
                                onClick={() => setViewMode('table')}
                                className={cn("h-7 px-3", viewMode === 'table' && "bg-white dark:bg-slate-900 shadow-sm")}
                            >
                                <TableIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        {/* Add Driver — only for fleet_manager and safety_officer */}
                        {canManage && (
                            <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Driver
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Expiry Alert Banners */}
            <div className="space-y-3">
                {criticalExpiryCount > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">
                            🚨 {criticalExpiryCount} driver(s) have licenses expiring within 7 days. Immediate action required.
                        </p>
                    </div>
                )}
                {warningExpiryCount > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                            ⚠️ {warningExpiryCount} driver(s) have licenses expiring within 30 days. Plan renewals.
                        </p>
                    </div>
                )}
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name or license..."
                        className="pl-10 h-10 rounded-xl"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                            onClick={() => setSearchInput('')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Grid View ── */}
            {viewMode === 'grid' ? (
                isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : drivers.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold">No drivers found</p>
                        <p className="text-sm">Try adjusting your search or add a new driver.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {drivers.map(driver => {
                            const expiry = getExpiryDisplay(driver.licenseExpiry);
                            const scoreColor = getScoreColor(driver.safetyScore);
                            return (
                                <Card key={driver._id} className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={cn("h-14 w-14 rounded-full flex items-center justify-center text-xl font-black text-white shadow-xl ring-4 ring-white dark:ring-slate-900", scoreColor)}>
                                                {driver.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <StatusPill status={driver.status} />
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{driver.name}</h3>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs text-slate-400 uppercase tracking-tighter">{driver.licenseNumber}</span>
                                                <Badge variant="outline" className="text-[9px] h-4 py-0 font-bold uppercase">{driver.licenseCategory}</Badge>
                                            </div>
                                        </div>

                                        <Separator className="my-4 opacity-50" />

                                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">License</p>
                                                <p className={cn(expiry.class)}>{expiry.label}</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Reliability</p>
                                                <p className="text-slate-700 dark:text-slate-300">
                                                    {driver.completedTrips || 0} Trips ({((driver.completedTrips / (driver.totalTrips || 1)) * 100).toFixed(0)}%)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">Safety Rating</span>
                                                <span className={cn("text-xs font-black", scoreColor.replace('bg-', 'text-'))}>{driver.safetyScore}%</span>
                                            </div>
                                            <Progress value={driver.safetyScore} className="h-2 rounded-full" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex divide-x divide-slate-100 dark:divide-slate-800">
                                        {canManage ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    className="flex-1 h-12 rounded-none text-xs font-bold gap-2 text-slate-600"
                                                    onClick={() => openStatusModal(driver)}
                                                >
                                                    <History className="h-4 w-4" /> Status
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="flex-1 h-12 rounded-none text-xs font-bold gap-2 text-slate-600"
                                                    onClick={() => openEditModal(driver)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" /> Edit
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex-1 h-12 flex items-center justify-center text-xs text-slate-400 gap-2">
                                                <User className="h-3.5 w-3.5" /> View Only
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )
            ) : (
                // ── Table View ──
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={drivers}
                        isLoading={isLoading}
                        total={total}
                        page={pagination.page}
                        limit={pagination.limit}
                        onPageChange={(p) => setPagination(pv => ({ ...pv, page: p }))}
                        onLimitChange={(l) => setPagination(pv => ({ ...pv, limit: l }))}
                        searchable={false}
                        emptyMessage="No drivers found matching your search."
                    />
                </Card>
            )}

            {/* ── ADD DRIVER MODAL ── */}
            <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setFormData({ ...EMPTY_FORM }); }} title="Register New Driver" size="lg">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="E.g. Kiran Mehta" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>License Category</Label>
                                <div className="flex gap-4 h-10 items-center">
                                    {['Van', 'Truck', 'Bike'].map(cat => (
                                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="add-licenseCategory"
                                                value={cat}
                                                checked={formData.licenseCategory === cat}
                                                onChange={() => setFormData(p => ({ ...p, licenseCategory: cat }))}
                                                className="accent-blue-600"
                                            />
                                            <span className="text-xs uppercase font-bold">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input type="email" placeholder="driver@fleet.com" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input placeholder="9876500001" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>License Number <span className="text-red-500">*</span></Label>
                                <Input className="font-mono uppercase" placeholder="MH0120240099" value={formData.licenseNumber} onChange={(e) => setFormData(p => ({ ...p, licenseNumber: e.target.value.toUpperCase() }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>License Expiry</Label>
                                <Input type="date" value={formData.licenseExpiry} onChange={(e) => setFormData(p => ({ ...p, licenseExpiry: e.target.value }))} />
                                {formData.licenseExpiry && differenceInDays(new Date(formData.licenseExpiry), new Date()) < 30 && (
                                    <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> License expires soon
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Joining Date</Label>
                                <Input type="date" value={formData.joiningDate} onChange={(e) => setFormData(p => ({ ...p, joiningDate: e.target.value }))} />
                            </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Base Safety Score</Label>
                                <span className={cn("text-sm font-black", formData.safetyScore > 80 ? 'text-emerald-600' : formData.safetyScore > 60 ? 'text-amber-600' : 'text-red-600')}>{formData.safetyScore}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={formData.safetyScore}
                                onChange={(e) => setFormData(p => ({ ...p, safetyScore: parseInt(e.target.value) }))}
                                className="w-full accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>SUSPENSION RISK</span>
                                <span>FLAWLESS</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setFormData({ ...EMPTY_FORM }); }}>Cancel</Button>
                        <Button
                            onClick={handleAddSubmit}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isLoading || !formData.name || !formData.licenseNumber}
                        >
                            {isLoading ? 'Saving...' : 'Add Driver'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── EDIT DRIVER MODAL ── */}
            {selectedDriver && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit — ${selectedDriver.name}`} size="lg">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name <span className="text-red-500">*</span></Label>
                                    <Input value={editData.name} onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>License Category</Label>
                                    <div className="flex gap-4 h-10 items-center">
                                        {['Van', 'Truck', 'Bike'].map(cat => (
                                            <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="edit-licenseCategory"
                                                    value={cat}
                                                    checked={editData.licenseCategory === cat}
                                                    onChange={() => setEditData(p => ({ ...p, licenseCategory: cat }))}
                                                    className="accent-blue-600"
                                                />
                                                <span className="text-xs uppercase font-bold">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input type="email" value={editData.email} onChange={(e) => setEditData(p => ({ ...p, email: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input value={editData.phone} onChange={(e) => setEditData(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>License Number <span className="text-red-500">*</span></Label>
                                    <Input className="font-mono uppercase" value={editData.licenseNumber} onChange={(e) => setEditData(p => ({ ...p, licenseNumber: e.target.value.toUpperCase() }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>License Expiry</Label>
                                    <Input type="date" value={editData.licenseExpiry} onChange={(e) => setEditData(p => ({ ...p, licenseExpiry: e.target.value }))} />
                                </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Safety Score</Label>
                                    <span className={cn("text-sm font-black", editData.safetyScore > 80 ? 'text-emerald-600' : editData.safetyScore > 60 ? 'text-amber-600' : 'text-red-600')}>{editData.safetyScore}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={editData.safetyScore}
                                    onChange={(e) => setEditData(p => ({ ...p, safetyScore: parseInt(e.target.value) }))}
                                    className="w-full accent-blue-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleEditSubmit}
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading || !editData.name || !editData.licenseNumber}
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── STATUS CHANGE MODAL ── */}
            {selectedDriver && (
                <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Change Driver Status">
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">{selectedDriver.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono tracking-tighter">{selectedDriver.licenseNumber}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current</p>
                                <StatusPill status={selectedDriver.status} size="sm" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>New Status</Label>
                            <Select value={statusData.status} onValueChange={(v) => setStatusData(p => ({ ...p, status: v }))}>
                                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['Available', 'Off Duty', 'Suspended'].map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Warning for Suspended */}
                        {statusData.status === 'Suspended' && (
                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex gap-3">
                                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                                    <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                                        <b>WARNING:</b> This driver cannot be assigned to any trips and will be removed from the dispatch pool immediately.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Suspension Reason (optional)</Label>
                                    <Textarea
                                        placeholder="Document internal incident or compliance failure..."
                                        value={statusData.reason}
                                        onChange={(e) => setStatusData(p => ({ ...p, reason: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Hint for Available */}
                        {statusData.status === 'Available' && statusData.status !== selectedDriver.status && (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                ✅ Driver will be immediately available for assignment to new trips.
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Discard</Button>
                            <Button
                                onClick={handleStatusUpdate}
                                disabled={isLoading || statusData.status === selectedDriver.status}
                                className={cn(statusData.status === 'Suspended' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")}
                            >
                                {isLoading ? 'Applying...' : 'Apply Changes'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── DELETE MODAL ── */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteSubmit}
                title="Permanently Delete Driver?"
                message={`This will remove all history and records for ${selectedDriver?.name}. This action is irreversible.`}
                variant="danger"
                isLoading={isLoading}
            />
        </div>
    );
}

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Truck,
    Bus,
    Bike,
    Plus,
    Filter,
    MoreVertical,
    Edit2,
    RefreshCcw,
    Trash2,
    Calendar,
    MapPin,
    Gauge,
    Weight,
    Copy,
    CheckCircle2,
    Wrench,
    Search,
    X,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { useVehicleStore } from '../../store/vehicleStore';
import { useRBAC } from '../../hooks/useRBAC';
import { useToast } from '../../hooks/useToast';
import { useSocket } from '../../hooks/useSocket';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusPill from '../../components/common/StatusPill';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function VehicleRegistry() {
    const {
        vehicles,
        total,
        isLoading,
        fetchVehicles,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        updateVehicleStatus,
        filters,
        setFilters
    } = useVehicleStore();

    const { can } = useRBAC();
    const { success, error, info } = useToast();
    const { on, off } = useSocket();
    const navigate = useNavigate();

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
    const [isRetireModalOpen, setIsRetireModalOpen] = React.useState(false);

    const [selectedVehicle, setSelectedVehicle] = React.useState(null);
    const [retireConfirmation, setRetireConfirmation] = React.useState('');
    const [statusToChange, setStatusToChange] = React.useState('');

    const [pagination, setPagination] = React.useState({ page: 1, limit: 10 });

    React.useEffect(() => {
        fetchVehicles(pagination);
    }, [fetchVehicles, filters, pagination]);

    React.useEffect(() => {
        const handleUpdate = () => {
            fetchVehicles(pagination);
        };

        on('fleet_update', handleUpdate);
        return () => off('fleet_update', handleUpdate);
    }, [on, off, fetchVehicles, pagination]);

    const handleCopyPlate = (plate) => {
        navigator.clipboard.writeText(plate);
        info('License plate copied to clipboard');
    };

    const clearFilters = () => {
        setFilters({ search: '', type: '', status: '' });
    };

    // --- Handlers ---
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            await createVehicle({
                ...data,
                plateNumber: data.plateNumber.toUpperCase(),
                year: parseInt(data.year),
                capacity: parseInt(data.capacity),
                odometer: parseInt(data.odometer),
                nextServiceDue: parseInt(data.nextServiceDue),
                acquisitionCost: parseInt(data.acquisitionCost),
            });
            success('Vehicle added successfully');
            setIsAddModalOpen(false);
        } catch (err) {
            error(err.message || 'Failed to add vehicle');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            await updateVehicle(selectedVehicle._id, {
                ...data,
                plateNumber: data.plateNumber.toUpperCase(),
                year: parseInt(data.year),
                capacity: parseInt(data.capacity),
                odometer: parseInt(data.odometer),
                nextServiceDue: parseInt(data.nextServiceDue),
            });
            success('Vehicle updated successfully');
            setIsEditModalOpen(false);
        } catch (err) {
            error(err.message || 'Failed to update vehicle');
        }
    };

    const handleStatusUpdate = async () => {
        try {
            await updateVehicleStatus(selectedVehicle._id, statusToChange);
            success(`Vehicle status updated to ${statusToChange}`);
            setIsStatusModalOpen(false);
        } catch (err) {
            error(err.message || 'Failed to update status');
        }
    };

    const handleRetireSubmit = async () => {
        if (retireConfirmation !== selectedVehicle.plateNumber) {
            error('License plate does not match');
            return;
        }
        try {
            await deleteVehicle(selectedVehicle._id);
            success('Vehicle retired successfully');
            setIsRetireModalOpen(false);
            setRetireConfirmation('');
        } catch (err) {
            error(err.message || 'Failed to retire vehicle');
        }
    };

    // --- Column Definition ---
    const columns = [
        {
            key: 'name',
            label: 'Vehicle',
            render: (row) => {
                const Icon = row.type === 'Truck' ? Truck : row.type === 'Van' ? Bus : Bike;
                const isServiceDue = row.odometer >= (row.nextServiceDue - 1000);
                return (
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg shrink-0",
                            isServiceDue ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                        )}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white truncate">{row.name}</span>
                                {isServiceDue && (
                                    <Badge variant="warning" className="h-4 px-1 text-[8px] animate-pulse">SERVICE DUE</Badge>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{row.make} {row.model}</p>
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'plateNumber',
            label: 'License Plate',
            render: (row) => (
                <div
                    className="group flex items-center gap-2 font-mono text-sm font-bold bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-fit cursor-pointer hover:bg-white transition-all shadow-sm active:scale-95"
                    onClick={(e) => { e.stopPropagation(); handleCopyPlate(row.plateNumber); }}
                >
                    {row.plateNumber}
                    <Copy className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => <Badge variant="outline" className="font-bold text-[10px] uppercase select-none">{row.type}</Badge>
        },
        {
            key: 'capacity',
            label: 'Capacity',
            render: (row) => (
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Weight className="h-3 w-3 text-slate-400" />
                    {row.capacity?.toLocaleString()} kg
                </div>
            )
        },
        {
            key: 'odometer',
            label: 'Odometer',
            render: (row) => {
                const isServiceDue = row.odometer >= (row.nextServiceDue - 1000);
                return (
                    <div className={cn(
                        "flex flex-col gap-0.5",
                        isServiceDue && "text-amber-600 dark:text-amber-400"
                    )}>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                            <Gauge className="h-3 w-3" />
                            {row.odometer?.toLocaleString()} km
                        </div>
                        <span className="text-[10px] opacity-60">Next: {row.nextServiceDue?.toLocaleString()} km</span>
                    </div>
                )
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusPill status={row.status} size="sm" />
        },
        { key: 'region', label: 'Region' },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Vehicle Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/vehicles/${row._id}`)}>
                            <ExternalLink className="mr-2 h-4 w-4 text-blue-500" />
                            View Details
                        </DropdownMenuItem>
                        {can('manage_vehicles') && (
                            <>
                                <DropdownMenuItem onClick={() => { setSelectedVehicle(row); setIsEditModalOpen(true); }}>
                                    <Edit2 className="mr-2 h-4 w-4 text-emerald-500" />
                                    Edit Vehicle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedVehicle(row); setStatusToChange(row.status); setIsStatusModalOpen(true); }}>
                                    <RefreshCcw className="mr-2 h-4 w-4 text-amber-500" />
                                    Change Status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => { setSelectedVehicle(row); setIsRetireModalOpen(true); }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Retire Vehicle
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Vehicle Registry"
                subtitle="Complete catalog of fleet assets, maintenance status, and assignments."
                actions={
                    can('manage_vehicles') && (
                        <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Vehicle
                        </Button>
                    )
                }
            />

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, plate, or model..."
                        className="pl-10"
                        value={filters.search}
                        onChange={(e) => setFilters({ search: e.target.value })}
                    />
                </div>
                <div className="flex gap-4 min-w-[320px]">
                    <Select value={filters.type} onValueChange={(val) => setFilters({ type: val })}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Types</SelectItem>
                            <SelectItem value="Truck">Trucks</SelectItem>
                            <SelectItem value="Van">Vans</SelectItem>
                            <SelectItem value="Bike">Bikes</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.status} onValueChange={(val) => setFilters({ status: val })}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="On Trip">On Trip</SelectItem>
                            <SelectItem value="In Shop">In Shop</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                        </SelectContent>
                    </Select>

                    {(filters.search || filters.type || filters.status) && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 text-slate-400 hover:text-red-500">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Table Container */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={vehicles}
                        isLoading={isLoading}
                        total={total}
                        page={pagination.page}
                        limit={pagination.limit}
                        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                        onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l }))}
                        onRowClick={(row) => navigate(`/vehicles/${row._id}`)}
                    />
                </CardContent>
            </Card>

            {/* Modals */}

            {/* Add Vehicle Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Vehicle"
                size="lg"
            >
                <form onSubmit={handleAddSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vehicle Name</Label>
                            <Input name="name" placeholder="Heavy Hauler 01" required />
                        </div>
                        <div className="space-y-2">
                            <Label>License Plate</Label>
                            <Input name="plateNumber" placeholder="MH 12 AB 1234" className="uppercase" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Make</Label>
                            <Input name="make" placeholder="Tata" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Model</Label>
                            <Input name="model" placeholder="Prima 4923.S" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input name="year" type="number" placeholder="2023" defaultValue={2023} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Region</Label>
                            <Input name="region" placeholder="West" defaultValue="West" required />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm font-bold opacity-70">Vehicle Configuration</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select name="type" defaultValue="Truck">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Truck">Truck</SelectItem>
                                        <SelectItem value="Van">Van</SelectItem>
                                        <SelectItem value="Bike">Bike</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Fuel Type</Label>
                                <Select name="fuelType" defaultValue="Diesel">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Diesel">Diesel</SelectItem>
                                        <SelectItem value="Petrol">Petrol</SelectItem>
                                        <SelectItem value="Electric">Electric</SelectItem>
                                        <SelectItem value="CNG">CNG</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Load (kg)</Label>
                                <Input name="capacity" type="number" placeholder="15000" required />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm font-bold opacity-70">Maintenance & Cost</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Initial Odometer (km)</Label>
                                <Input name="odometer" type="number" placeholder="0" defaultValue={0} />
                            </div>
                            <div className="space-y-2">
                                <Label>First Service at (km)</Label>
                                <Input name="nextServiceDue" type="number" placeholder="5000" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Acquisition Cost (₹)</Label>
                                <Input name="acquisitionCost" type="number" placeholder="4500000" required />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>Add Vehicle</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Vehicle Modal */}
            {selectedVehicle && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title={`Edit ${selectedVehicle.plateNumber}`}
                    size="lg"
                >
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Vehicle Name</Label>
                                <Input name="name" defaultValue={selectedVehicle.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label>License Plate</Label>
                                <Input name="plateNumber" defaultValue={selectedVehicle.plateNumber} className="uppercase" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Make</Label>
                                <Input name="make" defaultValue={selectedVehicle.make} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Model</Label>
                                <Input name="model" defaultValue={selectedVehicle.model} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Region</Label>
                                <Input name="region" defaultValue={selectedVehicle.region} />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Load (kg)</Label>
                                <Input name="capacity" type="number" defaultValue={selectedVehicle.capacity} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Current Odometer (km)</Label>
                                <Input name="odometer" type="number" defaultValue={selectedVehicle.odometer} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Next Service (km)</Label>
                                <Input name="nextServiceDue" type="number" defaultValue={selectedVehicle.nextServiceDue} required />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading}>Save Changes</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Status Change Modal */}
            {selectedVehicle && (
                <Modal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                    title="Update Vehicle Status"
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Current Status</p>
                                <div className="mt-1"><StatusPill status={selectedVehicle.status} /></div>
                            </div>
                            <ArrowRight className="h-6 w-6 text-slate-300" />
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">New Status</p>
                                <div className="mt-1"><StatusPill status={statusToChange} /></div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Select New Status</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Available', 'On Trip', 'In Shop', 'Retired'].map((s) => (
                                    <Button
                                        key={s}
                                        variant={statusToChange === s ? 'default' : 'outline'}
                                        className="justify-start gap-2 h-11"
                                        onClick={() => setStatusToChange(s)}
                                    >
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            s === 'Available' ? "bg-emerald-500" : s === 'On Trip' ? "bg-blue-500" : s === 'In Shop' ? "bg-amber-500" : "bg-slate-500"
                                        )} />
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                                {statusToChange === 'In Shop' && "Maintenance mode: This vehicle will be hidden from the dispatch selector."}
                                {statusToChange === 'Available' && "Vehicle will be immediately available for assignment to new trips."}
                                {statusToChange === 'Retired' && "Permanently removes vehicle from active operational lists."}
                                {statusToChange === 'On Trip' && "Marking as active on trip manually. Usually handled via trip dispatch."}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleStatusUpdate} disabled={isLoading || statusToChange === selectedVehicle.status}>
                                Update Status
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Retire Confirm Modal */}
            {selectedVehicle && (
                <ConfirmModal
                    isOpen={isRetireModalOpen}
                    onClose={() => { setIsRetireModalOpen(false); setRetireConfirmation(''); }}
                    variant="danger"
                    title="Retire Asset Permanently"
                    message={`Are you sure you want to retire vehicle ${selectedVehicle.name}? This action is irreversible.`}
                    onConfirm={handleRetireSubmit}
                    isLoading={isLoading}
                >
                    <div className="mt-6 space-y-4">
                        <div className="space-y-2 text-left">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Type plate to confirm: <span className="text-slate-900 dark:text-white">{selectedVehicle.plateNumber}</span></Label>
                            <Input
                                value={retireConfirmation}
                                onChange={(e) => setRetireConfirmation(e.target.value.toUpperCase())}
                                placeholder="PL4T3 NUMB3R"
                                className="font-mono text-center uppercase"
                            />
                        </div>
                    </div>
                </ConfirmModal>
            )}
        </div>
    );
}

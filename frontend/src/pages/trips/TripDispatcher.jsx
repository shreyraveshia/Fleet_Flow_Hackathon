import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Truck,
    User,
    MapPin,
    Package,
    IndianRupee,
    MoreVertical,
    ChevronRight,
    Gauge,
    Calendar,
    Weight,
    History,
    Info,
    Send,
    Ban,
    ClipboardCheck
} from 'lucide-react';
import { useTripStore } from '../../store/tripStore';
import { useVehicleStore } from '../../store/vehicleStore';
import { useDriverStore } from '../../store/driverStore';
import { useRBAC } from '../../hooks/useRBAC';
import { useToast } from '../../hooks/useToast';
import { useSocket } from '../../hooks/useSocket';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusPill from '../../components/common/StatusPill';
import Modal from '../../components/common/Modal';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { cn, formatDate, formatDistanceToNow } from '../../lib/utils';
import { format, addDays } from 'date-fns';

export default function TripDispatcher() {
    const {
        trips,
        total,
        isLoading,
        activeFilter,
        setFilter,
        fetchTrips,
        fetchTrip,
        createTrip,
        advanceStatus,
        selectedTrip,
        tripTimeline
    } = useTripStore();

    const { availableVehicles, fetchAvailableVehicles } = useVehicleStore();
    const { availableDrivers, fetchAvailableDrivers } = useDriverStore();
    const { can } = useRBAC();
    const { success, error, info: toastInfo } = useToast();
    const { on, off } = useSocket();
    const navigate = useNavigate();

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

    // Create Trip Local State
    const [step, setStep] = React.useState(1);
    const [formData, setFormData] = React.useState({
        vehicleId: '',
        driverId: '',
        cargoWeight: '',
        cargoDescription: '',
        origin: '',
        destination: '',
        estimatedDistance: '',
        estimatedFuelCost: '',
        estimatedRevenue: ''
    });

    // Status Advance State
    const [statusAction, setStatusAction] = React.useState({ type: '', target: '' });
    const [statusFormData, setStatusFormData] = React.useState({
        endOdometer: '',
        actualFuelCost: '',
        actualRevenue: '',
        reason: ''
    });

    const [pagination, setPagination] = React.useState({ page: 1, limit: 10 });

    React.useEffect(() => {
        fetchTrips(pagination);
    }, [fetchTrips, activeFilter, pagination]);

    React.useEffect(() => {
        const handleFleetUpdate = (data) => {
            if (data.type === 'trip_status_changed') {
                fetchTrips(pagination);
                if (selectedTrip && data.tripId === selectedTrip._id) {
                    fetchTrip(selectedTrip._id);
                }
            }
        };
        on('fleet_update', handleFleetUpdate);
        return () => off('fleet_update', handleFleetUpdate);
    }, [on, off, fetchTrips, pagination, selectedTrip, fetchTrip]);

    const selectedVehicleObj = availableVehicles.find(v => v._id === formData.vehicleId);
    const selectedDriverObj = availableDrivers.find(d => d._id === formData.driverId);

    const getWeightValidation = () => {
        if (!formData.cargoWeight || !selectedVehicleObj) return null;
        const weight = parseInt(formData.cargoWeight);
        const capacity = selectedVehicleObj.capacity;
        const percentage = (weight / capacity) * 100;
        const over = weight - capacity;

        if (percentage > 100) return { color: 'text-red-600', icon: XCircle, message: `❌ OVERWEIGHT — Cannot dispatch. Exceeds capacity by ${over}kg`, isDisallowed: true };
        if (percentage >= 90) return { color: 'text-orange-600', icon: AlertTriangle, message: `⚠️ ${weight}kg / ${capacity}kg — Near limit` };
        if (percentage >= 70) return { color: 'text-amber-600', icon: AlertTriangle, message: `⚠️ ${weight}kg / ${capacity}kg — Heavy load` };
        return { color: 'text-emerald-600', icon: CheckCircle2, message: `✓ ${weight}kg / ${capacity}kg — Good` };
    };

    const validation = getWeightValidation();

    // --- Handlers ---
    const handleOpenCreate = () => {
        setStep(1);
        setFormData({
            vehicleId: '', driverId: '', cargoWeight: '', cargoDescription: '',
            origin: '', destination: '', estimatedDistance: '',
            estimatedFuelCost: '', estimatedRevenue: ''
        });
        fetchAvailableVehicles();
        setIsCreateModalOpen(true);
    };

    const handleVehicleSelect = (vId) => {
        setFormData(prev => ({ ...prev, vehicleId: vId, driverId: '' }));
        const vehicle = availableVehicles.find(v => v._id === vId);
        fetchAvailableDrivers(vehicle?.type);
    };

    const handleCreateSubmit = async () => {
        try {
            await createTrip({
                ...formData,
                cargoWeight: parseInt(formData.cargoWeight),
                estimatedDistance: parseInt(formData.estimatedDistance) || 0,
                estimatedFuelCost: parseInt(formData.estimatedFuelCost) || 0,
                estimatedRevenue: parseInt(formData.estimatedRevenue) || 0
            });
            success('Trip dispatched successfully');
            setIsCreateModalOpen(false);
        } catch (err) {
            error(err.message || 'Failed to create trip');
        }
    };

    const handleStatusSubmit = async () => {
        try {
            await advanceStatus(selectedTrip._id, {
                status: statusAction.target,
                ...statusFormData,
                endOdometer: parseInt(statusFormData.endOdometer),
                actualFuelCost: parseInt(statusFormData.actualFuelCost),
                actualRevenue: parseInt(statusFormData.actualRevenue)
            });
            success(`Trip status updated to ${statusAction.target}`);
            setIsStatusModalOpen(false);
        } catch (err) {
            error(err.message);
        }
    };

    const getNextStatus = (current) => {
        if (current === 'Draft') return 'Dispatched';
        if (current === 'Dispatched') return 'In Transit';
        if (current === 'In Transit') return 'Completed';
        return null;
    };

    // --- Table Columns ---
    const columns = [
        {
            key: 'tripId',
            label: 'Trip ID',
            render: (row) => (
                <span
                    className="font-mono font-bold text-blue-600 hover:underline cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); fetchTrip(row._id); setIsDetailModalOpen(true); }}
                >
                    FF-{row.tripId?.toString().toUpperCase()}
                </span>
            )
        },
        {
            key: 'vehicle',
            label: 'Vehicle',
            render: (row) => (
                <div className="min-w-[120px]">
                    <p className="font-bold text-sm leading-none">{row.vehicle?.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{row.vehicle?.plateNumber}</p>
                </div>
            )
        },
        {
            key: 'driver',
            label: 'Driver',
            render: (row) => (
                <div className="min-w-[120px]">
                    <p className="font-bold text-sm leading-none">{row.driver?.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-1">{row.driver?.licenseCategory}</p>
                </div>
            )
        },
        {
            key: 'route',
            label: 'Route',
            render: (row) => (
                <div className="flex items-center gap-2 text-xs font-semibold max-w-[180px]">
                    <span className="truncate">{row.origin}</span>
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                    <span className="truncate">{row.destination}</span>
                </div>
            )
        },
        {
            key: 'cargo',
            label: 'Cargo',
            render: (row) => {
                const isNearLimit = row.cargoWeight >= (row.vehicle?.capacity * 0.8);
                return (
                    <span className={cn("text-xs font-bold", isNearLimit && "text-red-500")}>
                        {row.cargoWeight?.toLocaleString()} kg
                    </span>
                )
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusPill status={row.status} size="xs" />
        },
        {
            key: 'revenue',
            label: 'Revenue',
            render: (row) => <span className="text-xs font-bold text-slate-700">₹{(row.actualRevenue || row.estimatedRevenue || 0).toLocaleString()}</span>
        },
        {
            key: 'createdAt',
            label: 'Created',
            render: (row) => <span className="text-[10px] text-slate-500 font-medium">{formatDistanceToNow(row.createdAt)}</span>
        },
        {
            key: 'actions',
            label: '',
            render: (row) => {
                const next = getNextStatus(row.status);
                if (row.status === 'Completed' || row.status === 'Cancelled') {
                    return (
                        <Button variant="ghost" size="icon" onClick={() => { fetchTrip(row._id); setIsDetailModalOpen(true); }}>
                            <Info className="h-4 w-4 text-slate-400" />
                        </Button>
                    )
                }
                return (
                    <div className="flex gap-2">
                        {next && (
                            <Button
                                size="xs"
                                variant="outline"
                                className="h-7 text-[10px] font-bold bg-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchTrip(row._id);
                                    setStatusAction({ type: 'advance', target: next });
                                    setStatusFormData({ endOdometer: '', actualFuelCost: '', actualRevenue: row.estimatedRevenue || '', reason: '' });
                                    setIsStatusModalOpen(true);
                                }}
                            >
                                {next === 'Dispatched' ? 'Dispatch →' : next === 'In Transit' ? 'Start →' : 'Complete ✓'}
                            </Button>
                        )}
                        <Button
                            size="xs"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                fetchTrip(row._id);
                                setStatusAction({ type: 'cancel', target: 'Cancelled' });
                                setStatusFormData({ endOdometer: '', actualFuelCost: '', actualRevenue: '', reason: '' });
                                setIsStatusModalOpen(true);
                            }}
                        >
                            <Ban className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )
            }
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Trip Dispatcher"
                subtitle="Orchestrate deliveries, monitor in-transit status and handle fleet lifecycle."
                actions={
                    (can('dispatch_trips') || can('manager')) && (
                        <Button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 shadow-lg border-2 border-white dark:border-slate-900">
                            <Plus className="h-4 w-4 mr-2" />
                            Plan New Trip
                        </Button>
                    )
                }
            />

            {/* Status Tabs */}
            <Tabs value={activeFilter} onValueChange={setFilter} className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 h-12 rounded-xl grid grid-cols-3 md:grid-cols-6 mb-6">
                    {['All', 'Draft', 'Dispatched', 'In Transit', 'Completed', 'Cancelled'].map(s => (
                        <TabsTrigger
                            key={s}
                            value={s}
                            className="rounded-lg font-bold text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm data-[state=active]:text-indigo-600"
                        >
                            {s}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            {/* Main Table View */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={trips}
                        isLoading={isLoading}
                        total={total}
                        page={pagination.page}
                        limit={pagination.limit}
                        onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                        onLimitChange={(l) => setPagination(prev => ({ ...prev, limit: l }))}
                        onRowClick={(row) => { fetchTrip(row._id); setIsDetailModalOpen(true); }}
                        emptyMessage={`No ${activeFilter === 'All' ? '' : activeFilter.toLowerCase()} trips found.`}
                    />
                </CardContent>
            </Card>

            {/* --- CREATE TRIP MODAL (STEP-BY-STEP) --- */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Dispatch Wizard"
                size="lg"
            >
                <div className="space-y-6">
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between px-10 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
                        {[1, 2, 3, 4].map(s => (
                            <div
                                key={s}
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2",
                                    step === s ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200" :
                                        step > s ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-400"
                                )}
                            >
                                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                            </div>
                        ))}
                    </div>

                    <Separator className="dark:bg-slate-800" />

                    {/* STEP 1: Select Vehicle */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <Label className="text-sm font-bold opacity-70">STEP 1: ASSIGN VEHICLE</Label>
                                <div className="mt-3 space-y-4">
                                    <Select onValueChange={handleVehicleSelect} value={formData.vehicleId}>
                                        <SelectTrigger className="h-14"><SelectValue placeholder="Browse Available Vehicles..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableVehicles.map(v => (
                                                <SelectItem key={v._id} value={v._id}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold">{v.plateNumber}</span>
                                                        <Badge variant="outline" className="text-[9px] uppercase">{v.type}</Badge>
                                                        <span className="text-xs text-slate-400">({v.capacity.toLocaleString()}kg)</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {availableVehicles.length === 0 && <SelectItem disabled>No vehicles available</SelectItem>}
                                        </SelectContent>
                                    </Select>

                                    {selectedVehicleObj && (
                                        <Card className="bg-slate-50 dark:bg-slate-900 border-dashed border-2">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                    <Truck className="h-6 w-6 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm leading-tight">{selectedVehicleObj.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{selectedVehicleObj.plateNumber}</p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Max Payload</p>
                                                    <p className="font-bold text-blue-600">{selectedVehicleObj.capacity.toLocaleString()} kg</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep(2)} disabled={!formData.vehicleId}>Assign Driver →</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Select Driver */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <Label className="text-sm font-bold opacity-70">STEP 2: ASSIGN DRIVER</Label>
                                <div className="mt-3 space-y-4">
                                    <Select onValueChange={(val) => setFormData(p => ({ ...p, driverId: val }))} value={formData.driverId}>
                                        <SelectTrigger className="h-14"><SelectValue placeholder="Select Qualified Driver..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableDrivers.map(d => (
                                                <SelectItem key={d._id} value={d._id}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold">{d.name}</span>
                                                        <Badge variant="secondary" className="text-[9px] uppercase">{d.licenseCategory}</Badge>
                                                        <span className="text-xs text-emerald-500 font-bold">Score: {d.safetyScore}%</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {availableDrivers.length === 0 && <SelectItem disabled>No qualified drivers available</SelectItem>}
                                        </SelectContent>
                                    </Select>

                                    {selectedDriverObj && (
                                        <Card className="bg-slate-50 dark:bg-slate-900 border-dashed border-2">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                                    <User className="h-6 w-6 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm leading-tight">{selectedDriverObj.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">License: {selectedDriverObj.licenseNumber}</p>
                                                </div>
                                                <div className="ml-auto text-right">
                                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                                        <Badge variant="outline" className="text-[9px]">Exp: {formatDate(selectedDriverObj.licenseExpiry, 'MM/YY')}</Badge>
                                                    </div>
                                                    <p className="font-bold text-emerald-600">Safety {selectedDriverObj.safetyScore}%</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={() => setStep(3)} disabled={!formData.driverId}>Load Cargo →</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Route & Cargo */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Origin</Label>
                                    <Input
                                        placeholder="Source Location"
                                        value={formData.origin}
                                        onChange={(e) => setFormData(p => ({ ...p, origin: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Destination</Label>
                                    <Input
                                        placeholder="Delivery Point"
                                        value={formData.destination}
                                        onChange={(e) => setFormData(p => ({ ...p, destination: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                    <Label className="font-bold">Cargo Integration</Label>
                                    {validation && (
                                        <div className={cn("flex items-center gap-1.5 text-xs font-bold", validation.color)}>
                                            <validation.icon className="h-3 w-3" />
                                            {validation.message}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Cargo Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 5000"
                                        className={cn("h-12 text-lg font-bold", validation?.isDisallowed && "border-red-500 text-red-600")}
                                        value={formData.cargoWeight}
                                        onChange={(e) => setFormData(p => ({ ...p, cargoWeight: e.target.value }))}
                                    />
                                </div>
                                <Textarea
                                    placeholder="Optional cargo description (fragile, perishable, etc.)"
                                    className="text-xs"
                                    value={formData.cargoDescription}
                                    onChange={(e) => setFormData(p => ({ ...p, cargoDescription: e.target.value }))}
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={() => setStep(4)} disabled={!formData.origin || !formData.destination || !formData.cargoWeight || validation?.isDisallowed}>Financials →</Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Financials & Summary */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Estimated Distance (km)</Label>
                                    <Input type="number" value={formData.estimatedDistance} onChange={(e) => setFormData(p => ({ ...p, estimatedDistance: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Quoted Revenue (₹)</Label>
                                    <Input type="number" value={formData.estimatedRevenue} onChange={(e) => setFormData(p => ({ ...p, estimatedRevenue: e.target.value }))} className="text-emerald-600 font-bold" />
                                </div>
                            </div>

                            <Card className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
                                <CardContent className="p-5 space-y-4">
                                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4" />
                                        Dispatch Summary
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Resource Pair</p>
                                            <p className="text-sm font-bold truncate">{selectedVehicleObj.plateNumber} + {selectedDriverObj.name.split(' ')[0]}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Route</p>
                                            <p className="text-sm font-bold truncate">{formData.origin} → {formData.destination}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Planned Payload</p>
                                            <p className={cn("text-sm font-bold", validation?.color)}>{formData.cargoWeight} kg</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Financial</p>
                                            <p className="text-sm font-bold text-emerald-600">₹{parseInt(formData.estimatedRevenue || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 w-48 shadow-lg shadow-indigo-100" onClick={handleCreateSubmit} disabled={isLoading}>
                                    Confirm & Dispatch
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* --- STATUS ADVANCE MODAL --- */}
            {selectedTrip && (
                <Modal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                    title={statusAction.type === 'cancel' ? "Cancel Trip" : "Advance Status"}
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="text-center flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Current</p>
                                <StatusPill status={selectedTrip.status} size="sm" />
                            </div>
                            <ArrowRight className="h-6 w-6 text-slate-300" />
                            <div className="text-center flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Target</p>
                                <StatusPill status={statusAction.target} size="sm" />
                            </div>
                        </div>

                        {statusAction.target === 'Completed' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Final Odometer Reading (km)</Label>
                                    <Input
                                        type="number"
                                        placeholder={`Current: ${selectedTrip.vehicle?.odometer}`}
                                        required
                                        value={statusFormData.endOdometer}
                                        onChange={(e) => setStatusFormData(p => ({ ...p, endOdometer: e.target.value }))}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Actual Fuel Cost (₹)</Label>
                                        <Input type="number" value={statusFormData.actualFuelCost} onChange={(e) => setStatusFormData(p => ({ ...p, actualFuelCost: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Final Revenue (₹)</Label>
                                        <Input type="number" value={statusFormData.actualRevenue} onChange={(e) => setStatusFormData(p => ({ ...p, actualRevenue: e.target.value }))} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {statusAction.target === 'Cancelled' && (
                            <div className="space-y-2">
                                <Label>Cancellation Reason</Label>
                                <Textarea
                                    placeholder="Explain why this trip is being cancelled..."
                                    required
                                    value={statusFormData.reason}
                                    onChange={(e) => setStatusFormData(p => ({ ...p, reason: e.target.value }))}
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
                            <Button
                                variant={statusAction.type === 'cancel' ? 'destructive' : 'default'}
                                onClick={handleStatusSubmit}
                                disabled={isLoading || (statusAction.target === 'Completed' && !statusFormData.endOdometer) || (statusAction.target === 'Cancelled' && !statusFormData.reason)}
                            >
                                {statusAction.type === 'cancel' ? 'Confirm Cancellation' : `Update to ${statusAction.target}`}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* --- TRIP DETAIL PANEL (SLIDE-IN) --- */}
            {selectedTrip && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={`Trip Detail — FF-${selectedTrip.tripId?.toString().toUpperCase()}`}
                    size="lg"
                >
                    <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Split Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Resource Cards */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Resources</h4>
                                <div className="space-y-3">
                                    <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                                        <CardContent className="p-4 flex gap-3">
                                            <div className="h-10 w-10 shrink-0 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500 border border-slate-100 dark:border-slate-800">
                                                <Truck className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate leading-tight">{selectedTrip.vehicle?.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">{selectedTrip.vehicle?.plateNumber}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-none">
                                        <CardContent className="p-4 flex gap-3">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-slate-800">
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate leading-tight">{selectedTrip.driver?.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">#{selectedTrip.driver?.licenseNumber}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Route & Cargo */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Route & Load</h4>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20">
                                        <div className="space-y-1 min-w-0 flex-1 text-center">
                                            <p className="text-[8px] font-bold text-indigo-400 uppercase">Origin</p>
                                            <p className="text-xs font-bold truncate">{selectedTrip.origin}</p>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-indigo-300 shrink-0" />
                                        <div className="space-y-1 min-w-0 flex-1 text-center">
                                            <p className="text-[8px] font-bold text-indigo-400 uppercase">Destination</p>
                                            <p className="text-xs font-bold truncate">{selectedTrip.destination}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Cargo Weight</p>
                                            <p className="text-sm font-bold">{selectedTrip.cargoWeight?.toLocaleString()} kg</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">Revenue</p>
                                            <p className="text-sm font-bold text-emerald-600">₹{(selectedTrip.actualRevenue || selectedTrip.estimatedRevenue || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Stepper Timeline */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Trip Status Lifecycle
                            </h4>

                            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                                {tripTimeline.map((item, idx) => {
                                    const isLast = idx === tripTimeline.length - 1;
                                    return (
                                        <div key={idx} className="relative animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className={cn(
                                                "absolute -left-8 h-6 w-6 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center z-10 shadow-sm transition-all",
                                                isLast ? "bg-indigo-600 scale-125 ring-4 ring-indigo-100 dark:ring-indigo-900/30" : "bg-slate-200 dark:bg-slate-700"
                                            )}>
                                                {isLast && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <p className={cn("text-xs font-bold", isLast ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                                                        {item.status}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">• {formatDate(item.timestamp, 'MMM dd, HH:mm')}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-0.5 italic flex items-center gap-1">
                                                    <User className="h-2 w-2" />
                                                    {item.user?.name || 'System'}
                                                    {item.note && <span className="not-italic opacity-70 ml-2">— "{item.note}"</span>}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close Panel</Button>
                        {(selectedTrip.status !== 'Completed' && selectedTrip.status !== 'Cancelled') && (
                            <Button onClick={() => { setIsDetailModalOpen(false); setIsStatusModalOpen(true); setStatusAction({ type: 'advance', target: getNextStatus(selectedTrip.status) }); }}>
                                Manage Status
                            </Button>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}

import { useAuthStore } from '../store/authStore';

const PERMISSIONS = {
    fleet_manager: [
        'view_dashboard', 'manage_vehicles', 'view_vehicles', 'create_trips', 'view_trips',
        'manage_drivers', 'view_drivers', 'manage_maintenance', 'view_maintenance',
        'manage_expenses', 'view_expenses', 'view_analytics', 'export_reports', 'view_audit_logs'
    ],
    dispatcher: [
        'view_dashboard', 'view_vehicles', 'create_trips', 'view_trips', 'view_drivers',
        'view_maintenance', 'manage_expenses', 'view_expenses'
    ],
    safety_officer: [
        'view_dashboard', 'manage_drivers', 'view_drivers', 'view_vehicles', 'view_trips',
        'view_maintenance', 'view_analytics', 'export_reports', 'view_expiry_alerts'
    ],
    financial: [
        'view_dashboard', 'view_vehicles', 'view_trips', 'view_expenses', 'manage_expenses',
        'view_analytics', 'export_reports'
    ],
};

export const useRBAC = () => {
    const { user } = useAuthStore();
    const role = user?.role;

    const can = (permission) => {
        if (!role) return false;
        // Managers have all permissions implicitly or explicitly
        if (role === 'fleet_manager') return true;
        return PERMISSIONS[role]?.includes(permission) || false;
    };

    const canAny = (...permissions) => {
        return permissions.some(permission => can(permission));
    };

    const canAll = (...permissions) => {
        return permissions.every(permission => can(permission));
    };

    return {
        can,
        canAny,
        canAll,
        role,
        user,
        isManager: role === 'fleet_manager',
        isDispatcher: role === 'dispatcher',
        isSafety: role === 'safety_officer',
        isFinancial: role === 'financial',
    };
};

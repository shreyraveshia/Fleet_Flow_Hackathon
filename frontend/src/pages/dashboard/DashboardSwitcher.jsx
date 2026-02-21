import React, { Suspense, lazy } from 'react';
import { useRBAC } from '../../hooks/useRBAC';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ManagerDashboard = lazy(() => import('./ManagerDashboard'));
const DispatcherDashboard = lazy(() => import('./DispatcherDashboard'));
const SafetyDashboard = lazy(() => import('./SafetyDashboard'));
const FinancialDashboard = lazy(() => import('./FinancialDashboard'));

export default function DashboardSwitcher() {
    const { role } = useRBAC();

    return (
        <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
            {role === 'fleet_manager' && <ManagerDashboard />}
            {role === 'dispatcher' && <DispatcherDashboard />}
            {role === 'safety_officer' && <SafetyDashboard />}
            {role === 'financial' && <FinancialDashboard />}
            {!role && <div className="p-8 text-center text-slate-500">Initializing dashboard...</div>}
        </Suspense>
    );
}

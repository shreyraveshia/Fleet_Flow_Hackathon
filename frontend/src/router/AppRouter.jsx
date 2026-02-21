import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Layout
import RoleLayout from '../components/layout/RoleLayout';

// Auth
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));

// Dashboards
const DashboardSwitcher = lazy(() => import('../pages/dashboard/DashboardSwitcher'));
const ManagerDashboard = lazy(() => import('../pages/dashboard/ManagerDashboard'));
const DispatcherDashboard = lazy(() => import('../pages/dashboard/DispatcherDashboard'));
const SafetyDashboard = lazy(() => import('../pages/dashboard/SafetyDashboard'));
const FinancialDashboard = lazy(() => import('../pages/dashboard/FinancialDashboard'));

// Fleet Management
const VehicleRegistry = lazy(() => import('../pages/vehicles/VehicleRegistry'));
const DriverProfiles = lazy(() => import('../pages/drivers/DriverProfiles'));

// Operations
const TripDispatcher = lazy(() => import('../pages/trips/TripDispatcher'));
const MaintenanceLogs = lazy(() => import('../pages/maintenance/MaintenanceLogs'));
const ExpenseFuelLogs = lazy(() => import('../pages/expenses/ExpenseFuelLogs'));

// Analytics
const Analytics = lazy(() => import('../pages/analytics/Analytics'));

// Other
const NotFound = lazy(() => import('../pages/NotFound'));

// Wrapper to show loader during route transitions
const LazyFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" />
    </div>
);

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Suspense fallback={<LazyFallback />}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Redirect base to login */}
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* Protected Routes Wrapper */}
                    <Route path="/dashboard" element={<ProtectedRoute><RoleLayout /></ProtectedRoute>}>
                        {/* Dashboard Home */}
                        <Route index element={<DashboardSwitcher />} />

                        {/* Specific Dashboards (Guarded) */}
                        <Route path="dashboards/manager" element={<RoleRoute permission="view_dashboard"><ManagerDashboard /></RoleRoute>} />
                        <Route path="dashboards/dispatcher" element={<RoleRoute permission="view_dashboard"><DispatcherDashboard /></RoleRoute>} />
                        <Route path="dashboards/safety" element={<RoleRoute permission="view_dashboard"><SafetyDashboard /></RoleRoute>} />
                        <Route path="dashboards/financial" element={<RoleRoute permission="view_dashboard"><FinancialDashboard /></RoleRoute>} />

                        {/* Fleet management */}
                        <Route path="vehicles/registry" element={<RoleRoute permission="view_vehicles"><VehicleRegistry /></RoleRoute>} />
                        <Route path="drivers/profiles" element={<RoleRoute permission="view_drivers"><DriverProfiles /></RoleRoute>} />

                        {/* Operations */}
                        <Route path="trips/dispatcher" element={<RoleRoute permission="view_trips"><TripDispatcher /></RoleRoute>} />
                        <Route path="maintenance/logs" element={<RoleRoute permission="view_maintenance"><MaintenanceLogs /></RoleRoute>} />
                        <Route path="expenses/fuel-logs" element={<RoleRoute permission="view_expenses"><ExpenseFuelLogs /></RoleRoute>} />

                        {/* Data & Insights */}
                        <Route path="analytics/reports" element={<RoleRoute permission="view_analytics"><Analytics /></RoleRoute>} />
                    </Route>

                    {/* 404 Fallback */}
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

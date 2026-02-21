import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RoleLayout from '../components/layout/RoleLayout';

// Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Dashboards
import ManagerDashboard from '../pages/dashboard/ManagerDashboard';
import DispatcherDashboard from '../pages/dashboard/DispatcherDashboard';
import SafetyDashboard from '../pages/dashboard/SafetyDashboard';
import FinancialDashboard from '../pages/dashboard/FinancialDashboard';

// Core Modules
import VehicleRegistry from '../pages/vehicles/VehicleRegistry';
import DriverProfiles from '../pages/drivers/DriverProfiles';
import TripDispatcher from '../pages/trips/TripDispatcher';

// Maintenance & Expenses
import MaintenanceLogs from '../pages/maintenance/MaintenanceLogs';
import ExpenseFuelLogs from '../pages/expenses/ExpenseFuelLogs';

// Analytics
import Analytics from '../pages/analytics/Analytics';

// Helper for protected routes
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('fleet-auth-token');
    if (!token) return <Navigate to="/login" replace />;
    return <RoleLayout>{children}</RoleLayout>;
};

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Dashboard Switcher (Home) */}
                <Route path="/" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />

                {/* Sub-pages */}
                <Route path="/dashboards/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
                <Route path="/dashboards/dispatcher" element={<ProtectedRoute><DispatcherDashboard /></ProtectedRoute>} />
                <Route path="/dashboards/safety" element={<ProtectedRoute><SafetyDashboard /></ProtectedRoute>} />
                <Route path="/dashboards/financial" element={<ProtectedRoute><FinancialDashboard /></ProtectedRoute>} />

                {/* Fleet Management */}
                <Route path="/vehicles/registry" element={<ProtectedRoute><VehicleRegistry /></ProtectedRoute>} />
                <Route path="/drivers/profiles" element={<ProtectedRoute><DriverProfiles /></ProtectedRoute>} />

                {/* Operations */}
                <Route path="/trips/dispatcher" element={<ProtectedRoute><TripDispatcher /></ProtectedRoute>} />
                <Route path="/maintenance/logs" element={<ProtectedRoute><MaintenanceLogs /></ProtectedRoute>} />
                <Route path="/expenses/fuel-logs" element={<ProtectedRoute><ExpenseFuelLogs /></ProtectedRoute>} />

                {/* Data & Insights */}
                <Route path="/analytics/reports" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

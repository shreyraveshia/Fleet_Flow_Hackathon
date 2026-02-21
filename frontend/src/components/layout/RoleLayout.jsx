import * as React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUIStore } from '../../store/uiStore';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import AuditLogDrawer from '../common/AuditLogDrawer';

export default function RoleLayout() {
    const { sidebarOpen, setSidebarOpen, auditDrawerOpen, setAuditDrawerOpen } = useUIStore();
    const { isAuthenticated } = useAuthStore();

    // Initialize socket connection
    useSocket();

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Sidebar - Fixed */}
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main Content Area */}
            <div
                className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? 'pl-64' : 'pl-16'
                    }`}
            >
                <Topbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Global Audit Drawer for Managers */}
            <AuditLogDrawer
                isOpen={auditDrawerOpen}
                onClose={() => setAuditDrawerOpen(false)}
            />
        </div>
    );
}

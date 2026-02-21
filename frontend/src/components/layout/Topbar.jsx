import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
    Menu,
    Search,
    User,
    LogOut,
    Settings,
    Key,
    ShieldCheck,
    ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useRBAC } from '../../hooks/useRBAC';
import NotificationBell from './NotificationBell';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';

const PAGE_TITLES = {
    '/dashboard': 'Dashboard Overview',
    '/dashboard/vehicles/registry': 'Vehicle Management',
    '/dashboard/trips/dispatcher': 'Trip Dispatch & Tracking',
    '/dashboard/maintenance/logs': 'Maintenance Scheduling',
    '/dashboard/expenses/fuel-logs': 'Expense Tracking',
    '/dashboard/drivers/profiles': 'Driver Management',
    '/dashboard/analytics/reports': 'Fleet Analytics',
    '/dashboard/reports': 'System Reports',
    '/dashboard/notifications': 'All Notifications',
    '/dashboard/profile': 'My Profile',
    '/dashboard/settings': 'System Settings',
};

export default function Topbar({ onSidebarToggle }) {
    const { user, logout } = useAuthStore();
    const { role } = useRBAC();
    const { setAuditDrawerOpen } = useUIStore();
    const location = useLocation();

    const pageTitle = PAGE_TITLES[location.pathname] || 'FleetFlow';

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <header className="sticky top-0 z-20 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
            <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Left Side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onSidebarToggle}
                        className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none"
                        aria-label="Toggle Sidebar"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white hidden sm:block">
                        {pageTitle}
                    </h1>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search - Hidden on Small Screens */}
                    <div className="hidden md:flex relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search resource..."
                            className="pl-10 pr-4 py-1.5 w-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all"
                        />
                    </div>

                    <NotificationBell />

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                    {/* User Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors focus:outline-none outline-none group">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                                    {user?.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight capitalize">
                                    {role?.replace('_', ' ')}
                                </span>
                            </div>
                            <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all shadow-sm">
                                <AvatarFallback className="bg-blue-600 text-white text-xs">
                                    {getInitials(user?.name)}
                                </AvatarFallback>
                            </Avatar>
                            <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors mr-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-1">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-slate-500">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/dashboard/profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>My Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/dashboard/settings" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            {role === 'fleet_manager' && (
                                <DropdownMenuItem
                                    onClick={() => setAuditDrawerOpen(true)}
                                    className="cursor-pointer"
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    <span>Audit Logs</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={logout}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}

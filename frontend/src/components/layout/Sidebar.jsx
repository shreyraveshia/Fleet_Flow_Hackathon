import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Truck,
    LayoutDashboard,
    MapPin,
    Wrench,
    Receipt,
    Users,
    BarChart2,
    LogOut,
    ChevronLeft,
    ChevronRight,
    User,
    Moon,
    Sun
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useRBAC } from '../../hooks/useRBAC';
import { useUIStore } from '../../store/uiStore';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
    { label: 'Vehicles', path: '/vehicles', icon: Truck, permission: 'view_vehicles' },
    { label: 'Trip Dispatch', path: '/trips', icon: MapPin, permission: 'view_trips' },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench, permission: 'view_maintenance' },
    { label: 'Expenses', path: '/expenses', icon: Receipt, permission: 'view_expenses' },
    { label: 'Drivers', path: '/drivers', icon: Users, permission: 'view_drivers' },
    { label: 'Analytics', path: '/analytics', icon: BarChart2, permission: 'view_analytics' },
];

export default function Sidebar({ isOpen, onToggle }) {
    const { user, logout } = useAuthStore();
    const { can } = useRBAC();
    const { isDarkMode, toggleDarkMode } = useUIStore();

    const filteredNavItems = NAV_ITEMS.filter(item => can(item.permission));

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-full z-30 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out",
                isOpen ? "w-64" : "w-16"
            )}
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
                        <Truck className="h-6 w-6 text-white" />
                    </div>
                    {isOpen && (
                        <span className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
                            FleetFlow
                        </span>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 bg-blue-600 text-white rounded-full p-1 border-2 border-slate-900 hover:bg-blue-700 transition-colors z-40 hidden lg:block"
            >
                {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {/* Navigation Links */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {filteredNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                            isActive
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", !isOpen && "mx-auto")} />
                        {isOpen && <span className="font-medium">{item.label}</span>}
                        {!isOpen && (
                            <div className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800 shadow-xl">
                                {item.label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-800 space-y-4">
                {/* User Info */}
                <div className={cn("flex items-center gap-3", !isOpen && "justify-center")}>
                    <Avatar className="h-9 w-9 border border-slate-700">
                        <AvatarFallback className="bg-slate-800 text-blue-400">
                            {getInitials(user?.name)}
                        </AvatarFallback>
                    </Avatar>
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                            <Badge variant="outline" className="text-[10px] h-4 bg-slate-800 text-slate-400 border-slate-700 capitalize px-1 py-0">
                                {user?.role?.replace('_', ' ')}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className={cn("flex flex-col gap-1", !isOpen && "items-center")}>
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                        {isOpen && <span className="font-medium text-sm">Theme</span>}
                    </button>

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors group"
                        title="Logout"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        {isOpen && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}

import * as React from 'react';
import { Bell, BellOff, CheckCheck, Circle } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useSocket } from '../../hooks/useSocket';
import { useToast } from '../../hooks/useToast';
import { formatDistanceToNow as dfFormatDistanceToNow } from 'date-fns';
import { cn, formatDistanceToNow } from '../../lib/utils';
import { Badge } from '../ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const SEVERITY_COLORS = {
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    success: 'bg-green-500',
};

export default function NotificationBell() {
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllRead,
        addNotification
    } = useNotificationStore();

    const { on, off } = useSocket();
    const { info } = useToast();

    React.useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]);

    React.useEffect(() => {
        const handleNewNotification = (notification) => {
            addNotification(notification);
            info(notification.message, notification.title || 'New Notification');
        };

        on('new_notification', handleNewNotification);
        return () => off('new_notification', handleNewNotification);
    }, [on, off, addNotification, info]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all focus:outline-none outline-none group">
                <Bell className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    unreadCount > 0 && "text-slate-700 dark:text-slate-200"
                )} />

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-800 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none">
                                {unreadCount} New
                            </Badge>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                markAllRead();
                            }}
                            className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
                        >
                            <CheckCheck className="h-3 w-3" />
                            Mark all read
                        </button>
                    )}
                </div>

                <DropdownMenuSeparator className="m-0" />

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                <BellOff className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">All caught up!</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No new notifications to show.</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem
                                key={n._id}
                                onClick={() => !n.isRead && markAsRead(n._id)}
                                className={cn(
                                    "flex items-start gap-3 p-4 border-b last:border-0 border-slate-100 dark:border-slate-700 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-700/50 transition-colors",
                                    !n.isRead && "bg-blue-50/40 dark:bg-blue-900/10"
                                )}
                            >
                                <div className={cn(
                                    "mt-1.5 h-2 w-2 rounded-full shrink-0",
                                    SEVERITY_COLORS[n.severity] || SEVERITY_COLORS.info
                                )} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={cn(
                                            "text-sm leading-none truncate",
                                            !n.isRead ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"
                                        )}>
                                            {n.title}
                                        </p>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {formatDistanceToNow(n.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                                        {n.message}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                <DropdownMenuSeparator className="m-0" />

                <div className="p-2 bg-slate-50 dark:bg-slate-800/50">
                    <button className="w-full py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        View All Notifications
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

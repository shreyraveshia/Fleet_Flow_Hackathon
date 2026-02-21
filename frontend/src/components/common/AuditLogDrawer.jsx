import * as React from 'react';
import { X, History, User, Calendar, Activity, Database } from 'lucide-react';
import { auditAPI } from '../../api/audit.api';
import { useRBAC } from '../../hooks/useRBAC';
import { cn, formatDate, formatDistanceToNow } from '../../lib/utils';
import { formatDistanceToNow as dfFormatDistanceToNow, format as dfFormat } from 'date-fns';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

export default function AuditLogDrawer({ isOpen, onClose }) {
    const { isManager } = useRBAC();
    const [logs, setLogs] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (isOpen && isManager) {
            fetchLogs();
        }
    }, [isOpen, isManager]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await auditAPI.getAll({ limit: 20 });
            setLogs(response.data.logs);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isManager) return null;

    const getActionColor = (action) => {
        if (action.includes('CREATE')) return 'bg-emerald-500';
        if (action.includes('UPDATE')) return 'bg-blue-500';
        if (action.includes('DELETE') || action.includes('RETIRE')) return 'bg-red-500';
        if (action.includes('STATUS')) return 'bg-amber-500';
        return 'bg-slate-500';
    };

    const getActionType = (action) => {
        if (action.includes('CREATE')) return 'success';
        if (action.includes('UPDATE')) return 'default';
        if (action.includes('DELETE') || action.includes('RETIRE')) return 'destructive';
        if (action.includes('STATUS')) return 'warning';
        return 'secondary';
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <aside
                className={cn(
                    "fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Trail</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Track system changes and activity</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                    <div className="flex-1 space-y-2 mt-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Database className="h-12 w-12 text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">No audit logs found</p>
                        </div>
                    ) : (
                        <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                            {logs.map((log) => (
                                <div key={log._id} className="relative flex gap-6 group">
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                        "relative z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110",
                                        getActionColor(log.action)
                                    )}>
                                        <Activity className="h-4 w-4 text-white" />
                                    </div>

                                    {/* Log Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <Badge variant={getActionType(log.action)} className="text-[10px] uppercase font-bold py-0 h-4">
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {formatDistanceToNow(log.createdAt)}
                                            </span>
                                        </div>

                                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                            {log.entityName || `${log.entity} Record`}
                                        </p>

                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <User className="h-3 w-3" />
                                                <span>By: <span className="font-medium text-slate-700 dark:text-slate-300">{log.performedBy?.name || log.performedByName || 'System'}</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(log.createdAt, 'MMM dd, yyyy • hh:mm a')}</span>
                                            </div>
                                        </div>

                                        {/* Meta info if available */}
                                        {log.entityId && (
                                            <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                                                ID: {log.entityId}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button
                        disabled={isLoading}
                        onClick={fetchLogs}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
                    >
                        Refresh Logs
                    </button>
                </div>
            </aside>
        </>
    );
}

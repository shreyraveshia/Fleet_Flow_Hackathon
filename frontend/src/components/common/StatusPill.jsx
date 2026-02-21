import * as React from 'react';
import { cn } from '../../lib/utils';

const STATUS_MAP = {
    // Vehicle Statuses
    'Available': { color: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    'On Trip': { color: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    'In Shop': { color: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
    'Retired': { color: 'bg-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400' },

    // Driver Statuses
    'Suspended': { color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    'Off Duty': { color: 'bg-slate-500', bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400' },

    // Trip Statuses
    'Draft': { color: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
    'Dispatched': { color: 'bg-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
    'In Transit': { color: 'bg-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
    'Completed': { color: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
    'Cancelled': { color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },

    // Maintenance/Expense Statuses
    'In Progress': { color: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
    'Scheduled': { color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
};

export default function StatusPill({ status, size = 'sm' }) {
    const config = STATUS_MAP[status] || STATUS_MAP['Draft'];

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px]',
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
    };

    const dotSize = {
        xs: 'h-1 w-1',
        sm: 'h-1.5 w-1.5',
        md: 'h-2 w-2',
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full font-semibold border-transparent",
            config.bg,
            config.text,
            sizeClasses[size]
        )}>
            <span className={cn("rounded-full", config.color, dotSize[size])} />
            {status}
        </span>
    );
}

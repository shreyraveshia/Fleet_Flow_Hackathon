import * as React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export default function EmptyState({
    icon: Icon,
    title,
    message,
    action,
    className
}) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700",
            className
        )}>
            {Icon && (
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <Icon className="h-10 w-10 text-slate-400" />
                </div>
            )}
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                {message}
            </p>
            {action && (
                <Button
                    onClick={action.onClick}
                    variant="default"
                    className="mt-6"
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
}

import * as React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

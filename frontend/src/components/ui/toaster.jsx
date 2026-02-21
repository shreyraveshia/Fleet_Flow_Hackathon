import * as React from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useToast } from './use-toast';
import { cn } from '../../lib/utils';

const variantStyles = {
    default: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const variantIcons = {
    default: null,
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
};

function Toaster() {
    const { toasts, dismiss } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none" aria-live="polite">
            {toasts
                .filter((t) => t.open)
                .map((t) => {
                    const variant = t.variant || 'default';
                    return (
                        <div
                            key={t.id}
                            className={cn(
                                'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-slide-in',
                                variantStyles[variant]
                            )}
                        >
                            {variantIcons[variant]}
                            <div className="flex-1 min-w-0">
                                {t.title && (
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
                                )}
                                {t.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
        </div>
    );
}

export { Toaster };

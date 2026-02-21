import * as React from 'react';
import { cn } from '../../lib/utils';

export default function LoadingSpinner({ size = 'md', color = 'blue' }) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4',
    };

    const colorClasses = {
        blue: 'border-blue-600 border-t-transparent',
        white: 'border-white border-t-transparent',
        slate: 'border-slate-400 border-t-transparent',
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={cn(
                    "animate-spin rounded-full",
                    sizeClasses[size],
                    colorClasses[color]
                )}
            />
        </div>
    );
}

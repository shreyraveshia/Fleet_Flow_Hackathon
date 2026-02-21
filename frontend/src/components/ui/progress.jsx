import * as React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div
            ref={ref}
            className={cn(
                'relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700',
                className
            )}
            {...props}
        >
            <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-in-out"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
});
Progress.displayName = 'Progress';

export { Progress };

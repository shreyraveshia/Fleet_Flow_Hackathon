import * as React from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function KPICard({
    title,
    value,
    icon: Icon,
    color = 'blue',
    trend,
    suffix = '',
    isLoading = false,
    onClick
}) {
    const colorVariants = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-8 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                "transition-all duration-200 group",
                onClick && "cursor-pointer hover:border-blue-500/50 hover:shadow-md hover:-translate-y-1"
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl", colorVariants[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {trend !== undefined && (
                        <div className={cn(
                            "flex items-center text-xs font-bold",
                            trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {trend >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {title}
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                        {value}<span className="text-lg font-semibold ml-0.5">{suffix}</span>
                    </h3>
                </div>
            </CardContent>
        </Card>
    );
}

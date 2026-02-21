import * as React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';

export default function SkeletonLoader({ type = 'card' }) {
    if (type === 'kpi') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <Skeleton className="h-8 w-1/2 mb-2" />
                            <Skeleton className="h-4 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (type === 'table') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-1/5" />
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
                        </div>
                    </div>
                    {[1, 2, 3, 4, 5].map(row => (
                        <div key={row} className="p-4 border-b last:border-0 border-slate-100 dark:border-slate-800">
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map(col => <Skeleton key={col} className="h-4 flex-1" />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'page') {
        return (
            <div className="space-y-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 col-span-1" />
                    <Skeleton className="h-32 col-span-1" />
                    <Skeleton className="h-32 col-span-1" />
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
    );
}

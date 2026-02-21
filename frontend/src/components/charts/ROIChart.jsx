import * as React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { cn } from '../../lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{label}</p>
                <p className="text-xs text-slate-500 mb-2 font-mono">ID: {data.vehicleId || 'N/A'}</p>
                <div className="space-y-1">
                    <p className="text-xs flex items-center justify-between gap-4">
                        <span className="text-slate-500">ROI:</span>
                        <span className={cn("font-bold", data.roi >= 0 ? "text-emerald-500" : "text-red-500")}>
                            {data.roi.toFixed(1)}%
                        </span>
                    </p>
                    <p className="text-xs flex items-center justify-between gap-4">
                        <span className="text-slate-500">Net Profit:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            ₹{data.netProfit.toLocaleString('en-IN')}
                        </span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function ROIChart({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        width={80}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', opacity: 0.1 }} />
                    <Bar
                        dataKey="roi"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                        label={{
                            position: 'right',
                            formatter: (val) => `${val.toFixed(1)}%`,
                            fontSize: 10,
                            fill: '#64748B',
                            fontWeight: 'bold'
                        }}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.roi >= 0 ? '#10B981' : '#EF4444'}
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

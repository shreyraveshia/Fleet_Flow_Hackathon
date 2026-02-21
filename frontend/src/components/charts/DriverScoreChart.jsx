import * as React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg text-xs">
                <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="flex justify-between gap-4">
                        <span className="text-slate-500">Safety Score:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{payload[0].value}%</span>
                    </p>
                    <p className="flex justify-between gap-4">
                        <span className="text-slate-500">Comp. Rate:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{payload[1].value}%</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function DriverScoreChart({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }} />
                    <Bar
                        name="Safety Score"
                        dataKey="safetyScore"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                    />
                    <Bar
                        name="Completion Rate"
                        dataKey="completionRate"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

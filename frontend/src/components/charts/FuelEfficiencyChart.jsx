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
            <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-xs flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-slate-500">Efficiency:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{payload[0].value.toFixed(1)} km/L</span>
                    </p>
                    <p className="text-xs flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-slate-500">Cost/km:</span>
                        <span className="font-bold text-slate-900 dark:text-white">₹{payload[1].value.toFixed(2)}</span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function FuelEfficiencyChart({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    barGap={8}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
                    />
                    <Bar
                        name="Efficiency (km/L)"
                        dataKey="fuelEfficiency"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                    />
                    <Bar
                        name="Cost per km (₹)"
                        dataKey="costPerKm"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                        barSize={32}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

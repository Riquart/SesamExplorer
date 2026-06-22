'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, ReferenceLine } from 'recharts';
import { isCGM } from '@/lib/colors';
import { PerformanceMetric } from '@/lib/data-utils';

interface PerformanceChartProps {
    data: PerformanceMetric[];
    metric: 'delta1M' | 'delta6M' | 'delta12M';
    title: string;
}

const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const val = payload.value;
    const bold = isCGM(val);
    const formattedVal = val.length > 22 ? val.substring(0, 19) + '...' : val;
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={3}
                textAnchor="end"
                fill={bold ? '#1e3a8a' : '#4B5563'}
                fontSize={11}
                fontWeight={bold ? 'bold' : 'normal'}
            >
                {formattedVal}
            </text>
        </g>
    );
};

export function PerformanceChart({ data, metric, title }: PerformanceChartProps) {
    // Sort by the chosen metric (absolute value descending) to show most significant movements?
    // Or just sort by the metric itself (Winners on top, Losers on bottom)?
    // Let's take Top 10 Gainers and Bottom 5 Losers if the list is huge?
    // For now, let's just take top 15 sorted by the metric descending.

    // Safety check
    if (!data || data.length === 0) return null;

    const sortedData = [...data]
        .sort((a, b) => b[metric] - a[metric])
        .slice(0, 20); // Top 20

    return (
        <Card className="h-[400px] flex flex-col p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            tick={<CustomYAxisTick />}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [
                                value > 0 ? `+${value}` : value,
                                'Variation'
                            ]}
                        />
                        <ReferenceLine x={0} stroke="#9CA3AF" />
                        <Bar dataKey={metric} barSize={12} radius={[0, 4, 4, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry[metric] >= 0 ? '#10B981' : '#EF4444'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

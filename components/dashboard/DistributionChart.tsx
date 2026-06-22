'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { getEntityColor, isCGM } from '@/lib/colors';

interface DistributionChartProps {
    data: { name: string; value: number }[];
    title?: string;
}

const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const val = payload.value;
    const bold = isCGM(val);
    const formattedVal = val.length > 15 ? val.substring(0, 13) + '...' : val;
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={3}
                textAnchor="end"
                fill={bold ? '#1e3a8a' : '#4B5563'}
                fontSize={10}
                fontWeight={bold ? 'bold' : 'medium'}
            >
                {formattedVal}
            </text>
        </g>
    );
};

export function DistributionChart({ data, title = "Répartition" }: DistributionChartProps) {
    // Take top 10 and group rest as "Autres"
    const topLimit = 10;
    const topData = data.slice(0, topLimit);
    const otherValue = data.slice(topLimit).reduce((acc, curr) => acc + curr.value, 0);

    const chartData = otherValue > 0
        ? [...topData, { name: 'Autres', value: otherValue }]
        : topData;

    return (
        <Card className="h-[380px] p-4 md:p-5 flex flex-col justify-between">
            <h3 className="text-base font-bold text-gray-800 mb-2">{title}</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            tick={<CustomYAxisTick />}
                            interval={0}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            formatter={(value: any) => [Number(value).toLocaleString('fr-FR'), 'Télétransmetteurs']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getEntityColor(entry.name)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

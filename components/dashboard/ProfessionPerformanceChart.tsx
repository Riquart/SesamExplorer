'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';

interface ProfessionPerformanceChartProps {
    data: { name: string; delta12M: number; percent12M: number; currentValue: number }[];
}

export function ProfessionPerformanceChart({ data }: ProfessionPerformanceChartProps) {
    if (!data || data.length === 0) return null;

    // Sort by Delta descending
    const sortedData = [...data].sort((a, b) => b.delta12M - a.delta12M);

    return (
        <Card className="h-[340px] p-4 md:p-5 flex flex-col justify-between">
            <h3 className="text-base font-bold text-gray-800 mb-2">Performance par Profession (1 An)</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={110}
                            tick={{ fontSize: 10, fill: '#4B5563' }}
                            interval={0}
                            tickFormatter={(val) => val.length > 15 ? val.substring(0, 13) + '...' : val}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [
                                value > 0 ? `+${value}` : value,
                                'Variation 12M'
                            ]}
                        />
                        <ReferenceLine x={0} stroke="#9CA3AF" />
                        <Bar dataKey="delta12M" barSize={12} radius={[0, 4, 4, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.delta12M >= 0 ? '#10B981' : '#EF4444'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

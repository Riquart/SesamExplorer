'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ProfessionDistributionChartProps {
    data: { name: string; value: number; percent: number }[];
}

const COLORS = [
    '#6366f1', // Indigo 500
    '#ec4899', // Pink 500
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#3b82f6', // Blue 500
    '#8b5cf6', // Violet 500
    '#ef4444', // Red 500
    '#14b8a6', // Teal 500
    '#f97316', // Orange 500
    '#64748b', // Slate 500
];

export function ProfessionDistributionChart({ data }: ProfessionDistributionChartProps) {
    if (!data || data.length === 0) return null;

    // Group small slices into "Autres" if too many?
    // Start simple.

    return (
        <Card className="h-[340px] p-4 md:p-5 flex flex-col justify-between">
            <h3 className="text-base font-bold text-gray-800 mb-2">Répartition par Profession</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={1} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any, name: any, props: any) => [
                                `${Number(value).toLocaleString('fr-FR')} (${props.payload.percent.toFixed(1)}%)`,
                                name
                            ]}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            formatter={(value, entry: any) => <span className="text-xs text-gray-600">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

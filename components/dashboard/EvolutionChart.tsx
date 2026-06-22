'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Maximize2, X } from 'lucide-react';
import clsx from 'clsx';

interface EvolutionChartProps {
    data: any[];
    keys?: string[];
    title?: string;
    highlightKey?: string;
}

import { getEntityColor, isCGM } from '@/lib/colors';

export function EvolutionChart({ data, keys = ['total'], title = "Évolution", highlightKey }: EvolutionChartProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const ChartContent = () => (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="dateLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    minTickGap={30}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600, fontSize: '12px' }}
                    itemSorter={(item) => (item.value as number) * -1}
                />
                <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                    formatter={(value: string) => {
                        const bold = isCGM(value);
                        return (
                            <span className={bold ? "font-bold text-gray-900 animate-pulse-subtle" : "text-gray-600"}>
                                {value}
                            </span>
                        );
                    }}
                />
                {keys.map((key) => {
                    const isCgmEntity = isCGM(key);
                    const isHighlighted = isCgmEntity || (highlightKey && key.toLowerCase().includes(highlightKey.toLowerCase()));
                    const color = getEntityColor(key);

                    return (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={color}
                            strokeWidth={isHighlighted ? 3.5 : 1.5}
                            fillOpacity={isHighlighted ? 0.08 : 0.02}
                            fill={color}
                            animationDuration={1500}
                        />
                    );
                })}
            </AreaChart>
        </ResponsiveContainer>
    );

    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-white p-6 flex flex-col animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <ChartContent />
                </div>
            </div>
        );
    }

    return (
        <Card className="h-[380px] p-4 md:p-5 relative group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-gray-800">{title}</h3>
                <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-1 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Agrandir"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 min-h-0">
                <ChartContent />
            </div>
        </Card>
    );
}

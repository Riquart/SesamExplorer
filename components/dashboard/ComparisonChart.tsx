'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';
import { getEntityColor, isCGM } from '@/lib/colors';

interface ComparisonChartProps {
    data: any[];
    keys: string[];
    title?: string;
    subtitle?: string;
}

export function ComparisonChart({ data, keys, title = "Comparaison & Projection", subtitle }: ComparisonChartProps) {
    // Separate historical and projection data for visual separation if needed
    // But Recharts handles this well if we use the same key. The "isProjection" property allows customizing dot/stroke.
    // Actually, to have dashes for projection, we might need two series per key OR use a custom shape.
    // Simpler approach: split data into two segments per key: "History" and "Projection" keys?
    // No, cleaner approach: Use strokeDasharray based on payload? Not trivial in single Line.
    // Standard approach: Split into two lines per entity: `Entity` and `Entity_Proj`.
    // Let's refine `aggregateForComparison` output or handle it here?
    // Let's rely on `data` having `isProjection`.
    // For now, simpler: Just show solid lines. We can improve to dashed later if needed or try a trick.
    // Trick: Recharts doesn't change stroke style mid-line easily without splitting data.
    // So let's split keys into `${key}` (history) and `${key}_proj` (projection)? 
    // Wait, the data structure returned by `aggregateForComparison` is a single array of points.
    // Strategy: We will render solid lines. The projection part will just be a continuation.
    // To distinguish, we can add a ReferenceArea for the projection period.

    const projectionStartIndex = data.findIndex(d => d.isProjection);
    const projectionStartDate = projectionStartIndex > -1 ? data[projectionStartIndex].dateLabel : null;

    return (
        <Card className="h-[450px] relative p-4 md:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 mb-3">
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                {subtitle && <p className="text-xs font-medium text-gray-400 italic sm:text-right">{subtitle}</p>}
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                            labelStyle={{ color: '#6B7280', marginBottom: '0.5rem' }}
                            itemSorter={(item) => (item.value as number) * -1}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                            formatter={(value: string) => {
                                const bold = isCGM(value);
                                return (
                                    <span className={bold ? "font-bold text-gray-900" : "text-gray-600"}>
                                        {value}
                                    </span>
                                );
                            }}
                        />

                        {/* Highlight Projection Area */}
                        {projectionStartDate && (
                            <ReferenceArea
                                x1={projectionStartDate}
                                strokeOpacity={0}
                                fill="#F3F4F6"
                                fillOpacity={0.5}
                                label={{ value: "Projection", position: 'insideTopRight', fill: '#9CA3AF', fontSize: 11 }}
                            />
                        )}

                        {keys.map(key => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={getEntityColor(key)}
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6 }}
                                animationDuration={1500}
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import { getEntityAnalysis, aggregateByKey } from '@/lib/data-utils';
import { getEntityColor } from '@/lib/colors';
import { ArrowLeft, Target, Search, Building2, Layers, Cpu } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProfessionDistributionChart } from '@/components/dashboard/ProfessionDistributionChart';
import { ProfessionPerformanceChart } from '@/components/dashboard/ProfessionPerformanceChart';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function FocusPage() {
    const [rawData, setRawData] = useState<SesamDataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<'editeur' | 'groupe' | 'progiciel'>('editeur');
    const [selectedEntity, setSelectedEntity] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchSesamData();
            setRawData(data);
            setLoading(false);
        };
        loadData();
    }, []);

    // Get list of entities for the selector
    const entities = useMemo(() => {
        if (rawData.length === 0) return [];
        return aggregateByKey(rawData, viewType).map(e => e.name);
    }, [rawData, viewType]);

    // Select first entity by default if none selected
    useEffect(() => {
        if (entities.length > 0 && !selectedEntity) {
            setSelectedEntity(entities[0]);
        }
        // If type changes, reset selection to first of new type
        if (entities.length > 0 && !entities.includes(selectedEntity)) {
            setSelectedEntity(entities[0]);
        }
    }, [entities, selectedEntity, viewType]);

    const analysis = useMemo(() => {
        if (!selectedEntity || rawData.length === 0) return null;
        return getEntityAnalysis(rawData, viewType, selectedEntity);
    }, [rawData, viewType, selectedEntity]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const viewOptions = [
        { value: 'editeur', label: 'Éditeur' },
        { value: 'groupe', label: 'Groupe' },
        { value: 'progiciel', label: 'Logiciel' },
    ];

    const entityOptions = entities.map(e => ({ value: e, label: e }));

    return (
        <main className="min-h-screen bg-gray-50/50 p-3 md:p-5 font-sans selection:bg-indigo-100">
            {/* Header Compact */}
            <header className="max-w-7xl mx-auto mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 md:px-4 rounded-xl border border-gray-100 shadow-sm">
                <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                    <img src="/logo.png" alt="SESAM Explorer" className="w-9 h-9 object-contain" />
                    <div>
                        <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">
                            Focus <span className="text-indigo-600">Metric</span>
                        </h1>
                        <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 font-medium">
                            Analyse détaillée par entité.
                        </p>
                    </div>
                </Link>

                <div className="flex flex-wrap items-end gap-2 w-full md:w-auto">
                    <div className="w-full sm:w-32">
                        <Select
                            label="Type"
                            options={viewOptions}
                            value={viewType}
                            onChange={(e) => setViewType(e.target.value as any)}
                            uiSize="sm"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            label="Entité"
                            options={entityOptions}
                            value={selectedEntity}
                            onChange={(e) => setSelectedEntity(e.target.value)}
                            uiSize="sm"
                        />
                    </div>
                    <Link href="/" className="inline-flex items-center px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors h-[28px] mt-auto">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Retour
                    </Link>
                </div>
            </header>

            {analysis && (
                <div className="max-w-7xl mx-auto space-y-4">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Télétransmetteurs"
                            entityName={analysis.name}
                            value={analysis.totalUsers}
                            percent={analysis.percent1Y}
                            type={analysis.percent1Y >= 0 ? 'positive' : 'negative'}
                            subtext={`Rang #${analysis.marketRank} (Volume)`}
                        />
                        <StatCard
                            title="Croissance (1 An)"
                            entityName="Volume Absolu"
                            value={analysis.delta1Y}
                            percent={analysis.percent1Y}
                            type={analysis.delta1Y >= 0 ? 'positive' : 'negative'}
                            subtext="Variation sur 12 mois"
                        />
                        <StatCard
                            title="Top Profession"
                            entityName={analysis.bestProfession.name}
                            value={analysis.bestProfession.value}
                            percent={analysis.bestProfession.percent}
                            type="positive"
                            subtext="Plus forte croissance (12M)"
                        />
                        <StatCard
                            title="Point d'Attention"
                            entityName={analysis.worstProfession.name}
                            value={analysis.worstProfession.value}
                            percent={analysis.worstProfession.percent}
                            type="negative"
                            subtext="Plus forte baisse (12M)"
                        />
                    </div>

                    {/* Main Analysis Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Global Evolution Line Chart */}
                        <Card className="col-span-1 lg:col-span-2 p-4 md:p-5 h-[340px] flex flex-col justify-between">
                            <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                Évolution du Parc (Historique)
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analysis.globalEvolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="dateLabel"
                                            tick={{ fontSize: 11, fill: '#6B7280' }}
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            hide={false}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#6B7280' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            }}
                                            formatter={(value: any) => [Number(value).toLocaleString('fr-FR'), 'Télétransmetteurs']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={getEntityColor(selectedEntity)}
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Distribution Pie */}
                        <ProfessionDistributionChart data={analysis.professionDistribution} />

                        {/* Performance Histogram */}
                        <ProfessionPerformanceChart data={analysis.professionPerformance} />

                    </div>
                </div>
            )}
        </main>
    );
}

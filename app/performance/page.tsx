'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import { calculatePerformance, PerformanceMetric, getUniqueProfessions, filterData } from '@/lib/data-utils';
import { ArrowLeft, BarChart3, TrendingUp, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/dashboard/StatCard';
import { PerformanceTable } from '@/components/dashboard/PerformanceTable';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';

export default function PerformancePage() {
    const [rawData, setRawData] = useState<SesamDataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState<'editeur' | 'groupe' | 'progiciel'>('editeur');
    const [profession, setProfession] = useState('all');
    const [chartPeriod, setChartPeriod] = useState<'1M' | '6M' | '12M'>('12M');
    const [focusLimit, setFocusLimit] = useState<string>('10'); // '5', '10', 'all'

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchSesamData();
            setRawData(data);
            setLoading(false);
        };
        loadData();
    }, []);

    // Derived Data
    const professions = useMemo(() => getUniqueProfessions(rawData), [rawData]);

    const filteredData = useMemo(() => {
        // We reuse the generic filterData but we need to construct the filter object
        // Or simpler: just manual filter as we only have one filter here for now
        if (profession === 'all') return rawData;
        return rawData.filter(d => d.catPro === profession);
    }, [rawData, profession]);

    const fullPerformanceData = useMemo(() => {
        if (filteredData.length === 0) return [];
        return calculatePerformance(filteredData, viewType);
    }, [filteredData, viewType]);

    // Apply Focus Filter (Top N by Market Share)
    const focusedData = useMemo(() => {
        if (focusLimit === 'all' || !focusLimit) return fullPerformanceData;
        const limit = parseInt(focusLimit, 10);
        return fullPerformanceData.slice(0, limit);
    }, [fullPerformanceData, focusLimit]);

    // Top Movers Logic (based on Focused Data)
    const topGainers = useMemo(() => {
        // Sort by ABSOLUTE growth over 1 Year to match "Market Impact"
        // Or should it be % ? Usually ABS is better for large players.
        // Let's provide largest Gainer (Abs) and largest Gainer (%) ?
        // User asked "Trends". 
        // Let's stick to 12M Delta for now as "Top Performer"
        return [...focusedData].sort((a, b) => b.delta12M - a.delta12M);
    }, [focusedData]);

    const topGainer = topGainers[0];
    const topLoser = topGainers[topGainers.length - 1]; // Biggest negative delta

    // Most consistent? Or best 1M?
    const topGainer1M = [...focusedData].sort((a, b) => b.delta1M - a.delta1M)[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const viewOptions = [
        { value: 'editeur', label: 'Par Éditeur' },
        { value: 'groupe', label: 'Par Groupe' },
        { value: 'progiciel', label: 'Par Logiciel' },
    ];

    const professionOptions = [
        { value: 'all', label: 'Toutes les professions' },
        ...professions.map(p => ({ value: p, label: p }))
    ];

    const focusOptions = [
        { value: '5', label: 'Top 5 (Volume)' },
        { value: '10', label: 'Top 10 (Volume)' },
        { value: 'all', label: 'Tous les acteurs' },
    ];

    const chartMetricMap = {
        '1M': 'delta1M',
        '6M': 'delta6M',
        '12M': 'delta12M'
    } as const;

    return (
        <main className="min-h-screen bg-gray-50/50 p-3 md:p-5 font-sans selection:bg-indigo-100">
            {/* Header Compact */}
            <header className="max-w-7xl mx-auto mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 md:px-4 rounded-xl border border-gray-100 shadow-sm">
                <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                    <img src="/logo.png" alt="SESAM Explorer" className="w-9 h-9 object-contain" />
                    <div>
                        <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">
                            Analyse de <span className="text-indigo-600">Performance</span>
                        </h1>
                        <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 font-medium">
                            Classements et tendances sur 12M, 6M et 1M.
                        </p>
                    </div>
                </Link>

                <div className="flex flex-wrap items-end gap-2 w-full md:w-auto">
                    <div className="w-full sm:w-32">
                        <Select
                            label="Vue"
                            options={viewOptions}
                            value={viewType}
                            onChange={(e) => setViewType(e.target.value as any)}
                            uiSize="sm"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select
                            label="Profession"
                            options={professionOptions}
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                            uiSize="sm"
                        />
                    </div>
                    <div className="w-full sm:w-40">
                        <Select
                            label="Périmètre"
                            options={focusOptions}
                            value={focusLimit}
                            onChange={(e) => setFocusLimit(e.target.value)}
                            uiSize="sm"
                        />
                    </div>
                    <Link href="/" className="inline-flex items-center px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors h-[28px] mt-auto">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Retour
                    </Link>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-4">

                {/* Highlights */}
                {topGainer && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Top Croissance (1 An)"
                            entityName={topGainer.name}
                            value={topGainer.delta12M}
                            percent={topGainer.percent12M}
                            type="positive"
                            subtext="Meilleure progression absolue"
                        />
                        <StatCard
                            title="Tendance Courte (1 Mois)"
                            entityName={topGainer1M.name}
                            value={topGainer1M.delta1M}
                            percent={topGainer1M.percent1M}
                            type="positive"
                            subtext="Meilleure dynamique récente"
                        />
                        <StatCard
                            title="Plus forte baisse (1 An)"
                            entityName={topLoser.name}
                            value={topLoser.delta12M}
                            percent={topLoser.percent12M}
                            type="negative"
                            subtext="Perte de volume la plus importante"
                        />
                    </div>
                )}

                {/* Chart Section */}
                {focusedData.length > 0 && (
                    <div className="space-y-3 bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                Variations ({focusLimit === 'all' ? 'Top 20' : `Top ${focusLimit}`})
                            </h2>
                            <div className="flex bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                                {(['1M', '6M', '12M'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setChartPeriod(p)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${chartPeriod === p
                                                ? 'bg-white text-indigo-700 shadow-sm border border-gray-200/50'
                                                : 'text-gray-500 hover:bg-gray-100/50'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <PerformanceChart
                            data={focusedData}
                            metric={chartMetricMap[chartPeriod]}
                            title={`Variations sur ${chartPeriod}`}
                        />
                    </div>
                )}

                {/* Detailed Table */}
                <div className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
                            <Trophy className="w-4 h-4 text-indigo-500" />
                            Classement Détaillé
                        </h2>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {focusedData.length} résultats
                        </span>
                    </div>
                    <PerformanceTable data={focusedData} />
                </div>

            </div>
        </main>
    );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import { aggregateForComparison, getUniqueProfessions } from '@/lib/data-utils';
import { ComparisonChart } from '@/components/dashboard/ComparisonChart';
import { Activity, ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/select';

export default function ComparePage() {
    const [rawData, setRawData] = useState<SesamDataItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection state
    const [entityType, setEntityType] = useState<'editeur' | 'groupe' | 'progiciel'>('editeur');
    const [entityA, setEntityA] = useState('EPSILOG');
    const [entityB, setEntityB] = useState('DOCTOLIB');
    const [profession, setProfession] = useState('all');
    
    // Projection settings
    const [lookback, setLookback] = useState<number>(12);
    const [method, setMethod] = useState<'linear' | 'percentage'>('linear');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchSesamData();
            setRawData(data);
            setLoading(false);
        };
        loadData();
    }, []);

    // Get unique professions
    const professions = useMemo(() => {
        return getUniqueProfessions(rawData);
    }, [rawData]);

    // Filter data based on profession
    const filteredData = useMemo(() => {
        if (profession === 'all') return rawData;
        return rawData.filter(item => item.catPro === profession);
    }, [rawData, profession]);

    // Get unique entities for selection based on filtered data and type
    const entities = useMemo(() => {
        if (filteredData.length === 0) return [];
        
        const mapped = filteredData.map(d => {
            const val = (entityType === 'groupe' && (!d[entityType] || d[entityType] === '__NO_GROUP__')) 
                ? d.editeur 
                : d[entityType];
            return val;
        });

        const s = new Set(mapped);
        return Array.from(s)
            .filter(Boolean)
            .sort()
            .filter(e => e.toLowerCase() !== 'total');
    }, [filteredData, entityType]);

    // Sync selections when entities list changes
    useEffect(() => {
        if (entities.length > 0) {
            const hasA = entities.includes(entityA);
            const hasB = entities.includes(entityB);

            if (!hasA) {
                const defaultA = entities.includes('EPSILOG') 
                    ? 'EPSILOG' 
                    : (entities.includes('VEGA') ? 'VEGA' : entities[0]);
                setEntityA(defaultA);
            }
            if (!hasB) {
                const defaultB = entities.includes('DOCTOLIB') 
                    ? 'DOCTOLIB' 
                    : (entities.includes('Maiia') ? 'Maiia' : (entities[1] || entities[0]));
                setEntityB(defaultB);
            }
        }
    }, [entities]);

    // Aggregate data for the two selected entities
    const { data: chartData, keys } = useMemo(() => {
        if (filteredData.length === 0 || !entityA || !entityB) return { data: [], keys: [] };
        // Projection extended to 36 months (3 years) with all parameters
        return aggregateForComparison(filteredData, [entityA, entityB], entityType, 36, lookback, method);
    }, [filteredData, entityA, entityB, entityType, lookback, method]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const entityOptions = entities.map(e => ({ value: e, label: e }));
    const professionOptions = [
        { value: 'all', label: 'Toutes les professions' },
        ...professions.map(p => ({ value: p, label: p }))
    ];

    const entityTypeOptions = [
        { value: 'editeur', label: 'Éditeurs' },
        { value: 'groupe', label: 'Groupes' },
        { value: 'progiciel', label: 'Logiciels' }
    ];

    const lookbackOptions = [
        { value: '3', label: '3 mois (Très court terme)' },
        { value: '6', label: '6 mois (Court terme)' },
        { value: '9', label: '9 mois (Moyen terme)' },
        { value: '12', label: '12 mois (Tendance annuelle)' }
    ];

    const methodOptions = [
        { value: 'linear', label: 'Régression linéaire (Stable)' },
        { value: 'percentage', label: 'Taux de croissance % (Dynamique)' }
    ];

    return (
        <main className="min-h-screen bg-gray-50/50 p-3 md:p-5 font-sans selection:bg-indigo-100">
            {/* Header Compact */}
            <header className="max-w-7xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 md:px-4 rounded-xl border border-gray-100 shadow-sm">
                <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                    <img src="/logo.png" alt="SESAM Explorer" className="w-9 h-9 object-contain" />
                    <div>
                        <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">
                            Comparateur & <span className="text-indigo-600">Projections</span>
                        </h1>
                        <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 font-medium">
                            Outils prévisionnels et de comparaison.
                        </p>
                    </div>
                </Link>
                <Link href="/" className="inline-flex items-center px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors h-[28px] sm:mt-auto">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Retour
                </Link>
            </header>

            <div className="max-w-7xl mx-auto space-y-3">
                {/* Selectors Panel Compact (1 single line grid) */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <Select
                            label="Type d'analyse"
                            options={entityTypeOptions}
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value as any)}
                            uiSize="sm"
                        />
                        <Select
                            label="Profession"
                            options={professionOptions}
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                            uiSize="sm"
                        />
                        <Select
                            label="Entité A"
                            options={entityOptions}
                            value={entityA}
                            onChange={(e) => setEntityA(e.target.value)}
                            uiSize="sm"
                        />
                        <Select
                            label="Entité B"
                            options={entityOptions}
                            value={entityB}
                            onChange={(e) => setEntityB(e.target.value)}
                            uiSize="sm"
                        />
                        <Select
                            label="Historique (Régression)"
                            options={lookbackOptions}
                            value={String(lookback)}
                            onChange={(e) => setLookback(Number(e.target.value))}
                            uiSize="sm"
                        />
                        <Select
                            label="Modèle de projection"
                            options={methodOptions}
                            value={method}
                            onChange={(e) => setMethod(e.target.value as any)}
                            uiSize="sm"
                        />
                    </div>
                </div>

                {/* Chart */}
                <ComparisonChart
                    data={chartData}
                    keys={keys}
                    title={`Projection : ${entityA} vs ${entityB}`}
                    subtitle={`Projection sur 3 ans via ${method === 'linear' ? 'régression linéaire' : 'croissance exponentielle'} sur les ${lookback} derniers mois.`}
                />
            </div>
        </main>
    );
}

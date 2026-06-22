'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import {
  DataFilters,
  filterData,
  aggregateByDate,
  aggregateByKey,
  aggregateEvolutionByKey,
  getUniqueProfessions
} from '@/lib/data-utils';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Users, Activity, Layers, Server, TrendingUp, BarChart3, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const [rawData, setRawData] = useState<SesamDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DataFilters>({});

  // View state for distribution chart
  const [distView, setDistView] = useState<'groupe' | 'editeur' | 'progiciel'>('editeur');
  // View state for top limit
  const [topLimit, setTopLimit] = useState<5 | 10>(5);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchSesamData();
        setRawData(data);
      } catch (err) {
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // -- Derived State --
  const filteredData = useMemo(() => filterData(rawData, filters), [rawData, filters]);
  const professions = useMemo(() => getUniqueProfessions(rawData), [rawData]);

  // Dynamic aggregation for evolution based on selected view
  const { data: evolutionData, keys: evolutionKeys } = useMemo(() => aggregateEvolutionByKey(filteredData, distView, topLimit), [filteredData, distView, topLimit]);

  // Dynamic aggregation based on selected view
  const distributionData = useMemo(() => aggregateByKey(filteredData, distView), [filteredData, distView]);

  // -- Stats --
  const totalUsers = useMemo(() => {
    if (filteredData.length === 0) return 0;
    // Find latest date in the filtered dataset
    const latestDate = filteredData.reduce((max, curr) => (curr.dateData > max ? curr.dateData : max), filteredData[0].dateData);
    // Sum only for that date
    return filteredData
      .filter(d => d.dateData === latestDate)
      .reduce((acc, curr) => acc + curr.nbPsFacturation, 0);
  }, [filteredData]);

  const totalEditors = useMemo(() => new Set(filteredData.map(d => d.editeur)).size, [filteredData]);
  const totalSolutions = useMemo(() => new Set(filteredData.map(d => d.progiciel)).size, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">
        {error}
      </div>
    );
  }

  const HIGHLIGHTS: Record<'groupe' | 'editeur' | 'progiciel', string> = {
    progiciel: 'VEGA',
    editeur: 'EPSILOG',
    groupe: 'CompuGroup Medical France'
  };

  return (
    <main className="min-h-screen bg-gray-50/50 p-3 md:p-5 font-sans selection:bg-indigo-100">
      {/* Header Compact */}
      <header className="max-w-7xl mx-auto mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 md:px-4 rounded-xl border border-gray-100 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="SESAM Explorer" className="w-9 h-9 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">
              SESAM <span className="text-indigo-600">Explorer</span>
            </h1>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5 font-medium">
              Parc de télétransmission SESAM-Vitale en temps réel.
            </p>
          </div>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href="/performance" className="inline-flex items-center px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Performances
          </Link>
          <Link href="/focus" className="inline-flex items-center px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
            <Target className="w-3.5 h-3.5 mr-1" />
            Focus Entité
          </Link>
          <Link href="/compare" className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-700 transition-colors shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Comparateur & Projections
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          professions={professions}
        />

        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Télétransmetteurs (Dernier mois)"
              value={totalUsers.toLocaleString('fr-FR')}
              icon={Users}
              trend=""
            />
            <StatsCard
              title="Éditeurs"
              value={totalEditors.toString()}
              icon={Layers}
              trend=""
            />
            <StatsCard
              title="Solutions"
              value={totalSolutions.toString()}
              icon={Server}
              trend=""
            />
          </div>

          {/* Charts Row Only if data exists */}
          {filteredData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 relative">
                <div className="absolute top-4 right-12 z-10 flex bg-white/50 backdrop-blur rounded-lg border border-gray-200 p-0.5 mr-2">
                  <button
                    onClick={() => setTopLimit(5)}
                    className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${topLimit === 5 ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Top 5
                  </button>
                  <button
                    onClick={() => setTopLimit(10)}
                    className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${topLimit === 10 ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Top 10
                  </button>
                </div>
                <EvolutionChart
                  data={evolutionData}
                  keys={evolutionKeys}
                  title={`Évolution par ${distView === 'groupe' ? 'Groupe' : distView === 'editeur' ? 'Éditeur' : 'Logiciel'}`}
                  highlightKey={HIGHLIGHTS[distView]}
                />
              </div>
              <div>
                <div className="flex items-center justify-end gap-2 mb-2">
                  <button
                    onClick={() => setDistView('groupe')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${distView === 'groupe' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Groupe
                  </button>
                  <button
                    onClick={() => setDistView('editeur')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${distView === 'editeur' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Éditeur
                  </button>
                  <button
                    onClick={() => setDistView('progiciel')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border ${distView === 'progiciel' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    Logiciel
                  </button>
                </div>
                <DistributionChart
                  data={distributionData}
                  title={`Répartition par ${distView === 'groupe' ? 'Groupe' : distView === 'editeur' ? 'Éditeur' : 'Logiciel'}`}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              Aucune donnée ne correspond à vos filtres.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

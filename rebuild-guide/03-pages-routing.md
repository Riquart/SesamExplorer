# Étape 3 : Implémentation des Pages, Layouts et API Route Proxy

Cette dernière partie détaille la configuration globale de Next.js, les fichiers CSS de Tailwind, la route proxy pour court-circuiter les CORS, et les contrôleurs de vue (Pages) de l'application.

---

## 💅 1. Fichiers Systèmes & Globaux

### Styles Globaux : `app/globals.css`
Voici l'initialisation moderne de Tailwind CSS v4 :
```css
@import "tailwindcss";

@layer base {
  body {
    background-color: rgb(249, 250, 251);
    color: rgb(17, 24, 39);
  }
}
```

### Layout Principal : `app/layout.tsx`
```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SESAM Explorer - Analyse de Télétransmission",
  description: "Visualisez en temps réel l'évolution et les performances du parc de télétransmission SESAM-Vitale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
```

### Manifest de l'application : `app/manifest.ts`
```typescript
import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SESAM Explorer',
    short_name: 'SESAM Explorer',
    description: 'Analyse du parc de télétransmission SESAM-Vitale.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
```

---

## 🌐 2. Route API Proxy : `app/api/proxy/route.ts`

Cette route permet à Next.js de servir de serveur intermédiaire (proxy) pour interroger le portail officiel de SESAM-Vitale sans être bloqué par les restrictions de sécurité CORS du navigateur.

```typescript
import { NextResponse } from 'next/server';

const SESAM_API_URL = 'https://www.sesam-vitale.fr/en/web/sesam-vitale/parts-de-teletransmission?p_p_id=fr_sesamvitale_portail_chiffrespdm_web_portlet_chiffresPDMPortlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=%2Fchiffrespdm%2FgetJsonResponse&p_p_cacheability=cacheLevelPage';

export async function POST() {
    try {
        const response = await fetch(SESAM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream error: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
```

---

## 🏠 3. Tableau de Bord Principal (Dashboard) : `app/page.tsx`

La page d'accueil de l'application. Elle gère la récupération initiale des données, les filtres globaux (profession de santé, date, nom d'éditeur) et affiche des métriques clés ainsi que l'évolution chronologique et la répartition (parts de marché).

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import {
  DataFilters,
  filterData,
  aggregateByKey,
  aggregateEvolutionByKey,
  getUniqueProfessions
} from '@/lib/data-utils';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Users, Activity, Layers, Server, TrendingUp, BarChart3, Target } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [rawData, setRawData] = useState<SesamDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DataFilters>({ profession: 'Masseurs kinésithérapeutes' });
  const [distView, setDistView] = useState<'groupe' | 'editeur' | 'progiciel'>('editeur');
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

  const filteredData = useMemo(() => filterData(rawData, filters), [rawData, filters]);
  const professions = useMemo(() => getUniqueProfessions(rawData), [rawData]);

  const { data: evolutionData, keys: evolutionKeys } = useMemo(() => 
    aggregateEvolutionByKey(filteredData, distView, topLimit), [filteredData, distView, topLimit]
  );

  const distributionData = useMemo(() => aggregateByKey(filteredData, distView), [filteredData, distView]);

  const totalUsers = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const latestDate = filteredData.reduce((max, curr) => (curr.dateData > max ? curr.dateData : max), filteredData[0].dateData);
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
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans selection:bg-indigo-100">
      <header className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
            <Activity className="text-white w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            SESAM <span className="text-indigo-600">Explorer</span>
          </h1>
        </div>
        <p className="text-gray-500 text-lg ml-14">
          Analysez le parc de télétransmission SESAM-Vitale en temps réel.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/performance" className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
            <BarChart3 className="w-4 h-4 mr-2" />
            Voir les Performances
          </Link>
          <Link href="/focus" className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
            <Target className="w-4 h-4 mr-2" />
            Focus Entité
          </Link>
          <Link href="/compare" className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
            <TrendingUp className="w-4 h-4 mr-2" />
            Accéder au Comparateur & Projections
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          professions={professions}
        />

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Utilisateurs (Dernier mois)"
              value={totalUsers.toLocaleString('fr-FR')}
              icon={Users}
            />
            <StatsCard
              title="Éditeurs"
              value={totalEditors.toString()}
              icon={Layers}
            />
            <StatsCard
              title="Solutions"
              value={totalSolutions.toString()}
              icon={Server}
            />
          </div>

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
```

---

## 🎯 4. Focus Entité : `app/focus/page.tsx`

Cette page se concentre sur l'analyse détaillée d'un acteur spécifique (éditeur, logiciel, groupe) en affichant l'historique complet de son évolution, sa ventilation par profession sous forme de secteur (camembert) et ses variations sur 12 mois dans chaque catégorie professionnelle.

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import { getEntityAnalysis, aggregateByKey } from '@/lib/data-utils';
import { ArrowLeft, Target, Building2 } from 'lucide-react';
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

    const entities = useMemo(() => {
        if (rawData.length === 0) return [];
        return aggregateByKey(rawData, viewType).map(e => e.name);
    }, [rawData, viewType]);

    useEffect(() => {
        if (entities.length > 0 && !selectedEntity) {
            setSelectedEntity(entities[0]);
        }
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
        <main className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans selection:bg-indigo-100">
            <header className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Retour au Dashboard
                        </Link>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                                <Target className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Focus <span className="text-indigo-600">Metric</span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-gray-500 text-lg ml-14">
                            Analyse détaillée par entité.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <Select
                                label="Type"
                                options={viewOptions}
                                value={viewType}
                                onChange={(e) => setViewType(e.target.value as any)}
                            />
                        </div>
                        <div className="w-full sm:w-64">
                            <Select
                                label="Entité"
                                options={entityOptions}
                                value={selectedEntity}
                                onChange={(e) => setSelectedEntity(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {analysis && (
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Utilisateurs"
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
                            percent={0}
                            type="positive"
                            subtext="Plus forte croissance (12M)"
                        />
                        <StatCard
                            title="Point d'Attention"
                            entityName={analysis.worstProfession.name}
                            value={analysis.worstProfession.value}
                            percent={0}
                            type="negative"
                            subtext="Plus forte baisse (12M)"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="col-span-1 lg:col-span-2 p-6 h-[400px] flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-500" />
                                Évolution du Parc (Historique)
                            </h3>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analysis.globalEvolution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="dateLabel"
                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                            orientation="right"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            }}
                                            formatter={(value: number) => [value.toLocaleString('fr-FR'), 'Utilisateurs']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#4f46e5"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <ProfessionDistributionChart data={analysis.professionDistribution} />
                        <ProfessionPerformanceChart data={analysis.professionPerformance} />
                    </div>
                </div>
            )}
        </main>
    );
}
```

---

## 📊 5. Comparateur & Projections Prédictives : `app/compare/page.tsx`

Cette page gère la comparaison frontale entre deux éditeurs avec un calcul de tendance future (Régression linéaire) projetée sur les 36 prochains mois (3 ans) à partir des 12 derniers mois de données historiques.

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import { aggregateForComparison, getUniqueProfessions } from '@/lib/data-utils';
import { ComparisonChart } from '@/components/dashboard/ComparisonChart';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/select';

export default function ComparePage() {
    const [rawData, setRawData] = useState<SesamDataItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [entityA, setEntityA] = useState('EPSILOG');
    const [entityB, setEntityB] = useState('DOCTOLIB');
    const [profession, setProfession] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchSesamData();
            setRawData(data);
            setLoading(false);
        };
        loadData();
    }, []);

    const professions = useMemo(() => getUniqueProfessions(rawData), [rawData]);

    const filteredData = useMemo(() => {
        if (profession === 'all') return rawData;
        return rawData.filter(item => item.catPro === profession);
    }, [rawData, profession]);

    const editors = useMemo(() => {
        if (filteredData.length === 0) return [];
        const s = new Set(filteredData.map(d => d.editeur));
        return Array.from(s).sort().filter(e => e.toLowerCase() !== 'total');
    }, [filteredData]);

    const { data: chartData, keys } = useMemo(() => {
        if (filteredData.length === 0) return { data: [], keys: [] };
        return aggregateForComparison(filteredData, [entityA, entityB], 36);
    }, [filteredData, entityA, entityB]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const editorOptions = editors.map(e => ({ value: e, label: e }));
    const professionOptions = [
        { value: 'all', label: 'Toutes les professions' },
        ...professions.map(p => ({ value: p, label: p }))
    ];

    return (
        <main className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans selection:bg-indigo-100">
            <header className="max-w-7xl mx-auto mb-10">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour au Dashboard
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                        <TrendingUp className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Comparateur & <span className="text-indigo-600">Projections</span>
                        </h1>
                    </div>
                </div>
                <p className="text-gray-500 text-lg ml-14">
                    Analysez les tendances et projetez l'évolution des éditeurs sur les 3 prochaines années.
                </p>
            </header>

            <div className="max-w-7xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-end">
                    <div className="w-full md:w-1/3">
                        <Select
                            label="Profession"
                            options={professionOptions}
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <Select
                            label="Entité A"
                            options={editorOptions}
                            value={entityA}
                            onChange={(e) => setEntityA(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <Select
                            label="Entité B"
                            options={editorOptions}
                            value={entityB}
                            onChange={(e) => setEntityB(e.target.value)}
                        />
                    </div>
                </div>

                <div className="pb-3 text-sm text-gray-400 italic text-center">
                    La projection est basée sur une régression linéaire des 12 derniers mois.
                </div>

                <ComparisonChart
                    data={chartData}
                    keys={keys}
                    title={`Projection : ${entityA} vs ${entityB}`}
                />
            </div>
        </main>
    );
}
```

---

## 🏆 6. Analyse des Performances & Variations : `app/performance/page.tsx`

Cette page propose un classement triable de l'ensemble des acteurs (éditeurs, logiciels, groupes) en calculant leur croissance absolue et relative à 1 mois, 6 mois et 1 an. Elle contient également un graphique en barres des variations.

```typescript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchSesamData } from '@/lib/api';
import { SesamDataItem } from '@/lib/types';
import { calculatePerformance, getUniqueProfessions } from '@/lib/data-utils';
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
    const [focusLimit, setFocusLimit] = useState<string>('10');

    useEffect(() => {
        const loadData = async () => {
            const data = await fetchSesamData();
            setRawData(data);
            setLoading(false);
        };
        loadData();
    }, []);

    const professions = useMemo(() => getUniqueProfessions(rawData), [rawData]);

    const filteredData = useMemo(() => {
        if (profession === 'all') return rawData;
        return rawData.filter(d => d.catPro === profession);
    }, [rawData, profession]);

    const fullPerformanceData = useMemo(() => {
        if (filteredData.length === 0) return [];
        return calculatePerformance(filteredData, viewType);
    }, [filteredData, viewType]);

    const focusedData = useMemo(() => {
        if (focusLimit === 'all' || !focusLimit) return fullPerformanceData;
        const limit = parseInt(focusLimit, 10);
        return fullPerformanceData.slice(0, limit);
    }, [fullPerformanceData, focusLimit]);

    const topGainers = useMemo(() => {
        return [...focusedData].sort((a, b) => b.delta12M - a.delta12M);
    }, [focusedData]);

    const topGainer = topGainers[0];
    const topLoser = topGainers[topGainers.length - 1];
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
        <main className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans selection:bg-indigo-100">
            <header className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Retour au Dashboard
                        </Link>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                                <BarChart3 className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Analyse de <span className="text-indigo-600">Performance</span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-gray-500 text-lg ml-14">
                            Classements et tendances sur 1 an, 6 mois et 1 mois.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="w-full sm:w-48">
                            <Select
                                label="Périmètre"
                                options={focusOptions}
                                value={focusLimit}
                                onChange={(e) => setFocusLimit(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-64">
                            <Select
                                label="Profession"
                                options={professionOptions}
                                value={profession}
                                onChange={(e) => setProfession(e.target.value)}
                            />
                        </div>
                        <div className="w-full sm:w-48">
                            <Select
                                label="Vue"
                                options={viewOptions}
                                value={viewType}
                                onChange={(e) => setViewType(e.target.value as any)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-8">
                {topGainer && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {focusedData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Variations ({focusLimit === 'all' ? 'Top 20' : `Top ${focusLimit}`})
                            </h2>
                            <div className="flex bg-white rounded-lg border p-1 shadow-sm">
                                {(['1M', '6M', '12M'] as const).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setChartPeriod(p)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${chartPeriod === p
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'text-gray-500 hover:bg-gray-50'
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

                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-indigo-500" />
                            Classement Détaillé
                        </h2>
                        <span className="text-sm text-gray-500">
                            {focusedData.length} résultats
                        </span>
                    </div>
                    <PerformanceTable data={focusedData} />
                </div>
            </div>
        </main>
    );
}
```

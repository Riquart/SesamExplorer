# Étape 2 : Implémentation des Composants UI et Graphiques Recharts

Cette partie présente l'ensemble des composants visuels créés pour l'interface : les briques UI génériques et les composants interactifs du tableau de bord.

---

## 🧱 1. Composants UI de Base (Dossier `components/ui/`)

Ces composants fournissent un design moderne, épuré et intègrent l'effet de flou d'arrière-plan (glassmorphism) ainsi que des ombres soignées.

### Composant Card : `components/ui/card.tsx`
```typescript
import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
}

export function Card({ children, className, title }: CardProps) {
    return (
        <div className={clsx("bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 transition-all hover:shadow-2xl", className)}>
            {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
            {children}
        </div>
    );
}
```

### Composant Sélecteur : `components/ui/select.tsx`
```typescript
import clsx from 'clsx';
import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && <label className="text-sm font-medium text-gray-600 ml-1">{label}</label>}
            <div className="relative">
                <select
                    className={clsx(
                        "appearance-none w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors shadow-sm cursor-pointer",
                        className
                    )}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
```

### Composant Bouton : `components/ui/button.tsx`
```typescript
import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
    const base = "px-4 py-2 rounded-xl font-medium transition-all active:scale-95";
    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50",
        secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
        outline: "border border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-900"
    };

    return (
        <button className={clsx(base, variants[variant], className)} {...props} />
    );
}
```

---

## 📊 2. Composants Statistiques & Cartes (Dossier `components/dashboard/`)

### Carte Statistique Simple : `components/dashboard/StatsCard.tsx`
```typescript
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
    return (
        <Card className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
                <Icon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
                {trend && (
                    <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                        {trend}
                    </span>
                )}
            </div>
        </Card>
    );
}
```

### Carte Statistique Détaillée avec Variation : `components/dashboard/StatCard.tsx`
```typescript
import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface StatCardProps {
    title: string;
    entityName: string;
    value: number;
    percent: number;
    type: 'positive' | 'negative' | 'neutral';
    subtext?: string;
}

export function StatCard({ title, entityName, value, percent, type, subtext }: StatCardProps) {
    const isPositive = type === 'positive';
    const isNeutral = type === 'neutral';

    const colorClass = isPositive ? 'text-green-600' : isNeutral ? 'text-gray-600' : 'text-red-600';
    const bgClass = isPositive ? 'bg-green-100' : isNeutral ? 'bg-gray-100' : 'bg-red-100';
    const Icon = isPositive ? ArrowUp : isNeutral ? Minus : ArrowDown;

    return (
        <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">{title}</h3>
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-2xl font-bold text-gray-900 line-clamp-1" title={entityName}>{entityName}</div>
                    <div className="text-sm text-gray-500 mt-1">{subtext}</div>
                </div>
                <div className={`flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${bgClass} ${colorClass}`}>
                    <Icon className="w-4 h-4 mr-1" />
                    {value > 0 ? '+' : ''}{value} ({percent.toFixed(1)}%)
                </div>
            </div>
        </Card>
    );
}
```

### Barre de Filtres : `components/dashboard/FilterBar.tsx`
```typescript
import { Select } from '@/components/ui/select';
import { DataFilters } from '@/lib/data-utils';
import { Search } from 'lucide-react';

interface FilterBarProps {
    filters: DataFilters;
    onFilterChange: (filters: DataFilters) => void;
    professions: string[];
}

export function FilterBar({ filters, onFilterChange, professions }: FilterBarProps) {
    const years = ['all', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

    const handleChange = (key: keyof DataFilters, value: string) => {
        onFilterChange({ ...filters, [key]: value === 'all' ? undefined : value });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
            <div className="w-full md:w-64">
                <Select
                    label="Profession"
                    options={[{ value: 'all', label: 'Toutes les professions' }, ...professions.map(p => ({ value: p, label: p }))]}
                    value={filters.profession || 'all'}
                    onChange={(e) => handleChange('profession', e.target.value)}
                />
            </div>

            <div className="w-full md:w-48">
                <Select
                    label="Année (Début)"
                    options={[{ value: 'all', label: 'Depuis le début' }, ...years.filter(y => y !== 'all').map(y => ({ value: y + '01', label: y }))]}
                    value={filters.startDate || 'all'}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                />
            </div>

            <div className="w-full md:flex-1 relative">
                <label className="text-sm font-medium text-gray-600 ml-1 mb-1.5 block">Rechercher un éditeur</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Nom de l'éditeur ou logiciel..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                        value={filters.editorName || ''}
                        onChange={(e) => handleChange('editorName', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
```

---

## 📈 3. Composants de Graphiques Complexes (Dossier `components/dashboard/`)

Ces graphiques utilisent **Recharts** pour offrir une expérience interactive et moderne, complétée par des palettes de couleurs élégantes et des modes d'affichage enrichis.

### Graphique d'Évolution (Aires) : `components/dashboard/EvolutionChart.tsx`
Ce graphique dispose d'un bouton pour basculer en mode **plein écran** en superposant une fenêtre modale moderne.

```typescript
'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Maximize2, X } from 'lucide-react';
import { getEntityColor } from '@/lib/colors';

interface EvolutionChartProps {
    data: any[];
    keys?: string[];
    title?: string;
    highlightKey?: string;
}

export function EvolutionChart({ data, keys = ['total'], title = "Évolution", highlightKey }: EvolutionChartProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const ChartContent = () => (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                    dataKey="dateLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    minTickGap={30}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 600 }}
                    itemSorter={(item) => (item.value as number) * -1}
                />
                <Legend iconType="circle" />
                {keys.map((key) => {
                    const isHighlighted = highlightKey && key.toLowerCase().includes(highlightKey.toLowerCase());
                    const color = getEntityColor(key);

                    return (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={color}
                            strokeWidth={isHighlighted ? 5 : 2}
                            fillOpacity={0.1}
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
            <div className="fixed inset-0 z-50 bg-white p-8 flex flex-col animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <div className="flex-1 min-h-0">
                    <ChartContent />
                </div>
            </div>
        );
    }

    return (
        <Card className="h-[400px] relative group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Agrandir"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>
            <div className="h-[calc(100%-2rem)]">
                <ChartContent />
            </div>
        </Card>
    );
}
```

### Graphique de Répartition Globale (Barres) : `components/dashboard/DistributionChart.tsx`
```typescript
'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { getEntityColor } from '@/lib/colors';

interface DistributionChartProps {
    data: { name: string; value: number }[];
    title?: string;
}

export function DistributionChart({ data, title = "Répartition" }: DistributionChartProps) {
    const topLimit = 10;
    const topData = data.slice(0, topLimit);
    const otherValue = data.slice(topLimit).reduce((acc, curr) => acc + curr.value, 0);

    const chartData = otherValue > 0
        ? [...topData, { name: 'Autres', value: otherValue }]
        : topData;

    return (
        <Card className="h-[400px] flex flex-col p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={200}
                            tick={{ fontSize: 11, fill: '#4B5563' }}
                            interval={0}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            formatter={(value: any) => [Number(value).toLocaleString('fr-FR'), 'Utilisateurs']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
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
```

### Graphique de Comparaison & Projections : `components/dashboard/ComparisonChart.tsx`
Ce graphique affiche les données historiques de deux éditeurs choisis et y accole la zone projetée dans le futur en surimpression grâce à un composant `ReferenceArea`.

```typescript
'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';
import { getEntityColor } from '@/lib/colors';

interface ComparisonChartProps {
    data: any[];
    keys: string[];
    title?: string;
}

export function ComparisonChart({ data, keys, title = "Comparaison & Projection" }: ComparisonChartProps) {
    const projectionStartIndex = data.findIndex(d => d.isProjection);
    const projectionStartDate = projectionStartIndex > -1 ? data[projectionStartIndex].dateLabel : null;

    return (
        <Card className="h-[500px] relative p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">{title}</h3>
            <div className="h-[calc(100%-3rem)]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="dateLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#6B7280', marginBottom: '0.5rem' }}
                            itemSorter={(item) => (item.value as number) * -1}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

                        {projectionStartDate && (
                            <ReferenceArea
                                x1={projectionStartDate}
                                strokeOpacity={0}
                                fill="#F3F4F6"
                                fillOpacity={0.5}
                                label={{ value: "Projection", position: 'insideTopRight', fill: '#9CA3AF', fontSize: 12 }}
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
```

### Graphique de Performance (Histogramme Coloré) : `components/dashboard/PerformanceChart.tsx`
```typescript
'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, ReferenceLine } from 'recharts';
import { PerformanceMetric } from '@/lib/data-utils';

interface PerformanceChartProps {
    data: PerformanceMetric[];
    metric: 'delta1M' | 'delta6M' | 'delta12M';
    title: string;
}

export function PerformanceChart({ data, metric, title }: PerformanceChartProps) {
    if (!data || data.length === 0) return null;

    const sortedData = [...data]
        .sort((a, b) => b[metric] - a[metric])
        .slice(0, 20);

    return (
        <Card className="h-[400px] flex flex-col p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            tick={{ fontSize: 11, fill: '#4B5563' }}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [
                                value > 0 ? `+${value}` : value,
                                'Variation'
                            ]}
                        />
                        <ReferenceLine x={0} stroke="#9CA3AF" />
                        <Bar dataKey={metric} barSize={12} radius={[0, 4, 4, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry[metric] >= 0 ? '#10B981' : '#EF4444'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
```

### Tableau de Performance Triable : `components/dashboard/PerformanceTable.tsx`
```typescript
import { PerformanceMetric } from "@/lib/data-utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface PerformanceTableProps {
    data: PerformanceMetric[];
}

type SortField = 'currentValue' | 'delta1M' | 'delta6M' | 'delta12M';

export function PerformanceTable({ data }: PerformanceTableProps) {
    const [sortField, setSortField] = useState<SortField>('currentValue');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const sortedData = [...data].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    const renderDelta = (delta: number, percent: number) => {
        const color = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500';
        return (
            <div className={`flex flex-col items-end ${color}`}>
                <span className="font-semibold">{delta > 0 ? '+' : ''}{delta}</span>
                <span className="text-xs opacity-80">{delta > 0 ? '+' : ''}{percent.toFixed(1)}%</span>
            </div>
        );
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-300 ml-1 inline" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4 text-indigo-600 ml-1 inline" />
            : <ArrowDown className="w-4 h-4 text-indigo-600 ml-1 inline" />;
    };

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                        <tr>
                            <th className="px-4 py-3 text-center w-[50px]">#</th>
                            <th className="px-4 py-3 w-[30%]">Nom</th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('currentValue')}
                            >
                                Utilisateurs <SortIcon field="currentValue" />
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('delta1M')}
                            >
                                1 Mois <SortIcon field="delta1M" />
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('delta6M')}
                            >
                                6 Mois <SortIcon field="delta6M" />
                            </th>
                            <th
                                className="px-4 py-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('delta12M')}
                            >
                                1 An <SortIcon field="delta12M" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedData.map((item, index) => (
                            <tr key={item.name} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 text-center font-medium text-gray-500">{index + 1}</td>
                                <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                                <td className="px-4 py-3 text-right font-mono text-gray-700">{item.currentValue.toLocaleString('fr-FR')}</td>
                                <td className="px-4 py-3 text-right">{renderDelta(item.delta1M, item.percent1M)}</td>
                                <td className="px-4 py-3 text-right">{renderDelta(item.delta6M, item.percent6M)}</td>
                                <td className="px-4 py-3 text-right">{renderDelta(item.delta12M, item.percent12M)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

---

## 👨‍⚕️ 4. Composants Spécifiques au Focus Entité (Dossier `components/dashboard/`)

Ces composants sont utilisés sur la page Focus Entité pour afficher la ventilation et la variation par profession de santé.

### Répartition par Profession (Camembert / Pie Chart) : `components/dashboard/ProfessionDistributionChart.tsx`
```typescript
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

    return (
        <Card className="h-[400px] flex flex-col p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par Profession</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={1} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string, props: any) => [
                                `${value.toLocaleString('fr-FR')} (${props.payload.percent.toFixed(1)}%)`,
                                name
                            ]}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
```

### Performance par Profession (Histogramme) : `components/dashboard/ProfessionPerformanceChart.tsx`
```typescript
'use client';

import { Card } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';

interface ProfessionPerformanceChartProps {
    data: { name: string; delta12M: number; percent12M: number; currentValue: number }[];
}

export function ProfessionPerformanceChart({ data }: ProfessionPerformanceChartProps) {
    if (!data || data.length === 0) return null;

    const sortedData = [...data].sort((a, b) => b.delta12M - a.delta12M);

    return (
        <Card className="h-[400px] flex flex-col p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance par Profession (1 An)</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            tick={{ fontSize: 11, fill: '#4B5563' }}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [
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
```

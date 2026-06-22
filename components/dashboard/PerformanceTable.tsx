import { PerformanceMetric } from "@/lib/data-utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { isCGM } from "@/lib/colors";

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
                                Télétransmetteurs <SortIcon field="currentValue" />
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
                        {sortedData.map((item, index) => {
                            const isCgmEntity = isCGM(item.name);
                            return (
                                <tr 
                                    key={item.name} 
                                    className={`transition-colors ${isCgmEntity ? 'bg-indigo-50/20 hover:bg-indigo-50/40 border-l-2 border-indigo-600' : 'hover:bg-gray-50/50'}`}
                                >
                                    <td className="px-4 py-3 text-center font-medium text-gray-500">{index + 1}</td>
                                    <td className={`px-4 py-3 ${isCgmEntity ? 'font-extrabold text-indigo-950' : 'font-semibold text-gray-900'}`}>{item.name}</td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-700">{item.currentValue.toLocaleString('fr-FR')}</td>
                                    <td className="px-4 py-3 text-right">{renderDelta(item.delta1M, item.percent1M)}</td>
                                    <td className="px-4 py-3 text-right">{renderDelta(item.delta6M, item.percent6M)}</td>
                                    <td className="px-4 py-3 text-right">{renderDelta(item.delta12M, item.percent12M)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

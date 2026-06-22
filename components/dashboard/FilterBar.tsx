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
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-end bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <div className="w-full sm:w-64">
                <Select
                    label="Profession"
                    options={[{ value: 'all', label: 'Toutes les professions' }, ...professions.map(p => ({ value: p, label: p }))]}
                    value={filters.profession || 'all'}
                    onChange={(e) => handleChange('profession', e.target.value)}
                    uiSize="sm"
                />
            </div>

            <div className="w-full sm:w-48">
                <Select
                    label="Année (Début)"
                    options={[{ value: 'all', label: 'Depuis le début' }, ...years.filter(y => y !== 'all').map(y => ({ value: y + '01', label: y }))]}
                    value={filters.startDate || 'all'}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    uiSize="sm"
                />
            </div>

            <div className="w-full sm:w-72">
                <label className="text-[11px] font-semibold text-gray-500 ml-0.5 mb-1 block leading-none">Filtrer</label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Nom de l'éditeur ou logiciel..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                        value={filters.editorName || ''}
                        onChange={(e) => handleChange('editorName', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}

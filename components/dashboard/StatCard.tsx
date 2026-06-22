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
        <Card className="!p-4 sm:!p-5 hover:scale-[1.01] transition-transform">
            <h3 className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">{title}</h3>
            <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="text-lg sm:text-xl font-extrabold text-gray-900 line-clamp-1" title={entityName}>{entityName}</div>
                    <div className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">{subtext}</div>
                </div>
                <div className={`flex items-center shrink-0 px-2 py-0.5 rounded-lg text-xs font-bold shadow-sm ${bgClass} ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5 mr-0.5" />
                    {value > 0 ? '+' : ''}{value} ({percent.toFixed(1)}%)
                </div>
            </div>
        </Card>
    );
}

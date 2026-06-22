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

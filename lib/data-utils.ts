import { SesamDataItem } from './types';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types for Filters
export interface DataFilters {
    profession?: string;
    startDate?: string; // YYYYMM
    endDate?: string;   // YYYYMM
    editorName?: string;
}

// ----- HELPERS -----

export const parseDate = (dateStr: string | number) => {
    return parse(String(dateStr), 'yyyyMM', new Date());
};

export const formatDateReadable = (dateStr: string | number) => {
    const date = parseDate(dateStr);
    return format(date, 'MMM yyyy', { locale: fr });
};

// ----- FILTERS -----

export const filterData = (data: SesamDataItem[], filters: DataFilters) => {
    return data.filter((item) => {
        // Exclude aggregate rows (total)
        if (item.editeur?.toLowerCase() === 'total' ||
            item.groupe?.toLowerCase() === 'total' ||
            item.progiciel?.toLowerCase() === 'total') {
            return false;
        }

        // Filter by CatPro
        if (filters.profession && item.catPro !== filters.profession) return false;

        // Filter by Date Range
        if (filters.startDate && String(item.dateData) < filters.startDate) return false;
        if (filters.endDate && String(item.dateData) > filters.endDate) return false;

        // Filter by Editeur (partial match)
        if (filters.editorName && !item.editeur.toLowerCase().includes(filters.editorName.toLowerCase())) return false;

        return true;
    });
};

// ----- AGGREGATORS -----

/**
 * Aggregates data by Date to show evolution of Total Users
 */
export const aggregateByDate = (data: SesamDataItem[]) => {
    const grouped = data.reduce((acc, item) => {
        const key = String(item.dateData);
        if (!acc[key]) {
            acc[key] = { date: key, dateLabel: formatDateReadable(key), total: 0 };
        }
        acc[key].total += item.nbPsFacturation;
        return acc;
    }, {} as Record<string, { date: string; dateLabel: string; total: number }>);

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Aggregates data by a specific key (groupe, editeur, progiciel)
 */
export const aggregateByKey = (data: SesamDataItem[], key: 'groupe' | 'editeur' | 'progiciel') => {
    // Determine latest date to show snapshot of current market share
    const latestDate = data.reduce((max, curr) => (curr.dateData > max ? curr.dateData : max), data[0]?.dateData || 0);

    const grouped = data
        .filter(item => item.dateData === latestDate)
        .reduce((acc, item) => {
            // Robust fallback: if key is 'groupe' and value is missing, empty, or explicit placeholder, use 'editeur'
            const isMissingGroup = !item[key] || item[key].trim() === '' || item[key] === '__NO_GROUP__';
            const groupKey = (key === 'groupe' && isMissingGroup) ? item.editeur : item[key];

            // Skip if the resolved key is still invalid or is 'total'
            if (!groupKey || groupKey.toLowerCase() === 'total') return acc;

            if (!acc[groupKey]) {
                acc[groupKey] = { name: groupKey, value: 0 };
            }
            acc[groupKey].value += item.nbPsFacturation;
            return acc;
        }, {} as Record<string, { name: string; value: number }>);

    return Object.values(grouped).sort((a, b) => b.value - a.value);
};

export const getUniqueProfessions = (data: SesamDataItem[]) => {
    const pros = new Set(data.map(d => d.catPro));
    return Array.from(pros).sort();
};

/**
 * Aggregates data by Date AND by Key to show evolution of each entity
 * Returns: [{ date: '202001', dateLabel: 'Jan 2020', 'EntityA': 100, 'EntityB': 200 }, ...]
 */
export const aggregateEvolutionByKey = (data: SesamDataItem[], key: 'groupe' | 'editeur' | 'progiciel', limit: number = 5) => {
    // 1. Identification of Top N entities based on LATEST DATE value
    // Find latest date in the dataset
    const latestDate = data.reduce((max, curr) => (curr.dateData > max ? curr.dateData : max), data[0]?.dateData || 0);

    const totalsAtLatestDate = data
        .filter(item => item.dateData === latestDate)
        .reduce((acc, item) => {
            const k = (key === 'groupe' && !item[key]) ? item.editeur : item[key];
            if (k?.toLowerCase() !== 'total') {
                acc[k] = (acc[k] || 0) + item.nbPsFacturation;
            }
            return acc;
        }, {} as Record<string, number>);

    const topEntities = Object.entries(totalsAtLatestDate)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit) // Keep top N
        .map(([name]) => name);

    // 2. Group by Date
    const groupedByDate = data.reduce((acc, item) => {
        const d = String(item.dateData);
        if (!acc[d]) {
            acc[d] = { date: d, dateLabel: formatDateReadable(d) };
            // Initialize top entities to 0 to ensure continuity
            topEntities.forEach(e => acc[d][e] = 0);
        }

        const k = (key === 'groupe' && !item[key]) ? item.editeur : item[key];
        // Only include if it is in our top list
        if (topEntities.includes(k)) {
            acc[d][k] = (acc[d][k] as number) + item.nbPsFacturation;
        }

        return acc;
    }, {} as Record<string, any>);

    return {
        data: Object.values(groupedByDate).sort((a: any, b: any) => a.date.localeCompare(b.date)),
        keys: topEntities
    };
};

// ----- COMPARISON & PROJECTION -----

export interface ProjectionPoint {
    date: string;
    dateLabel: string;
    value: number;
    isProjection: boolean;
    [key: string]: any;
}

/**
 * Calculates linear regression trend (slope and intercept) based on data points
 * Uses simple Least Squares method
 */
const calculateTrend = (values: number[]) => {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };

    const x = Array.from({ length: n }, (_, i) => i); // 0, 1, 2...
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, curr, i) => acc + curr * y[i], 0);
    const sumXX = x.reduce((acc, curr) => acc + curr * curr, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

/**
 * Aggregates data for specific list of entities and projects future trend
 */
export const aggregateForComparison = (
    data: SesamDataItem[],
    entities: string[],
    type: 'editeur' | 'groupe' | 'progiciel' = 'editeur',
    projectionMonths = 36,
    lookbackMonths = 12,
    projectionMethod: 'linear' | 'percentage' = 'linear'
) => {
    // 1. Get Historical Data
    const fullHistory = aggregateEvolutionByKey(data, type, 100).data;

    // Filter history to keep only requested entities entries + date
    const historicalData = fullHistory.map(point => {
        const p: any = {
            date: point.date,
            dateLabel: point.dateLabel,
            isProjection: false
        };
        entities.forEach(e => {
            p[e] = point[e] || 0;
        });
        return p;
    });

    // 2. Calculate Trends and Project
    const projections: any[] = [];
    const lastPoint = historicalData[historicalData.length - 1];

    if (!lastPoint) return { data: [], keys: entities };

    // Prepare future dates
    let currentDate = parseDate(lastPoint.date);

    // Calculate slope or growth rate for each entity based on lookbackMonths
    const slopes: Record<string, number> = {};
    const growthRates: Record<string, number> = {};
    const startValues: Record<string, number> = {};

    entities.forEach(e => {
        // Extract last N values
        const values = historicalData
            .slice(-lookbackMonths)
            .map(p => p[e] as number);

        const lastVal = values[values.length - 1] || 0;
        startValues[e] = lastVal;

        if (projectionMethod === 'linear') {
            const { slope } = calculateTrend(values);
            slopes[e] = slope;
        } else {
            // Percentage compound monthly growth rate (CAGR over lookback)
            const firstVal = values[0] || 0;
            const n = values.length - 1;
            
            if (firstVal > 0 && lastVal > 0 && n > 0) {
                const rate = Math.pow(lastVal / firstVal, 1 / n) - 1;
                growthRates[e] = Math.max(-0.2, Math.min(0.2, rate)); // cap at ±20% monthly
            } else if (lastVal > 0 && firstVal === 0 && values.length > 0) {
                const firstNonZero = values.find(v => v > 0) || 1;
                const firstNonZeroIdx = values.findIndex(v => v > 0);
                const steps = values.length - 1 - firstNonZeroIdx;
                if (steps > 0) {
                    const rate = Math.pow(lastVal / firstNonZero, 1 / steps) - 1;
                    growthRates[e] = Math.max(-0.2, Math.min(0.2, rate));
                } else {
                    growthRates[e] = 0;
                }
            } else {
                growthRates[e] = 0;
            }
        }
    });

    // Generate future points
    // Use date-fns addMonths to safely increment date
    const { addMonths, format } = require('date-fns');

    for (let i = 1; i <= projectionMonths; i++) {
        const nextDate = addMonths(currentDate, i);
        const dateStr = format(nextDate, 'yyyyMM');

        const point: any = {
            date: dateStr,
            dateLabel: format(nextDate, 'MMM yyyy', { locale: fr }),
            isProjection: true
        };

        entities.forEach(e => {
            if (projectionMethod === 'linear') {
                const val = startValues[e] + (slopes[e] * i);
                point[e] = Math.max(0, Math.round(val));
            } else {
                const rate = growthRates[e];
                const val = startValues[e] * Math.pow(1 + rate, i);
                point[e] = Math.max(0, Math.round(val));
            }
        });

        projections.push(point);
    }

    return {
        data: [...historicalData, ...projections],
        keys: entities
    };
};

export interface PerformanceMetric {
    name: string;
    currentValue: number;
    delta1M: number;
    percent1M: number;
    delta6M: number;
    percent6M: number;
    delta12M: number;
    percent12M: number;
}

export const calculatePerformance = (data: SesamDataItem[], type: 'editeur' | 'groupe' | 'progiciel' = 'editeur'): PerformanceMetric[] => {
    // 1. Identify Key Dates
    const uniqueDates = Array.from(new Set(data.map(d => String(d.dateData)))).sort((a, b) => b.localeCompare(a));
    const latestDate = uniqueDates[0];

    // Helper to find closest date index
    const findDateIndex = (monthsBack: number) => {
        // Simple approximation: assuming contiguous monthly data sorted desc
        // If data is dense, index is just monthsBack. If sparse, we might need date parsing.
        // Given dateData is YYYYMM (number), in this dataset structure (YYYYMM)
        // we can try to find exact match or closest previous.

        // Let's parse YYYYMM to Date objects for accurate subtraction
        const latestDateNum = Number(latestDate);
        const year = Math.floor(latestDateNum / 100);
        const month = latestDateNum % 100;
        const current = new Date(year, month - 1); // JS months 0-11

        current.setMonth(current.getMonth() - monthsBack);

        const targetYYYYMM = current.getFullYear() * 100 + (current.getMonth() + 1);

        // Find the date in uniqueDates that is closest to targetYYYYMM (but <=)
        const found = uniqueDates.find(d => Number(d) <= targetYYYYMM);
        return found || uniqueDates[uniqueDates.length - 1];
    };

    const date1M = findDateIndex(1);
    const date6M = findDateIndex(6);
    const date12M = findDateIndex(12);

    // 2. Aggregate Data for each Snapshot
    const getSnapshot = (date: string) => {
        return data
            .filter(d => d.dateData === date)
            .reduce((acc, item) => {
                const key = (type === 'groupe' && (!item[type] || item[type] === '__NO_GROUP__')) ? item.editeur : item[type];
                if (!key || key.toLowerCase() === 'total') return acc;

                acc[key] = (acc[key] || 0) + item.nbPsFacturation;
                return acc;
            }, {} as Record<string, number>);
    };

    const currentSnapshot = getSnapshot(latestDate);
    const snapshot1M = getSnapshot(date1M);
    const snapshot6M = getSnapshot(date6M);
    const snapshot12M = getSnapshot(date12M);

    // 3. Build Metrics
    const results: PerformanceMetric[] = Object.entries(currentSnapshot).map(([name, currentVal]) => {
        const val1M = snapshot1M[name] || 0;
        const val6M = snapshot6M[name] || 0;
        const val12M = snapshot12M[name] || 0;

        return {
            name,
            currentValue: currentVal,
            delta1M: currentVal - val1M,
            percent1M: val1M === 0 ? 0 : ((currentVal - val1M) / val1M) * 100,
            delta6M: currentVal - val6M,
            percent6M: val6M === 0 ? 0 : ((currentVal - val6M) / val6M) * 100,
            delta12M: currentVal - val12M,
            percent12M: val12M === 0 ? 0 : ((currentVal - val12M) / val12M) * 100,
        };
    });

    return results.sort((a, b) => b.currentValue - a.currentValue);
};

// ----- FOCUS ANALYSIS -----

export interface EntityFocusStats {
    name: string;
    type: 'editeur' | 'groupe' | 'progiciel';
    totalUsers: number;
    marketRank: number;
    delta1Y: number;
    percent1Y: number;
    bestProfession: { name: string; value: number; percent: number };
    worstProfession: { name: string; value: number; percent: number };
    professionDistribution: { name: string; value: number; percent: number }[];
    professionPerformance: { name: string; delta12M: number; percent12M: number; currentValue: number }[];
    globalEvolution: { date: string; dateLabel: string; value: number }[];
}

export const getEntityAnalysis = (data: SesamDataItem[], type: 'editeur' | 'groupe' | 'progiciel', entityName: string): EntityFocusStats | null => {
    if (!entityName) return null;

    // 1. Filter data for this entity
    const entityData = data.filter(d => {
        const key = (type === 'groupe' && (!d[type] || d[type] === '__NO_GROUP__')) ? d.editeur : d[type];
        return key === entityName;
    });

    if (entityData.length === 0) return null;

    // 2. Global Stats (Latest Snapshot)
    const uniqueDates = Array.from(new Set(data.map(d => String(d.dateData)))).sort((a, b) => b.localeCompare(a));
    const latestDate = uniqueDates[0];
    const latestDateNum = Number(latestDate);
    const prevYearDate = uniqueDates.find(d => {
        const y = Math.floor(latestDateNum / 100);
        const m = latestDateNum % 100;
        const target = (y - 1) * 100 + m; // Same month last year
        return Number(d) <= target;
    }) || uniqueDates[uniqueDates.length - 1];

    const currentTotal = entityData
        .filter(d => d.dateData === latestDate)
        .reduce((sum, d) => sum + d.nbPsFacturation, 0);

    const prevYearTotal = entityData
        .filter(d => d.dateData === prevYearDate)
        .reduce((sum, d) => sum + d.nbPsFacturation, 0);

    const delta1Y = currentTotal - prevYearTotal;
    const percent1Y = prevYearTotal === 0 ? 0 : (delta1Y / prevYearTotal) * 100;

    // 3. Market Rank
    const allEntities = aggregateByKey(data, type);
    const rank = allEntities.findIndex(e => e.name === entityName) + 1;

    // 4. Profession Distribution (Pie)
    const distMap = entityData
        .filter(d => d.dateData === latestDate)
        .reduce((acc, d) => {
            acc[d.catPro] = (acc[d.catPro] || 0) + d.nbPsFacturation;
            return acc;
        }, {} as Record<string, number>);

    const professionDistribution = Object.entries(distMap)
        .map(([name, value]) => ({
            name,
            value,
            percent: currentTotal === 0 ? 0 : (value / currentTotal) * 100
        }))
        .sort((a, b) => b.value - a.value);

    // 5. Profession Performance (Bar)
    const prevDistMap = entityData
        .filter(d => d.dateData === prevYearDate)
        .reduce((acc, d) => {
            acc[d.catPro] = (acc[d.catPro] || 0) + d.nbPsFacturation;
            return acc;
        }, {} as Record<string, number>);

    const professionPerformance = Object.keys({ ...distMap, ...prevDistMap }).map(pro => {
        const cur = distMap[pro] || 0;
        const prev = prevDistMap[pro] || 0;
        const diff = cur - prev;
        return {
            name: pro,
            currentValue: cur,
            delta12M: diff,
            percent12M: prev === 0 ? 0 : (diff / prev) * 100
        };
    }).sort((a, b) => b.delta12M - a.delta12M);

    const bestProfession = professionPerformance[0];
    const worstProfession = professionPerformance[professionPerformance.length - 1];

    // 6. Global Evolution (Line)
    const evolutionMap = entityData.reduce((acc, d) => {
        const dateStr = String(d.dateData);
        acc[dateStr] = (acc[dateStr] || 0) + d.nbPsFacturation;
        return acc;
    }, {} as Record<string, number>);

    const globalEvolution = Object.entries(evolutionMap)
        .map(([date, value]) => ({
            date,
            dateLabel: formatDateReadable(date),
            value
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        name: entityName,
        type,
        totalUsers: currentTotal,
        marketRank: rank,
        delta1Y,
        percent1Y,
        bestProfession: { name: bestProfession?.name || 'N/A', value: bestProfession?.delta12M || 0, percent: bestProfession?.percent12M || 0 },
        worstProfession: { name: worstProfession?.name || 'N/A', value: worstProfession?.delta12M || 0, percent: worstProfession?.percent12M || 0 },
        professionDistribution,
        professionPerformance,
        globalEvolution
    };
};

# Étape 1 : Implémentation de la Couche de Données (Data Layer)

Cette partie présente les structures de données, la logique réseau et les utilitaires mathématiques/statistiques permettant de manipuler et d'analyser le parc de télétransmission SESAM-Vitale.

---

## 1. Définition des Types : `lib/types.ts`

Ce fichier définit les structures TypeScript des données reçues depuis l'API publique de SESAM-Vitale ainsi que les filtres de l'interface utilisateur.

```typescript
export interface SesamDataItem {
  catPro: string;
  dateData: string; // Format: "YYYYMM"
  editeur: string;
  groupe: string;
  progiciel: string;
  nbPsFacturation: number;
}

export interface DataFilters {
  profession?: string;
  startDate?: string; // Format: "YYYYMM"
  endDate?: string;   // Format: "YYYYMM"
  editorName?: string;
}

export interface SesamApiResponse {
  chiffres: SesamDataItem[];
}
```

---

## 2. Palette de Couleurs Dynamique & Déterministe : `lib/colors.ts`

Pour s'assurer que les éditeurs conservent la même couleur à travers les différents graphiques du tableau de bord (par exemple, "VEGA" ou "EPSILOG" en bleu foncé, "Autres" en gris), ce module propose une palette de couleurs élégantes et calcule de manière déterministe (grâce à un algorithme de hash simple) la couleur d'un éditeur si celle-ci n'est pas fixe.

```typescript
// Palette de couleurs harmonieuses pour les entités
const PALETTE = [
    '#6366f1', // Indigo 500
    '#8b5cf6', // Violet 500
    '#d946ef', // Fuchsia 500
    '#f43f5e', // Rose 500
    '#f97316', // Orange 500
    '#eab308', // Yellow 500
    '#84cc16', // Lime 500
    '#10b981', // Emerald 500
    '#06b6d4', // Cyan 500
    '#3b82f6', // Blue 500
    '#64748b', // Slate 500 (Autres)
];

const FIXED_COLORS: Record<string, string> = {
    'VEGA': '#1e3a8a', // Navy Blue
    'EPSILOG': '#1e3a8a',
    'CompuGroup Medical France': '#1e3a8a',
    'Autres': '#9ca3af' // Gray 400
};

// Fonction de hachage simple pour mapper une chaîne à un index persistant
const getHashIndex = (str: string, max: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % max;
};

// Récupérer la couleur d'une entité de manière déterministe
export const getEntityColor = (name: string) => {
    if (FIXED_COLORS[name]) return FIXED_COLORS[name];
    if (name === 'Autres') return '#9ca3af';
    const index = getHashIndex(name, PALETTE.length);
    return PALETTE[index];
};

export const CHART_COLORS = PALETTE;
```

---

## 3. Client API : `lib/api.ts`

Ce module permet de récupérer les données du tableau de bord. Il interroge la route proxy locale de notre serveur Next.js pour éviter les problèmes de blocage CORS (Cross-Origin Resource Sharing).

```typescript
import { SesamDataItem, SesamApiResponse } from './types';

export async function fetchSesamData(): Promise<SesamDataItem[]> {
    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data: SesamApiResponse = await response.json();
        return data.chiffres || [];
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}
```

---

## 4. Algorithmes, Agrégations & Projections : `lib/data-utils.ts`

C'est le **cœur logique** du traitement de données du projet. Il gère :
1.  Le filtrage des métriques aggregate (comme les lignes nommées "TOTAL" dans les données brutes).
2.  Le parsing des dates du format brut `"YYYYMM"` vers un format humain (ex. `"Jan 2025"`).
3.  L'agrégation par date, par éditeur/logiciel/groupe pour les diagrammes circulaires (Pie) et de répartition.
4.  L'analyse détaillée pour une entité (calcul des points d'attention, meilleures croissances, historique).
5.  Le calcul de **Régression Linéaire par la méthode des Moindres Carrés** pour projeter l'évolution d'un éditeur sur 36 mois.
6.  Le calcul de variations de performances à 1 mois, 6 mois et 12 mois pour le tableau de classement.

Voici le code complet à implémenter dans `lib/data-utils.ts` :

```typescript
import { SesamDataItem } from './types';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les Filtres locaux
export interface DataFilters {
    profession?: string;
    startDate?: string; // YYYYMM
    endDate?: string;   // YYYYMM
    editorName?: string;
}

// ----- UTILS -----

export const parseDate = (dateStr: string | number) => {
    return parse(String(dateStr), 'yyyyMM', new Date());
};

export const formatDateReadable = (dateStr: string | number) => {
    const date = parseDate(dateStr);
    return format(date, 'MMM yyyy', { locale: fr });
};

// ----- FILTRES -----

export const filterData = (data: SesamDataItem[], filters: DataFilters) => {
    return data.filter((item) => {
        // Exclure les agrégats globaux de l'upstream
        if (item.editeur?.toLowerCase() === 'total' ||
            item.groupe?.toLowerCase() === 'total' ||
            item.progiciel?.toLowerCase() === 'total') {
            return false;
        }

        // Filtre de profession (catégorie professionnelle)
        if (filters.profession && item.catPro !== filters.profession) return false;

        // Filtre de plages de dates
        if (filters.startDate && String(item.dateData) < filters.startDate) return false;
        if (filters.endDate && String(item.dateData) > filters.endDate) return false;

        // Recherche textuelle d'un éditeur
        if (filters.editorName && !item.editeur.toLowerCase().includes(filters.editorName.toLowerCase())) return false;

        return true;
    });
};

// ----- AGRÉGATIONS -----

/**
 * Agrège les données par Date pour afficher l'évolution globale
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
 * Agrège les données par clé (groupe, editeur, progiciel) pour le dernier mois disponible (parts de marché)
 */
export const aggregateByKey = (data: SesamDataItem[], key: 'groupe' | 'editeur' | 'progiciel') => {
    const latestDate = data.reduce((max, curr) => (curr.dateData > max ? curr.dateData : max), data[0]?.dateData || 0);

    const grouped = data
        .filter(item => item.dateData === latestDate)
        .reduce((acc, item) => {
            const isMissingGroup = !item[key] || item[key].trim() === '' || item[key] === '__NO_GROUP__';
            const groupKey = (key === 'groupe' && isMissingGroup) ? item.editeur : item[key];

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
 * Agrège l'évolution dans le temps des Top N entités
 */
export const aggregateEvolutionByKey = (data: SesamDataItem[], key: 'groupe' | 'editeur' | 'progiciel', limit: number = 5) => {
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
        .slice(0, limit)
        .map(([name]) => name);

    const groupedByDate = data.reduce((acc, item) => {
        const d = String(item.dateData);
        if (!acc[d]) {
            acc[d] = { date: d, dateLabel: formatDateReadable(d) };
            topEntities.forEach(e => acc[d][e] = 0);
        }

        const k = (key === 'groupe' && !item[key]) ? item.editeur : item[key];
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

// ----- COMPARATEUR & REGRESSION LINEAIRE -----

export interface ProjectionPoint {
    date: string;
    dateLabel: string;
    value: number;
    isProjection: boolean;
    [key: string]: any;
}

/**
 * Calcule la régression linéaire (pente/coordonnée à l'origine) par les Moindres Carrés
 */
const calculateTrend = (values: number[]) => {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };

    const x = Array.from({ length: n }, (_, i) => i);
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
 * Prépare et calcule les projections à partir de la régression linéaire sur 12 mois
 */
export const aggregateForComparison = (data: SesamDataItem[], entities: string[], projectionMonths = 24) => {
    const fullHistory = aggregateEvolutionByKey(data, 'editeur', 100).data;

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

    const projections: any[] = [];
    const lastPoint = historicalData[historicalData.length - 1];

    if (!lastPoint) return { data: [], keys: entities };

    let currentDate = parseDate(lastPoint.date);
    const LOOKBACK_MONTHS = 12;
    const slopes: Record<string, number> = {};
    const startValues: Record<string, number> = {};

    entities.forEach(e => {
        const values = historicalData
            .slice(-LOOKBACK_MONTHS)
            .map(p => p[e] as number);

        const { slope } = calculateTrend(values);
        slopes[e] = slope;
        startValues[e] = values[values.length - 1];
    });

    // Générer les points futurs en important date-fns dynamiquement
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
            const val = startValues[e] + (slopes[e] * i);
            point[e] = Math.max(0, Math.round(val)); // Empêcher les valeurs négatives
        });

        projections.push(point);
    }

    return {
        data: [...historicalData, ...projections],
        keys: entities
    };
};

// ----- CALCULS DE PERFORMANCE -----

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
    const uniqueDates = Array.from(new Set(data.map(d => d.dateData))).sort((a, b) => b - a);
    const latestDate = uniqueDates[0];

    const findDateIndex = (monthsBack: number) => {
        const year = Math.floor(latestDate / 100);
        const month = latestDate % 100;
        const current = new Date(year, month - 1);

        current.setMonth(current.getMonth() - monthsBack);
        const targetYYYYMM = current.getFullYear() * 100 + (current.getMonth() + 1);

        const found = uniqueDates.find(d => d <= targetYYYYMM);
        return found || uniqueDates[uniqueDates.length - 1];
    };

    const date1M = findDateIndex(1);
    const date6M = findDateIndex(6);
    const date12M = findDateIndex(12);

    const getSnapshot = (date: number) => {
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

// ----- FOCUS ENTITÉ -----

export interface EntityFocusStats {
    name: string;
    type: 'editeur' | 'groupe' | 'progiciel';
    totalUsers: number;
    marketRank: number;
    delta1Y: number;
    percent1Y: number;
    bestProfession: { name: string; value: number };
    worstProfession: { name: string; value: number };
    professionDistribution: { name: string; value: number; percent: number }[];
    professionPerformance: { name: string; delta12M: number; percent12M: number; currentValue: number }[];
    globalEvolution: { date: string; dateLabel: string; value: number }[];
}

export const getEntityAnalysis = (data: SesamDataItem[], type: 'editeur' | 'groupe' | 'progiciel', entityName: string): EntityFocusStats | null => {
    if (!entityName) return null;

    const entityData = data.filter(d => {
        const key = (type === 'groupe' && (!d[type] || d[type] === '__NO_GROUP__')) ? d.editeur : d[type];
        return key === entityName;
    });

    if (entityData.length === 0) return null;

    const uniqueDates = Array.from(new Set(data.map(d => d.dateData))).sort((a, b) => b - a);
    const latestDate = uniqueDates[0];
    const prevYearDate = uniqueDates.find(d => {
        const y = Math.floor(latestDate / 100);
        const m = latestDate % 100;
        const target = (y - 1) * 100 + m;
        return d <= target;
    }) || uniqueDates[uniqueDates.length - 1];

    const currentTotal = entityData
        .filter(d => d.dateData === latestDate)
        .reduce((sum, d) => sum + d.nbPsFacturation, 0);

    const prevYearTotal = entityData
        .filter(d => d.dateData === prevYearDate)
        .reduce((sum, d) => sum + d.nbPsFacturation, 0);

    const delta1Y = currentTotal - prevYearTotal;
    const percent1Y = prevYearTotal === 0 ? 0 : (delta1Y / prevYearTotal) * 100;

    const allEntities = aggregateByKey(data, type);
    const rank = allEntities.findIndex(e => e.name === entityName) + 1;

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
        bestProfession: { name: bestProfession?.name || 'N/A', value: bestProfession?.delta12M || 0 },
        worstProfession: { name: worstProfession?.name || 'N/A', value: worstProfession?.delta12M || 0 },
        professionDistribution,
        professionPerformance,
        globalEvolution
    };
};
```

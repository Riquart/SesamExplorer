
// Consistent color palette for entities
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

const CGM_ENTITIES = new Set([
    'COMPUGROUP MEDICAL FRANCE',
    'COMPUGROUP MEDICAL',
    'AATLANTIDE',
    'COMPUGROUP MEDICAL SOLUTIONS',
    'IMAGINE EDITIONS',
    'EPSILOG',
    'ACTEUR.FR',
    'AXIAM',
    'HELLODOC',
    'CGM EVITALE',
    'VEGA',
    '123SANTE'
]);

export const isCGM = (name: string): boolean => {
    if (!name) return false;
    const normalized = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
    return CGM_ENTITIES.has(normalized) || 
           normalized.includes('COMPUGROUP') || 
           normalized.includes('COMPUGROUPE') ||
           normalized.includes('CGM');
};

const FIXED_COLORS: Record<string, string> = {
    'VEGA': '#1e3a8a', // Navy Blue
    'EPSILOG': '#1e3a8a',
    'CompuGroup Medical France': '#1e3a8a',
    'COMPUGROUP MEDICAL FRANCE': '#1e3a8a',
    'Autres': '#9ca3af'
};

// Simple hash function to map string to a consistent index
const getHashIndex = (str: string, max: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % max;
};

// Map of fixed colors for known entities if desired, or dynamic
// We can use a deterministic function
export const getEntityColor = (name: string) => {
    if (!name) return '#9ca3af';
    if (isCGM(name)) return '#1e3a8a'; // Unified CGM Navy Blue
    if (name === 'Autres') return '#9ca3af'; // Gray 400
    if (FIXED_COLORS[name]) return FIXED_COLORS[name];
    const index = getHashIndex(name, PALETTE.length);
    return PALETTE[index];
};

// Export palette for reference
export const CHART_COLORS = PALETTE;

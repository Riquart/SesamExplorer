import { SesamDataItem, SesamApiResponse } from './types';

function processChiffres(chiffres: any[]): SesamDataItem[] {
    return chiffres.map(item => {
        let groupVal = item.groupe;
        if (!groupVal || groupVal.trim() === '' || groupVal.startsWith('__NO_GROUP__')) {
            groupVal = `${item.editeur} *`;
        }
        return {
            ...item,
            groupe: groupVal,
            dateData: String(item.dateData)
        };
    });
}

export async function fetchSesamData(): Promise<SesamDataItem[]> {
    try {
        // Tente de récupérer les données en temps réel via la route API proxy
        const response = await fetch('/api/proxy', {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch live data: ${response.statusText}`);
        }

        const data: SesamApiResponse = await response.json();
        if (!data.chiffres || data.chiffres.length === 0) {
            throw new Error('Received empty data from live API');
        }
        
        return processChiffres(data.chiffres);
    } catch (error) {
        console.warn('API Live Fetch failed, falling back to static sesam-data.json:', error);
        
        try {
            const response = await fetch('/sesam-data.json');

            if (!response.ok) {
                throw new Error(`Failed to fetch static fallback data: ${response.statusText}`);
            }

            const data: SesamApiResponse = await response.json();
            return processChiffres(data.chiffres || []);
        } catch (fallbackError) {
            console.error('API Fallback Fetch also failed:', fallbackError);
            throw fallbackError;
        }
    }
}

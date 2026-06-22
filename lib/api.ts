import { SesamDataItem, SesamApiResponse } from './types';

export async function fetchSesamData(): Promise<SesamDataItem[]> {
    try {
        const response = await fetch('/sesam-data.json');

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data: SesamApiResponse = await response.json();
        const chiffres = (data.chiffres || []).map(item => {
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
        return chiffres;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

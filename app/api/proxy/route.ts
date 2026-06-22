import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SESAM_API_URL = 'https://www.sesam-vitale.fr/en/web/sesam-vitale/parts-de-teletransmission?p_p_id=fr_sesamvitale_portail_chiffrespdm_web_portlet_chiffresPDMPortlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=%2Fchiffrespdm%2FgetJsonResponse&p_p_cacheability=cacheLevelPage';
const CACHE_FILE = '/tmp/sesam-cache.json';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 heures

// Cache en mémoire global au conteneur
let memoryCache: any = null;
let cacheTime: number = 0;

// Fonction pour récupérer les données locales commités (base de secours)
async function getLocalFallback() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'sesam-data.json');
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error reading local fallback file:', err);
    }
    return { chiffres: [] };
}

// Fusionne le local et le live pour s'assurer qu'aucune donnée historique n'est supprimée ou perdue
function mergeData(localChiffres: any[], liveChiffres: any[]) {
    const seen = new Set();
    const result: any[] = [];

    // Priorité aux données récupérées en live (mise à jour du mois en cours)
    liveChiffres.forEach(item => {
        const key = `${item.dateData}_${item.catPro}_${item.editeur}_${item.progiciel}`;
        seen.add(key);
        result.push(item);
    });

    // Compléter avec les données locales si elles n'existent pas dans le live (protection contre suppression de l'historique)
    localChiffres.forEach(item => {
        const key = `${item.dateData}_${item.catPro}_${item.editeur}_${item.progiciel}`;
        if (!seen.has(key)) {
            result.push(item);
        }
    });

    return result;
}

export async function POST() {
    const now = Date.now();

    // 1. Renvoyer le cache mémoire si valide
    if (memoryCache && (now - cacheTime < CACHE_DURATION)) {
        return NextResponse.json(memoryCache);
    }

    // 2. Si mémoire vide, essayer de lire le cache disque valide
    if (!memoryCache) {
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const stat = fs.statSync(CACHE_FILE);
                if (now - stat.mtimeMs < CACHE_DURATION) {
                    const data = fs.readFileSync(CACHE_FILE, 'utf8');
                    memoryCache = JSON.parse(data);
                    cacheTime = stat.mtimeMs;
                    return NextResponse.json(memoryCache);
                }
            }
        } catch (err) {
            console.warn('Error reading disk cache:', err);
        }
    }

    // 3. Interroger l'API officielle
    try {
        const response = await fetch(SESAM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            // Timeout de sécurité de 20 secondes
            signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
            throw new Error(`Upstream API error: ${response.status} ${response.statusText}`);
        }

        const liveData = await response.json();
        if (!liveData || !liveData.chiffres || liveData.chiffres.length === 0) {
            throw new Error('Empty or invalid live figures from official API');
        }

        // Fusionner l'historique local et les nouvelles données récupérées
        const fallbackData = await getLocalFallback();
        const mergedChiffres = mergeData(fallbackData.chiffres || [], liveData.chiffres);
        const finalData = { chiffres: mergedChiffres };

        // Mettre à jour les caches
        memoryCache = finalData;
        cacheTime = now;
        
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(finalData), 'utf8');
        } catch (writeErr) {
            console.warn('Could not write cache to disk:', writeErr);
        }

        return NextResponse.json(finalData);
    } catch (error) {
        console.error('Failed to fetch live data from SESAM-Vitale:', error);

        // Si l'API échoue, on essaie de renvoyer le dernier cache mémoire disponible (même expiré)
        if (memoryCache) {
            return NextResponse.json(memoryCache);
        }

        // Sinon le cache disque (même expiré)
        try {
            if (fs.existsSync(CACHE_FILE)) {
                const data = fs.readFileSync(CACHE_FILE, 'utf8');
                memoryCache = JSON.parse(data);
                cacheTime = now; // Extension temporaire
                return NextResponse.json(memoryCache);
            }
        } catch (err) {
            console.warn('Error reading expired disk cache:', err);
        }

        // En dernier recours, renvoyer la base locale commité
        const fallbackData = await getLocalFallback();
        return NextResponse.json(fallbackData);
    }
}

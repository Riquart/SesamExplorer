import { MetadataRoute } from 'next';

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'SESAM Explorer',
        short_name: 'SESAM Exp',
        description: 'Analyse des données de télétransmission SESAM-Vitale',
        start_url: '/',
        display: 'standalone',
        background_color: '#f9fafb',
        theme_color: '#4f46e5',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}

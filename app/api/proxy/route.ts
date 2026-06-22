import { NextResponse } from 'next/server';

const SESAM_API_URL = 'https://www.sesam-vitale.fr/en/web/sesam-vitale/parts-de-teletransmission?p_p_id=fr_sesamvitale_portail_chiffrespdm_web_portlet_chiffresPDMPortlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=%2Fchiffrespdm%2FgetJsonResponse&p_p_cacheability=cacheLevelPage';

export async function POST() {
    try {
        const response = await fetch(SESAM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                // 'Origin': 'https://www.sesam-vitale.fr', // Sometimes needed, but server-side fetches often bypass this check or don't set it.
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Upstream error: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

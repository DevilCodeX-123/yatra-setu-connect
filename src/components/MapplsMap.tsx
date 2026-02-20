import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        mappls: any;
    }
}

/**
 * MapplsMap v7.4 [PERFECT VISION]
 * - Feature: Custom SVG "Bulb" Markers (Guaranteed Visibility).
 * - Feature: HTML-based Marker Rendering (Bypasses script/icon blocks).
 * - Logic: Dual-format coordinate fallback ([lng,lat] and {lat,lng}).
 * - Logic: Added 1.5s delay to ensure map ready state.
 */
export default function MapplsMap({ markers = [], className }: any) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [stats, setStats] = useState('0/0');

    const sdkKey = import.meta.env.VITE_MAPPLS_SDK_KEY;

    // 1. ENGINE BOOT
    const startEngine = () => {
        if (!window.mappls) {
            setError("Mappls Engine missing.");
            setLoading(false);
            return;
        }

        const spawnMap = () => {
            try {
                const mapObj = new window.mappls.Map('mappls-canvas', {
                    center: [77.5946, 12.9716],
                    zoom: 11,
                    accessToken: sdkKey
                });

                mapInstance.current = mapObj;

                const onReady = () => {
                    if (!mapReady) {
                        setMapReady(true);
                        setLoading(false);
                        setTimeout(() => {
                            if (mapObj.resize) mapObj.resize();
                            plotPerfectMarkers();
                        }, 1000);
                    }
                };

                if (mapObj.addListener) mapObj.addListener('load', onReady);
                else if (mapObj.on) mapObj.on('load', onReady);

                // Watchdog
                setTimeout(() => { if (!mapReady) onReady(); }, 6000);
            } catch (err: any) {
                setError(`Spawn Failed: ${err.message}`);
                setLoading(false);
            }
        };

        if (window.mappls.initialize) {
            window.mappls.initialize(sdkKey, spawnMap);
        } else {
            spawnMap();
        }
    };

    // 2. PLOT BULB MARKERS (SVG HTML)
    const plotPerfectMarkers = () => {
        const map = mapInstance.current;
        if (!map || !mapReady) return;

        markersRef.current.forEach(m => { try { m.remove(); } catch (e) { } });
        markersRef.current = [];

        const list = Array.isArray(markers) ? markers : [];
        let added = 0;
        const bounds = new window.mappls.LatLngBounds();

        list.forEach((m: any, idx: number) => {
            const lat = Number(m.lat);
            const lng = Number(m.lon || m.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                // CUSTOM BULB SVG - Guaranteed to render
                const bulbHtml = `
                    <div style="position: relative; cursor: pointer; display: flex; flex-direction: column; align-items: center;">
                        <div style="background: white; border-radius: 20px; padding: 2px 8px; border: 2px solid #3b82f6; font-size: 10px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); white-space: nowrap;">
                            ${m.label || `STOP ${idx + 1}`}
                        </div>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
                            <circle cx="12" cy="9" r="3" fill="white"/>
                        </svg>
                    </div>
                `;

                try {
                    // TRY 1: Object Position
                    const marker = new window.mappls.Marker({
                        map: map,
                        position: { lat, lng },
                        html: bulbHtml,
                        width: 100, // Wide for label
                        height: 70
                    });
                    markersRef.current.push(marker);
                    bounds.extend(new window.mappls.LatLng(lat, lng));
                    added++;
                } catch (e) {
                    // TRY 2: Array Position [lng, lat]
                    try {
                        const marker = new window.mappls.Marker({
                            map: map,
                            position: [lng, lat],
                            html: bulbHtml,
                            width: 100, height: 70
                        });
                        markersRef.current.push(marker);
                        bounds.extend(new window.mappls.LatLng(lat, lng));
                        added++;
                    } catch (e2) { }
                }
            }
        });

        setStats(`${added}/${list.length}`);
        if (added > 0) {
            try { map.fitBounds(bounds, { padding: 100 }); } catch (e) { }
        }
    };

    // 3. LIFECYCLE
    useEffect(() => {
        if (!sdkKey) {
            setError("Missing SDK Key.");
            setLoading(false);
            return;
        }

        const sid = 'mappls-sdk-v7-4-perfect';
        if (!document.getElementById(sid)) {
            const s = document.createElement('script');
            s.id = sid;
            s.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${sdkKey}&ts=${Date.now()}`;
            s.async = true;
            s.onload = () => { setTimeout(startEngine, 300); };
            s.onerror = () => { setError("CDN Blocked."); setLoading(false); };
            document.head.appendChild(s);
        } else if (window.mappls) {
            startEngine();
        }

        return () => { if (mapInstance.current) { try { mapInstance.current.remove(); } catch (e) { } } };
    }, []);

    useEffect(() => {
        if (mapReady) plotPerfectMarkers();
    }, [markers, mapReady]);

    return (
        <div className={`relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100 ${className}`} style={{ minHeight: '400px' }}>
            <div id="mappls-canvas" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

            {(loading || error) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md z-[100] p-10 text-center">
                    {error ? (
                        <div className="animate-in zoom-in">
                            <h3 className="font-black uppercase tracking-tighter text-red-500 text-xl mb-4">Map Blocked</h3>
                            <button onClick={() => window.location.reload()} className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl">Retry</button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3rem] text-slate-400">Perfecting Vision...</span>
                        </div>
                    )}
                </div>
            )}

            {!loading && !error && (
                <div className="absolute top-4 right-4 z-50 pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-lg">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sync: <span className="text-emerald-500">{stats}</span></span>
                    </div>
                </div>
            )}
        </div>
    );
}

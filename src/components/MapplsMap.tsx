import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        mappls: any;
    }
}

/**
 * MapplsMap v5.1 [THE SCAN]
 * - Fixed: Coordinate format standardized to [lng, lat] for Mapbox-core compatibility.
 * - Added: Auto-retry for tile loading.
 * - Added: Granular coordinate telemetry.
 */
export default function MapplsMap({ markers = [], routePoints, className }: any) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const directionRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [diag, setDiag] = useState({
        tiles: 'Offline',
        analysis: 'Idle',
        stats: '0/0 Pts',
        center: '0, 0'
    });

    const sdkKey = import.meta.env.VITE_MAPPLS_SDK_KEY;

    // 1. ENGINE BOOT (Standard [lng, lat])
    const startEngine = () => {
        if (!window.mappls || !window.mappls.Map) {
            setError("Mappls Engine missing.");
            setLoading(false);
            return;
        }

        try {
            if (!mapRef.current || mapRef.current.clientWidth === 0) {
                setTimeout(startEngine, 800);
                return;
            }

            // CRITICAL FIX: Mappls v3 uses [lng, lat] for center
            const mapObj = new window.mappls.Map(mapRef.current, {
                center: [77.5946, 12.9716], // Bengaluru [lng, lat]
                zoom: 11,
                accessToken: sdkKey,
            });

            mapInstance.current = mapObj;

            const onReady = () => {
                if (!mapReady) {
                    setMapReady(true);
                    setLoading(false);
                    setDiag(prev => ({ ...prev, tiles: 'Online' }));

                    // Recursive resize to ensure tiles snap into place
                    [100, 500, 1500, 4000].forEach(ms => {
                        setTimeout(() => {
                            if (mapObj.resize) mapObj.resize();
                            const c = mapObj.getCenter();
                            if (c) setDiag(prev => ({ ...prev, center: `${c.lng.toFixed(2)}, ${c.lat.toFixed(2)}` }));
                        }, ms);
                    });

                    plotData();
                }
            };

            if (mapObj.addListener) mapObj.addListener('load', onReady);
            else if (mapObj.on) mapObj.on('load', onReady);

            // Fallback for missing load event
            setTimeout(() => { if (!mapReady) onReady(); }, 5000);

        } catch (err: any) {
            setError(`Init Fault: ${err.message}`);
            setLoading(false);
        }
    };

    // 2. DATA PLOTTING (Hyper-Stable)
    const plotData = () => {
        const map = mapInstance.current;
        if (!map || !mapReady) return;

        // Cleanup
        markersRef.current.forEach(m => { try { if (m.remove) m.remove(); } catch (e) { } });
        markersRef.current = [];
        if (directionRef.current) { try { if (directionRef.current.remove) directionRef.current.remove(); } catch (e) { } }

        const markerList = Array.isArray(markers) ? markers : [];
        if (markerList.length === 0) {
            setDiag(prev => ({ ...prev, analysis: 'Idle', stats: '0 Pts' }));
            return;
        }

        const bounds = new window.mappls.LatLngBounds();
        let added = 0;

        // Stage 1: Markers
        markerList.forEach((m: any) => {
            const lat = parseFloat(m.lat);
            const lng = parseFloat(m.lon || m.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                try {
                    const pos = new window.mappls.LatLng(lat, lng);
                    const marker = new window.mappls.Marker({
                        map: map,
                        position: pos,
                        icon_url: 'https://maps.mappls.com/images/2.png',
                        width: 25, height: 40,
                        label: m.label || ''
                    });
                    markersRef.current.push(marker);
                    bounds.extend(pos);
                    added++;
                } catch (e) { }
            }
        });

        setDiag(prev => ({ ...prev, stats: `${added}/${markerList.length} Pts` }));

        // Zoom Fix
        if (added > 1) {
            try {
                map.fitBounds(bounds, { padding: 80 });
            } catch (e) {
                map.setCenter(bounds.getCenter());
            }
        } else if (added === 1) {
            map.setCenter(markersRef.current[0].getPosition());
            map.setZoom(13);
        }

        // Stage 2: Background Direction
        if (added >= 2 && window.mappls.direction) {
            setDiag(prev => ({ ...prev, analysis: 'Analyzing...' }));
            setTimeout(() => {
                try {
                    const coords = markerList.map((m: any) => `${m.lat},${m.lon || m.lng}`);
                    const start = coords[0];
                    const end = coords[coords.length - 1];
                    const waypoints = coords.slice(1, -1).join(';') || undefined;

                    directionRef.current = new window.mappls.direction({
                        map: map,
                        start, end, waypoints,
                        resource: 'driving',
                        fitbounds: false,
                        strokeColor: '#3b82f6',
                        strokeWeight: 10,
                        start_icon: { url: ' ', width: 0, height: 0 },
                        end_icon: { url: ' ', width: 0, height: 0 }
                    });
                    setDiag(prev => ({ ...prev, analysis: 'Active' }));
                } catch (e) {
                    setDiag(prev => ({ ...prev, analysis: 'Markers Only' }));
                }
            }, 800);
        }
    };

    // 3. LIFECYCLE
    useEffect(() => {
        if (!sdkKey) {
            setError("API Key Missing");
            return;
        }

        const sid = 'mappls-sdk-v5-1-scan';
        if (!document.getElementById(sid)) {
            const s = document.createElement('script');
            s.id = sid;
            s.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${sdkKey}&plugins=direction`;
            s.async = true;
            s.onload = () => setTimeout(startEngine, 500);
            s.onerror = () => { setError("Network Error"); setLoading(false); };
            document.head.appendChild(s);
        } else if (window.mappls) {
            startEngine();
        }

        return () => { if (mapInstance.current) mapInstance.current.remove(); };
    }, []);

    useEffect(() => {
        if (mapReady) {
            const t = setTimeout(plotData, 500);
            return () => clearTimeout(t);
        }
    }, [markers, mapReady]);

    return (
        <div className={`relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-200 ${className}`} style={{ minHeight: '400px' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md z-[100] p-10 text-center">
                    <div className="w-14 h-14 border-[6px] border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-6" />
                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-800 italic">Master Engine Scan...</span>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md z-[100] p-10 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-xl font-black italic">!</div>
                    <h3 className="font-black uppercase tracking-tighter text-slate-800 text-xl mb-2">Technical Block</h3>
                    <p className="text-xs text-slate-500 mb-6 font-bold uppercase">{error}</p>
                    <button onClick={() => window.location.reload()} className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl">Force Reboot</button>
                </div>
            )}

            {!loading && !error && (
                <div className="absolute top-6 left-6 pointer-events-none z-50">
                    <div className="bg-white/98 backdrop-blur-xl px-6 py-4 rounded-[2rem] shadow-2xl border border-white/50">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                                <span className="text-[10px] font-black text-slate-800 uppercase italic tracking-wider">The Scan v5.1</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Engine</span>
                                <span className="text-[8px] font-black text-slate-800 uppercase text-right">{diag.tiles}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Center</span>
                                <span className="text-[8px] font-black text-slate-800 uppercase text-right">{diag.center}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Points</span>
                                <span className="text-[8px] font-black text-slate-800 uppercase text-right">{diag.stats}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                                <span className="text-[8px] font-black text-primary uppercase text-right italic">{diag.analysis}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

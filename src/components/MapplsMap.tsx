import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        mappls: any;
    }
}

/**
 * MapplsMap - Road-following route with premium markers.
 * - Custom pulsing markers for each stop.
 * - Road-following route via Mappls Direction API.
 * - Polyline fallback if Direction API is unavailable.
 * - Manual center/zoom calculation for reliability.
 */
interface MapplsMapProps {
    markers?: any[];
    routePoints?: string;
    className?: string;
}

export default function MapplsMap({ markers = [], routePoints, className }: MapplsMapProps) {
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const routeLayerRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);

    const sdkKey = import.meta.env.VITE_MAPPLS_SDK_KEY;

    // ===== 1. INITIALIZE MAP =====
    const initMap = () => {
        if (!window.mappls) {
            setError("Mappls SDK not loaded.");
            setLoading(false);
            return;
        }

        const createMap = () => {
            try {
                const mapObj = new window.mappls.Map('mappls-map-container', {
                    center: [12.9716, 77.5946], // Bengaluru [lat, lng]
                    zoom: 10,
                    zoomControl: true,
                    search: false,
                });

                mapInstance.current = mapObj;

                const onMapReady = () => {
                    if (!mapReady) {
                        setMapReady(true);
                        setLoading(false);
                        console.log("Mappls: Map Ready");
                        // Small delay to let the map fully render before adding overlays
                        setTimeout(() => {
                            if (mapObj.resize) mapObj.resize();
                            drawAll();
                        }, 800);
                    }
                };

                // Listen for map load event
                if (mapObj.addListener) mapObj.addListener('load', onMapReady);
                else if (mapObj.on) mapObj.on('load', onMapReady);

                // Safety fallback if event never fires
                setTimeout(() => {
                    if (!mapReady) onMapReady();
                }, 5000);

            } catch (err: any) {
                setError(`Map creation failed: ${err.message}`);
                setLoading(false);
            }
        };

        if (window.mappls.initialize) {
            window.mappls.initialize(sdkKey, createMap);
        } else {
            createMap();
        }
    };

    // ===== 2. DRAW ALL (markers + route) =====
    const drawAll = () => {
        const map = mapInstance.current;
        if (!map || !mapReady) return;

        clearAll();
        addMarkers();
        addRoute();
    };

    // ===== 3. CLEAR ALL OVERLAYS =====
    const clearAll = () => {
        // Clear markers
        markersRef.current.forEach(m => {
            try { if (m.remove) m.remove(); } catch (e) { }
        });
        markersRef.current = [];

        // Clear route
        if (routeLayerRef.current) {
            try {
                if (routeLayerRef.current.remove) routeLayerRef.current.remove();
            } catch (e) { }
            routeLayerRef.current = null;
        }

        // Clear polyline
        if (polylineRef.current) {
            try {
                if (polylineRef.current.remove) polylineRef.current.remove();
            } catch (e) { }
            polylineRef.current = null;
        }
    };

    // ===== 4. ADD MARKERS =====
    const addMarkers = () => {
        const map = mapInstance.current;
        if (!map) return;

        const list = Array.isArray(markers) ? markers : [];
        if (list.length === 0) return;

        const validPoints: { lat: number; lng: number }[] = [];

        list.forEach((m: any, idx: number) => {
            const lat = Number(m.lat);
            const lng = Number(m.lon || m.lng);

            if (isNaN(lat) || isNaN(lng)) return;

            validPoints.push({ lat, lng });

            // Premium Pulsing Marker HTML
            const markerHTML = `
                <style>
                    @keyframes mPulse { 
                        0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(59,130,246,0.7); }
                        70% { transform: scale(1.0); box-shadow: 0 0 0 12px rgba(59,130,246,0); }
                        100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
                    }
                </style>
                <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
                    <div style="background:#1e3a8a;color:#fff;border-radius:10px;padding:4px 10px;font-size:11px;font-weight:800;margin-bottom:6px;box-shadow:0 4px 12px rgba(0,0,0,0.3);white-space:nowrap;border:1px solid rgba(255,255,255,0.2);">
                        ${m.label || `Stop ${idx + 1}`}
                    </div>
                    <div style="width:18px;height:18px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.3);animation:mPulse 2s infinite;"></div>
                </div>
            `;

            try {
                const marker = new window.mappls.Marker({
                    map: map,
                    position: { lat, lng },
                    html: markerHTML,
                    fitbounds: false,
                    width: 150,
                    height: 60,
                    offset: [0, -30],
                });
                markersRef.current.push(marker);
            } catch (e) {
                console.warn(`Mappls: Failed to add marker ${idx}`, e);
            }
        });

        // ===== CENTER MAP on markers =====
        if (validPoints.length > 0) {
            centerMapOnPoints(validPoints);
        }
    };

    // ===== 5. CENTER MAP ON POINTS =====
    const centerMapOnPoints = (points: { lat: number; lng: number }[]) => {
        const map = mapInstance.current;
        if (!map || points.length === 0) return;

        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);

        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

        const latSpread = Math.max(...lats) - Math.min(...lats);
        const lngSpread = Math.max(...lngs) - Math.min(...lngs);
        const maxSpread = Math.max(latSpread, lngSpread);

        // Calculate optimal zoom based on the geographic spread
        let zoom = 12;
        if (maxSpread > 5) zoom = 6;
        else if (maxSpread > 3) zoom = 7;
        else if (maxSpread > 1.5) zoom = 8;
        else if (maxSpread > 0.8) zoom = 9;
        else if (maxSpread > 0.3) zoom = 10;
        else if (maxSpread > 0.1) zoom = 11;
        else zoom = 13;

        console.log(`Mappls: Centering map at [${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}] zoom=${zoom} (spread=${maxSpread.toFixed(3)})`);

        try {
            map.setCenter({ lat: avgLat, lng: avgLng });
            map.setZoom(zoom);
        } catch (e) {
            console.warn("Mappls: setCenter/setZoom failed, trying LatLng format", e);
            try {
                map.setCenter(new window.mappls.LatLng(avgLat, avgLng));
                map.setZoom(zoom);
            } catch (e2) {
                console.error("Mappls: Could not center map", e2);
            }
        }
    };

    // ===== 6. ADD ROUTE =====
    const addRoute = () => {
        const map = mapInstance.current;
        if (!map || !routePoints || !routePoints.includes(',')) return;

        const ptsArray = routePoints.split(';');
        if (ptsArray.length < 2) return;

        // Parse to LatLng objects
        const routeLatLngs = ptsArray.map(p => {
            const [lng, lat] = p.split(',').map(Number);
            return { lat, lng };
        }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

        if (routeLatLngs.length < 2) return;

        console.log("Mappls: Drawing route with", routeLatLngs.length, "points");

        // ALWAYS draw a polyline first so there's a visible route immediately
        drawPolyline(routeLatLngs);

        // Then TRY the Direction API for road-following route (it will overlay the polyline)
        if (window.mappls && window.mappls.direction) {
            try {
                window.mappls.direction({
                    map: map,
                    path: routePoints, // "lng,lat;lng,lat" format
                    strokeColor: "#2563eb",
                    strokeWeight: 7,
                    strokeOpacity: 0.9,
                    fitBounds: false,
                    routeFullColor: "#2563eb",
                    start_icon: { url: ' ', width: 1, height: 1 },
                    end_icon: { url: ' ', width: 1, height: 1 },
                    via_icon: { url: ' ', width: 1, height: 1 },
                }, (layer: any) => {
                    if (layer) {
                        console.log("Mappls: Direction API route drawn (road-following)");
                        routeLayerRef.current = layer;
                        // Remove the polyline since we have the better road-following route
                        if (polylineRef.current) {
                            try { polylineRef.current.remove(); } catch (e) { }
                            polylineRef.current = null;
                        }
                    }
                });
            } catch (e) {
                console.warn("Mappls: Direction API failed, keeping polyline", e);
            }
        }
    };

    // ===== 7. DRAW POLYLINE =====
    const drawPolyline = (points: { lat: number; lng: number }[]) => {
        const map = mapInstance.current;
        if (!map || points.length < 2) return;

        try {
            const path = points.map(p => new window.mappls.LatLng(p.lat, p.lng));
            const poly = new window.mappls.Polyline({
                map: map,
                path: path,
                strokeColor: '#3b82f6',
                strokeWeight: 6,
                strokeOpacity: 0.7,
                fitBounds: false,
                dasharray: [10, 5], // Dashed line to distinguish from road-following route
            });
            polylineRef.current = poly;
            console.log("Mappls: Polyline drawn");
        } catch (e) {
            console.warn("Mappls: Polyline draw failed", e);
        }
    };

    // ===== LIFECYCLE: Load SDK =====
    useEffect(() => {
        if (!sdkKey) {
            setError("Missing VITE_MAPPLS_SDK_KEY in .env");
            setLoading(false);
            return;
        }

        const scriptId = 'mappls-sdk-script';
        if (!document.getElementById(scriptId)) {
            const s = document.createElement('script');
            s.id = scriptId;
            s.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${sdkKey}&plugins=direction`;
            s.async = true;
            s.onload = () => {
                console.log("Mappls: SDK script loaded");
                setTimeout(initMap, 500);
            };
            s.onerror = () => {
                setError("Failed to load Mappls SDK. Check your internet connection.");
                setLoading(false);
            };
            document.head.appendChild(s);
        } else if (window.mappls) {
            initMap();
        }

        return () => {
            if (mapInstance.current) {
                try { mapInstance.current.remove(); } catch (e) { }
            }
        };
    }, []);

    // ===== LIFECYCLE: Re-draw on data change =====
    useEffect(() => {
        if (mapReady) {
            drawAll();
        }
    }, [markers, routePoints, mapReady]);

    return (
        <div className={`relative w-full h-full overflow-hidden bg-slate-100 ${className}`} style={{ minHeight: '350px' }}>
            <div id="mappls-map-container" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

            {(loading || error) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md z-[100] p-10 text-center">
                    {error ? (
                        <div>
                            <h3 className="font-black uppercase tracking-tighter text-red-500 text-lg mb-2">Map Error</h3>
                            <p className="text-xs text-slate-500 mb-4">{error}</p>
                            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white text-xs font-bold uppercase rounded-xl">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Map...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

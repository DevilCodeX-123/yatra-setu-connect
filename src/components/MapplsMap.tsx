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
    busLocation?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    className?: string;
}

export default function MapplsMap({ markers = [], routePoints, busLocation, userLocation, className }: MapplsMapProps) {
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const busMarkerRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const routeLayerRef = useRef<any>(null);
    const polylineRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);

    // Follow Mode State
    const [isFollowing, setIsFollowing] = useState(true);

    // State to store the full decoded path for trimming
    const [fullDecodedPath, setFullDecodedPath] = useState<{ lat: number; lng: number }[]>([]);

    const sdkKey = import.meta.env.VITE_MAPPLS_SDK_KEY;

    // ===== 1. INITIALIZE MAP =====
    const initMap = (retryCount = 0) => {
        console.log(`Mappls: Initializing map (attempt ${retryCount + 1})...`);

        if (!window.mappls) {
            if (retryCount < 8) {
                console.log("Mappls: SDK not found yet, retrying in 500ms...");
                setTimeout(() => initMap(retryCount + 1), 500);
                return;
            }
            setError("Mappls SDK failed to load. Please check your internet connection.");
            setLoading(false);
            return;
        }

        const createMap = () => {
            try {
                const container = document.getElementById('mappls-map-container');
                if (!container) {
                    console.error("Mappls: Map container div not found!");
                    return;
                }

                console.log("Mappls: Creating map instance...");
                const mapObj = new window.mappls.Map('mappls-map-container', {
                    center: [12.9716, 77.5946], // Bengaluru
                    zoom: 10,
                    zoomControl: true,
                    search: false,
                });

                mapInstance.current = mapObj;

                // DETECT MANUAL INTERACTION to pause Follow Mode
                const stopFollowing = () => {
                    setIsFollowing(false);
                    console.log("Mappls: Manual interaction detected, pausing Follow Mode");
                };

                mapObj.on('dragstart', stopFollowing);
                mapObj.on('zoomstart', stopFollowing);

                const onMapReady = () => {
                    if (!mapReady) {
                        setMapReady(true);
                        setLoading(false);
                        console.log("Mappls: Map Ready & Fully Rendered");
                        setTimeout(() => {
                            if (mapObj.resize) mapObj.resize();
                            drawStatic();
                            drawDynamic();
                        }, 500);
                    }
                };

                if (mapObj.addListener) mapObj.addListener('load', onMapReady);
                if (mapObj.on) mapObj.on('load', onMapReady);

                setTimeout(() => {
                    if (!mapReady) {
                        console.log("Mappls: Load event timed out, forcing ready state");
                        onMapReady();
                    }
                }, 4000);

            } catch (err: any) {
                console.error("Mappls: Map creation error:", err);
                setError(`Map setup failed: ${err.message}`);
                setLoading(false);
            }
        };

        if (window.mappls.initialize) {
            try {
                window.mappls.initialize(sdkKey, createMap);
            } catch (err) {
                console.warn("Mappls: initialize call failed, trying direct creation", err);
                createMap();
            }
        } else {
            createMap();
        }
    };

    // ===== 2. DRAWING LOGIC =====

    // Initial draw for static elements (stops, road geometry)
    const drawStatic = () => {
        const map = mapInstance.current;
        if (!map || !mapReady) return;

        console.log("Mappls: Drawing static overlays (stops, route)...");

        // Only clear markers and initial route
        markersRef.current.forEach(m => { try { if (m.remove) m.remove(); } catch (e) { } });
        markersRef.current = [];

        if (polylineRef.current) { try { if (polylineRef.current.remove) polylineRef.current.remove(); } catch (e) { } polylineRef.current = null; }
        if (routeLayerRef.current) { try { if (routeLayerRef.current.remove) routeLayerRef.current.remove(); } catch (e) { } routeLayerRef.current = null; }

        addMarkers();
        addRoute();
    };

    // Update for dynamic elements (bus, user, trimming)
    const drawDynamic = () => {
        const map = mapInstance.current;
        if (!map || !mapReady) return;

        console.log("Mappls: Updating dynamic overlays...");
        updateBusMarker();
        updateUserMarker();
    };

    // Helper to find index of closest point in the path to the bus
    const getClosestPathIndex = (busPos: { lat: number, lng: number }, path: { lat: number, lng: number }[]) => {
        let minIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < path.length; i++) {
            const dx = busPos.lat - path[i].lat;
            const dy = busPos.lng - path[i].lng;
            const d = dx * dx + dy * dy;
            if (d < minDist) {
                minDist = d;
                minIdx = i;
            }
        }
        return minIdx;
    };

    // ===== 3. CLEAR ALL OVERLAYS =====
    const clearAll = () => {
        // Clear markers
        markersRef.current.forEach(m => {
            try { if (m.remove) m.remove(); } catch (e) { }
        });
        markersRef.current = [];

        // Clear bus marker
        if (busMarkerRef.current) {
            try { if (busMarkerRef.current.remove) busMarkerRef.current.remove(); } catch (e) { }
            busMarkerRef.current = null;
        }

        // Clear user marker
        if (userMarkerRef.current) {
            try { if (userMarkerRef.current.remove) userMarkerRef.current.remove(); } catch (e) { }
            userMarkerRef.current = null;
        }

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

    // ===== 5. UPDATE BUS MARKER =====
    const updateBusMarker = () => {
        const map = mapInstance.current;
        if (!map || !busLocation) return;

        const { lat, lng } = busLocation;
        if (isNaN(lat) || isNaN(lng)) return;

        // Dynamic Path Trimming Logic
        if (fullDecodedPath.length > 0) {
            const startIdx = getClosestPathIndex({ lat, lng }, fullDecodedPath);
            const remainingPath = fullDecodedPath.slice(startIdx);

            if (remainingPath.length >= 2) {
                const path = remainingPath.map(p => new window.mappls.LatLng(p.lat, p.lng));

                // OPTIMIZATION: Update existing path instead of clearing/redrawing
                if (routeLayerRef.current) {
                    try {
                        if (routeLayerRef.current.setPath) {
                            routeLayerRef.current.setPath(path);
                        } else {
                            // Fallback if setPath is missing in this version
                            routeLayerRef.current.remove();
                            routeLayerRef.current = new window.mappls.Polyline({
                                map: map,
                                path: path,
                                strokeColor: '#2563eb',
                                strokeWeight: 7,
                                strokeOpacity: 0.9,
                                fitBounds: false
                            });
                        }
                    } catch (e) {
                        console.warn("Mappls: setPath failed, redrawing.", e);
                    }
                } else {
                    // Initial creation
                    const trimmedPoly = new window.mappls.Polyline({
                        map: map,
                        path: path,
                        strokeColor: '#2563eb',
                        strokeWeight: 7,
                        strokeOpacity: 0.9,
                        fitBounds: false
                    });
                    routeLayerRef.current = trimmedPoly;
                }
            }
        }

        const busMarkerHTML = `
            <style>
                @keyframes busPulse {
                    0% { transform: scale(1) rotate(45deg); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
                    50% { transform: scale(1.1) rotate(45deg); box-shadow: 0 0 0 20px rgba(16,185,129,0); }
                    100% { transform: scale(1) rotate(45deg); box-shadow: 0 0 0 0 rgba(16,185,129,0); }
                }
            </style>
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
                <div style="background:#059669;color:#fff;border-radius:12px;padding:4px 12px;font-size:10px;font-weight:900;margin-bottom:8px;box-shadow:0 8px 16px rgba(0,0,0,0.3);text-transform:uppercase;letter-spacing:1px;border:1.5px solid rgba(255,255,255,0.4);white-space:nowrap;backdrop-blur:md;">
                    MAIN BUS
                </div>
                <div style="width:44px;height:44px;background:#10b981;border:4px solid #fff;border-radius:16px;box-shadow:0 10px 25px rgba(16,185,129,0.6);display:flex;align-items:center;justify-content:center;animation:busPulse 2s infinite ease-in-out;">
                    <svg viewBox="0 0 24 24" width="28" height="28" stroke="white" stroke-width="3" fill="none" style="transform:rotate(-45deg);">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h10"></path>
                        <circle cx="7" cy="17" r="2" fill="white"></circle>
                        <circle cx="17" cy="17" r="2" fill="white"></circle>
                    </svg>
                </div>
            </div>
        `;

        try {
            if (busMarkerRef.current) {
                busMarkerRef.current.setPosition({ lat, lng });
                // Auto-center as the bus moves (smoothly) ONLY IF in Follow Mode
                if (isFollowing) {
                    map.setCenter({ lat, lng });
                }
            } else {
                busMarkerRef.current = new window.mappls.Marker({
                    map: map,
                    position: { lat, lng },
                    html: busMarkerHTML,
                    width: 80,
                    height: 80,
                    offset: [0, -30]
                });
                // Initial center on bus
                map.setCenter({ lat, lng });
                map.setZoom(14);
            }
        } catch (e) {
            console.warn("Mappls: Failed to update bus marker", e);
        }
    };

    // ===== 6. UPDATE USER MARKER =====
    const updateUserMarker = () => {
        const map = mapInstance.current;
        if (!map || !userLocation) {
            if (userMarkerRef.current) {
                userMarkerRef.current.remove();
                userMarkerRef.current = null;
            }
            return;
        }

        const { lat, lng } = userLocation;
        if (isNaN(lat) || isNaN(lng)) return;

        const userMarkerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
                <div style="width:20px;height:20px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.6);position:relative;">
                    <div style="position:absolute;inset:-10px;background:rgba(59,130,246,0.2);border-radius:50%;animation:mPulse 2s infinite;"></div>
                </div>
                <div style="background:#3b82f6;color:#fff;border-radius:4px;padding:1px 4px;font-size:7px;font-weight:900;margin-top:2px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-transform:uppercase;">
                    YOU
                </div>
            </div>
        `;

        try {
            if (userMarkerRef.current) {
                userMarkerRef.current.setPosition({ lat, lng });
            } else {
                userMarkerRef.current = new window.mappls.Marker({
                    map: map,
                    position: { lat, lng },
                    html: userMarkerHTML,
                    width: 40,
                    height: 40,
                    offset: [0, 0]
                });
            }
        } catch (e) {
            console.warn("Mappls: Failed to update user marker", e);
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
    const addRoute = async () => {
        const map = mapInstance.current;
        if (!map || !routePoints || !routePoints.includes(',')) {
            return;
        }

        const ptsArray = routePoints.split(';');
        if (ptsArray.length < 2) return;

        // Parse to LatLng objects for polyline fallback
        const routeLatLngs = ptsArray.map(p => {
            const [lng, lat] = p.split(',').map(Number);
            return { lat, lng };
        }).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

        if (routeLatLngs.length < 2) return;

        console.log("Mappls: Initializing route with", routeLatLngs.length, "points");

        // ALWAYS draw a polyline first so there's a visible route immediately
        drawPolyline(routeLatLngs, '#3b82f6', 4, [10, 5]);

        // Then FETCH PRECISE ROAD DATA from backend
        try {
            console.log("Mappls: Fetching road geometry from backend...");
            const response = await fetch(`/api/maps/route?pts=${encodeURIComponent(routePoints)}`);
            const data = await response.json();

            if (data.routes && data.routes[0] && data.routes[0].geometry) {
                console.log("Mappls: Precise road geometry received from backend. Rendering...");
                drawRoadRoute(data.routes[0].geometry);
                return; // SUCCESS - skip plugin
            } else {
                console.warn("Mappls: Backend Route API did not return geometry, calling SDK plugin fallback");
            }
        } catch (error) {
            console.error("Mappls: Failed to fetch precise road route:", error);
        }

        // FALLBACK: Use Mappls Direction Plugin
        if (window.mappls) {
            console.log("Mappls: Plugin Status Check:", {
                mappls: !!window.mappls,
                direction: !!window.mappls.direction,
                Direction: !!window.mappls.Direction,
            });

            const directionPlugin = window.mappls.direction || window.mappls.Direction;

            if (directionPlugin) {
                try {
                    window.mappls.direction({
                        map: map,
                        path: routePoints,
                        resource: 'route_adv',
                        strokeColor: "#2563eb",
                        strokeWeight: 7,
                        strokeOpacity: 0.9,
                        fitBounds: false,
                        routeFullColor: "#2563eb",
                        start_icon: { url: '', width: 1, height: 1 },
                        end_icon: { url: '', width: 1, height: 1 },
                        via_icon: { url: '', width: 1, height: 1 },
                    }, (res: any) => {
                        if (res && (res.status === 'success' || res.length > 0)) {
                            console.log("Mappls: Direction Plugin success");
                            if (polylineRef.current) polylineRef.current.remove();
                        }
                    });
                } catch (e) {
                    console.error("Mappls: Direction plugin call failed:", e);
                }
            } else {
                console.warn("Mappls: Directions plugin not found in window.mappls");
            }
        }
    };

    // Standard Google Polyline Decoder
    const decodePolyline = (str: string, precision = 5) => {
        let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latIn, lngIn, factor = Math.pow(10, precision);
        while (index < str.length) {
            byte = null; shift = 0; result = 0;
            do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
            latIn = ((result & 1) ? ~(result >> 1) : (result >> 1));
            shift = 0; result = 0;
            do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
            lngIn = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += latIn; lng += lngIn;
            coordinates.push({ lat: lat / factor, lng: lng / factor });
        }
        return coordinates;
    };

    // Draw high quality road route from geometry
    const drawRoadRoute = (encodedGeometry: string) => {
        const map = mapInstance.current;
        if (!map || !window.mappls) return;

        try {
            console.log("Mappls: Decoding geometry...");
            // OSRM polyline6 is precision 6
            let pts = decodePolyline(encodedGeometry, 6);

            // Safety check: if decoding failed (e.g., wrong precision), try 5
            if (pts.length < 5 || Math.abs(pts[0].lat) > 90) {
                console.log("Mappls: Refined decoding with precision 5");
                pts = decodePolyline(encodedGeometry, 5);
            }

            if (pts.length > 0) {
                setFullDecodedPath(pts); // STORE for trimming

                // Remove previous layers
                if (polylineRef.current) {
                    try { polylineRef.current.remove(); } catch (e) { }
                    polylineRef.current = null;
                }
                if (routeLayerRef.current) {
                    try { routeLayerRef.current.remove(); } catch (e) { }
                    routeLayerRef.current = null;
                }

                // Initial draw (full or starting from bus)
                let renderPts = pts;
                if (busLocation) {
                    const startIdx = getClosestPathIndex(busLocation, pts);
                    renderPts = pts.slice(startIdx);
                }

                const path = renderPts.map(p => new window.mappls.LatLng(p.lat, p.lng));
                const roadPoly = new window.mappls.Polyline({
                    map: map,
                    path: path,
                    strokeColor: '#2563eb',
                    strokeWeight: 7,
                    strokeOpacity: 0.9,
                    fitBounds: false
                });
                routeLayerRef.current = roadPoly;
                console.log(`Mappls: Initial road route rendered (${renderPts.length} pts)`);
            }
        } catch (e) {
            console.warn("Mappls: Failed to draw road route from geometry", e);
        }
    };

    // ===== 7. DRAW POLYLINE =====
    const drawPolyline = (points: { lat: number; lng: number }[], color = '#3b82f6', weight = 6, dash: number[] | null = null) => {
        const map = mapInstance.current;
        if (!map || points.length < 2) return;

        try {
            setFullDecodedPath(points); // Support trimming for fallback too

            let renderPts = points;
            if (busLocation) {
                const startIdx = getClosestPathIndex(busLocation, points);
                renderPts = points.slice(startIdx);
            }

            const path = renderPts.map(p => new window.mappls.LatLng(p.lat, p.lng));
            const poly = new window.mappls.Polyline({
                map: map,
                path: path,
                strokeColor: color,
                strokeWeight: weight,
                strokeOpacity: 0.7,
                fitBounds: false,
                dasharray: dash,
            });
            polylineRef.current = poly;
            console.log("Mappls: Fallback polyline drawn (with trimming support)");
        } catch (e) {
            console.warn("Mappls: Polyline draw failed", e);
        }
    };

    // ===== LIFECYCLE: Load SDK =====
    useEffect(() => {
        if (!sdkKey) {
            setError("Missing VITE_MAPPLS_SDK_KEY");
            setLoading(false);
            return;
        }

        const scriptId = 'mappls-sdk-script';

        // CLEANUP: Remove any existing scripts if they failed
        const existingScript = document.getElementById(scriptId);
        if (existingScript) {
            existingScript.remove();
        }

        const s = document.createElement('script');
        s.id = scriptId;
        // Use v3 (stable) and ensure access_token is first
        s.src = `https://sdk.mappls.com/map/sdk/web?v=3&access_token=${sdkKey}`;
        s.async = true;
        s.onload = () => {
            console.log("Mappls: SDK v3 script loaded successfully");
            setTimeout(() => initMap(0), 1000);
        };
        s.onerror = () => {
            console.error("Mappls: Script load error!");
            setError("Failed to load map engine. Check SDK key or internet.");
            setLoading(false);
        };
        document.head.appendChild(s);

        return () => {
            if (mapInstance.current) {
                try { mapInstance.current.remove(); } catch (e) { }
            }
        };
    }, []);

    // ===== LIFECYCLE: Static Data (Stops, Route Geometry) =====
    useEffect(() => {
        if (mapReady) {
            drawStatic();
        }
    }, [markers, routePoints, mapReady]);

    // ===== LIFECYCLE: Dynamic Data (Bus, User Location) =====
    useEffect(() => {
        if (mapReady) {
            drawDynamic();
        }
    }, [busLocation, userLocation, mapReady]);

    return (
        <div className={`relative w-full h-full overflow-hidden bg-slate-100 ${className}`} style={{ minHeight: '350px' }}>
            <div id="mappls-map-container" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

            {(loading || error) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md z-[100] p-10 text-center">
                    {error ? (
                        <div>
                            <h3 className="font-black text-red-500 text-lg mb-2">Map Error</h3>
                            <p className="text-xs text-slate-500 mb-4">{error}</p>
                            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mb-4" />
                            <span className="text-xs font-bold text-slate-400">Loading Map...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Re-center Button - Visible when manual interaction paused auto-follow */}
            {!isFollowing && mapReady && (
                <button
                    onClick={() => {
                        setIsFollowing(true);
                        if (busLocation && mapInstance.current) {
                            mapInstance.current.setCenter({ lat: busLocation.lat, lng: busLocation.lng });
                            mapInstance.current.setZoom(14);
                        }
                    }}
                    className="absolute top-4 right-4 z-[50] p-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl hover:bg-white transition-all group active:scale-95 animate-in fade-in slide-in-from-top-2 duration-300"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black text-slate-800 tracking-tight uppercase pr-1">Re-center Bus</span>
                    </div>
                </button>
            )}
        </div>
    );
}

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";

let globalSocket: Socket | null = null;

export function useSocket(token?: string | null) {
    const [socket, setSocket] = useState<Socket | null>(globalSocket);
    const [isConnected, setIsConnected] = useState(globalSocket?.connected || false);
    const tokenRef = useRef(token);

    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    useEffect(() => {
        if (!globalSocket || !globalSocket.connected) {
            globalSocket = io(SOCKET_URL, {
                auth: { token: tokenRef.current || "" },
                transports: ["websocket", "polling"],
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });
        }

        const s = globalSocket;
        setSocket(s);
        setIsConnected(s.connected);

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);

        return () => {
            s.off("connect", onConnect);
            s.off("disconnect", onDisconnect);
        };
    }, []);

    const joinBus = useCallback((busNumber: string) => {
        socket?.emit("join:bus", busNumber);
    }, [socket]);

    const joinUser = useCallback((userId: string) => {
        socket?.emit("join:user", userId);
    }, [socket]);

    const sendLocation = useCallback((busNumber: string, lat: number, lng: number, source: string) => {
        socket?.emit("bus:location", { busNumber, lat, lng, source });
    }, [socket]);

    const sendSOS = useCallback((busNumber: string, lat: number, lng: number, userId?: string) => {
        socket?.emit("bus:sos", { busNumber, lat, lng, userId });
    }, [socket]);

    const updateSeat = useCallback((busNumber: string, seatNumber: number, status: string) => {
        socket?.emit("bus:seat-update", { busNumber, seatNumber, status });
    }, [socket]);

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (!socket) return () => { };
        socket.on(event, handler);
        return () => { socket.off(event, handler); };
    }, [socket]);

    const reconnect = useCallback(() => {
        if (socket && !socket.connected) {
            socket.connect();
        } else if (!socket) {
            globalSocket = io(SOCKET_URL, {
                auth: { token: tokenRef.current || '' },
                transports: ['websocket', 'polling'],
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });
            setSocket(globalSocket);
        }
    }, [socket]);

    return { socket, isConnected, joinBus, joinUser, sendLocation, sendSOS, updateSeat, on, reconnect };
}

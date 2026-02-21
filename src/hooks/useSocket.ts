import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let globalSocket: Socket | null = null;

export function useSocket(token?: string | null) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!globalSocket || !globalSocket.connected) {
            globalSocket = io(SOCKET_URL, {
                auth: { token: token || "" },
                transports: ["websocket", "polling"],
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });
        }
        socketRef.current = globalSocket;

        return () => {
            // Don't disconnect on unmount — keep alive for app lifetime
        };
    }, [token]);

    const joinBus = useCallback((busNumber: string) => {
        socketRef.current?.emit("join:bus", busNumber);
    }, []);

    const joinUser = useCallback((userId: string) => {
        socketRef.current?.emit("join:user", userId);
    }, []);

    const sendLocation = useCallback((busNumber: string, lat: number, lng: number, source: string) => {
        socketRef.current?.emit("bus:location", { busNumber, lat, lng, source });
    }, []);

    const sendSOS = useCallback((busNumber: string, lat: number, lng: number, userId?: string) => {
        socketRef.current?.emit("bus:sos", { busNumber, lat, lng, userId });
    }, []);

    const updateSeat = useCallback((busNumber: string, seatNumber: number, status: string) => {
        socketRef.current?.emit("bus:seat-update", { busNumber, seatNumber, status });
    }, []);

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.on(event, handler);
        return () => { socketRef.current?.off(event, handler); };
    }, []);

    return { socket: socketRef.current, joinBus, joinUser, sendLocation, sendSOS, updateSeat, on };
}

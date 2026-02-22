import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    age?: number | string;
    gender?: string;
    address?: {
        city?: string;
        state?: string;
    };
    walletBalance?: number;
    upiId?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    role: string;
    isAuthenticated: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (u: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null, token: null, role: "Passenger", isAuthenticated: false,
    login: () => { }, logout: () => { }, updateUser: () => { }
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("ys_token"));
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("ys_user");
        try { return saved ? JSON.parse(saved) : null; } catch { return null; }
    });

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem("ys_token", newToken);
        localStorage.setItem("ys_user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem("ys_token");
        localStorage.removeItem("ys_user");
        setToken(null);
        setUser(null);
    };

    const updateUser = (partial: Partial<User>) => {
        const updated = { ...user!, ...partial };
        setUser(updated);
        localStorage.setItem("ys_user", JSON.stringify(updated));
    };

    // Verify token still valid on mount
    useEffect(() => {
        if (token && !user) {
            fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json())
                .then(u => { if (u._id) setUser(u); else logout(); })
                .catch(logout);
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user, token, role: user?.role || "Passenger",
            isAuthenticated: !!user && !!token,
            login, logout, updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

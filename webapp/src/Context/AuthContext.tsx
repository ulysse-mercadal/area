import React, { createContext, useContext, useState, useEffect, use } from "react";
import {jwtDecode} from "jwt-decode";
import type { AuthContextType, DecodedToken } from "../types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<DecodedToken | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const isTokenValid = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("No token found");
        }

        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            console.log("Token validation failed, status:", res.status);
            localStorage.removeItem("token");
            throw new Error("JWT is invalid");
        }

        const data = await res.json();
        console.log("Token validation response data:", data);

        if (!data) {
            console.log("Token validation failed: no data");
            localStorage.removeItem("token");
            throw new Error("JWT is invalid");
        }

        const decoded = jwtDecode<DecodedToken>(token);
        decoded.role = data.role;
        decoded.email = data.email;
        console.log("Decoded token:", decoded);
        setUser(decoded);
        return data;
    };

    const [loading, setLoading] = useState(true);

    useEffect(() => {
    const checkToken = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            await isTokenValid();
        } catch (err) {
            localStorage.removeItem("token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };
    checkToken();
    }, [token]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
    }, []);


    const login = async (credentials: { email: string; password: string }) => {
        console.log("Logging in with credentials:",  JSON.stringify(credentials));
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });
        const data = await res.json();

        console.log("Login response data:", data);
        if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            const decoded = jwtDecode<DecodedToken>(data.access_token);
            setUser(decoded);
        } else {
            throw new Error("Login failed");
        }
    };

    const register = async (details: { email: string; password: string; name: string; surname: string }) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(details),
        });
        const data = await res.json();
        if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            const decoded = jwtDecode<DecodedToken>(data.access_token);
            setUser(decoded);
        } else {
            throw new Error("Registration failed");
        }
    };
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };
    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isTokenValid }}>
          {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within AuthProvider");
  return context;
};

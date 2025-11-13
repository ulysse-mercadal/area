import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
    const { user, loading } = useAuth();
    if (loading) 
      return <></>;
    if (!user) 
      return <Navigate to="/login" />;
    if (role && user.role !== role) {
      return <Navigate to="/workflows" />;
    }
    return <>{children}</>;
};

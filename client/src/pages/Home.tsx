import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Dashboard from "./Dashboard";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Por favor inicia sesión</div>;
  }

  return <Dashboard />;
}

"use client";

import { createContext, useContext } from "react";

export interface DashboardProfile {
  puesto?: string;
  nivel?: string;
  ubicacion?: string;
  modalidad?: string;
  whatsapp?: string;
  plan: string;
  createdAt: string;
  nombreCompleto?: string;
  apellidos?: string;
}

export interface DashboardContextValue {
  profile: DashboardProfile | null;
  displayName: string;
  setDisplayName: (name: string) => void;
  plan: string;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard debe usarse dentro de app/dashboard/layout.tsx");
  }
  return ctx;
}

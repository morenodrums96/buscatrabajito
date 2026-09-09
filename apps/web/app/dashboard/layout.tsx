"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@clerk/nextjs";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DashboardContext, DashboardProfile } from "@/components/dashboard/DashboardContext";

const PLAN_LABELS: Record<string, string> = {
  free: "GRATUITO",
  buscador: "BUSCADOR",
  aplicador: "APLICADOR",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push("/sign-in");
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    fetch("/api/profile", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Error al obtener perfil");
        return r.json();
      })
      .then((data) => {
        if (!isMounted) return;

        // Si el usuario no ha completado el onboarding, lo redirigimos
        if (data?.needsOnboarding) {
          router.push("/onboarding");
          return;
        }

        setProfile(data);
        if (data?.nombreCompleto) {
          setDisplayName(data.nombreCompleto);
        } else if (data?.nombre) {
          setDisplayName(`${data.nombre} ${data.apellidoPaterno || ""}`.trim());
        } else {
          setDisplayName(user.emailAddresses[0]?.emailAddress ?? "");
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError" && isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isLoaded, user, router]);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
  }

  const plan = profile?.plan ?? "free";
  const showSpinner = !isLoaded || loading || signingOut;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900 relative"
    >
      <DashboardSidebar
        pathname={pathname}
        isFreePlan={plan === "free"}
        onSignOut={handleSignOut}
      />

      <DashboardHeader
        displayName={displayName}
        planLabel={PLAN_LABELS[plan] ?? plan.toUpperCase()}
      />

      <main className="ml-64 flex-1 p-8 space-y-6 max-w-7xl">
        <AnimatePresence mode="wait">
          {showSpinner ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center h-[60vh] space-y-3"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              </div>
              <p className="text-xs font-semibold text-slate-400 tracking-wide">
                {signingOut ? "Cerrando sesión..." : "Cargando tu panel..."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <DashboardContext.Provider value={{ profile, displayName, setDisplayName, plan }}>
                {children}
              </DashboardContext.Provider>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
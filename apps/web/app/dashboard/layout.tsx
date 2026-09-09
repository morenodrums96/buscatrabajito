"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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

    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        if (data?.nombreCompleto) {
          setDisplayName(data.nombreCompleto);
        } else {
          setDisplayName(user.emailAddresses[0]?.emailAddress ?? "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user, router]);

  function handleSignOut() {
    setSigningOut(true);
    signOut(() => router.push("/"));
  }

  const plan = profile?.plan ?? "free";
  const showSpinner = !isLoaded || loading || signingOut;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
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
        {showSpinner ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-3 animate-in fade-in duration-300">
            <div className="w-9 h-9 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400 tracking-wide">
              Cargando tu panel...
            </p>
          </div>
        ) : (
          <DashboardContext.Provider value={{ profile, displayName, setDisplayName, plan }}>
            <div className="animate-in fade-in duration-300">
              {children}
            </div>
          </DashboardContext.Provider>
        )}
      </main>
    </div>
  );
}
import { SignIn, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#040810] text-slate-100">
      {/* LADO IZQUIERDO: Panel Brand & Value */}
      <div className="lg:col-span-5 bg-[#060E1A] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden hidden sm:flex border-r border-slate-800/80">
        {/* Glows de fondo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-300 hover:text-white transition-colors gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al sitio
          </Link>
        </div>

        <div className="relative z-10 my-auto py-12">
          <Link
            href="/"
            className="font-extrabold text-3xl tracking-tight text-white mb-6 block"
          >
            Busco<span className="text-sky-400">Trabajito</span>
          </Link>

          <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
            Consigue tu próximo empleo sin estrés.
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
            Monitoreamos vacantes por ti, adaptamos tu CV con IA y te avisamos
            en tiempo real para que apliques antes que nadie.
          </p>

          <div className="space-y-3 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>7+ portales rastreados en tiempo real</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Optimización de CV inteligente por vacante</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} BuscoTrabajito. Todos los derechos reservados.
        </div>
      </div>

      {/* LADO DERECHO: Formulario / Loading de Clerk */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 lg:p-12 relative bg-[#040810]">
        <Link
          href="/"
          className="sm:hidden absolute top-6 left-6 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>

        <div className="w-full max-w-md">
          {/* Skeleton mientras inicializa el SDK de Clerk */}
          <ClerkLoading>
            <div className="w-full bg-[#0A1220] border border-slate-800 rounded-2xl p-8 shadow-2xl animate-pulse flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-medium text-slate-400">Cargando acceso seguro...</p>
            </div>
          </ClerkLoading>

          {/* Formulario con estilos integrados */}
          <ClerkLoaded>
            <SignIn
              appearance={{
                elements: {
                  card: "bg-[#0A1220] shadow-2xl shadow-black/50 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full",
                  headerTitle: "text-white font-extrabold text-2xl tracking-tight",
                  headerSubtitle: "text-slate-400 text-sm",
                  socialButtonsBlockButton:
                    "bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-slate-200 font-medium text-sm rounded-xl transition-all py-2.5",
                  socialButtonsBlockButtonText: "text-slate-200 font-semibold",
                  dividerLine: "bg-slate-800",
                  dividerText: "text-slate-500 text-xs",
                  formFieldLabel: "text-slate-300 text-xs font-medium",
                  formButtonPrimary:
                    "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-sm font-bold rounded-xl py-3 shadow-md shadow-blue-500/20 transition-all",
                  formFieldInput:
                    "bg-slate-950/60 border-slate-800 focus:border-sky-500 text-white text-sm rounded-xl py-2.5",
                  footerActionLink: "text-sky-400 hover:text-sky-300 font-semibold",
                  footerActionText: "text-slate-400",
                  identityPreviewText: "text-slate-300",
                  formFieldInputShowPasswordButton: "text-slate-400 hover:text-white",
                },
              }}
            />
          </ClerkLoaded>
        </div>
      </div>
    </div>
  );
}
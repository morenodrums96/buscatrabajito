import { SignUp, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFC]">
      {/* LADO IZQUIERDO: Panel Brand & Value */}
      <div className="lg:col-span-5 bg-[#0F2744] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden hidden sm:flex">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#2563EB]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-300 hover:text-white transition-colors gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm"
          >
            ← Volver al sitio
          </Link>
        </div>

        {/* Middle */}
        <div className="relative z-10 my-auto py-12">
          <Link
            href="/"
            className="font-extrabold text-3xl tracking-tight text-white mb-6 block"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            Busco<span className="text-[#60A5FA]">Trabajito</span>
          </Link>

          <h1
            className="text-3xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            Empieza a automatizar tu búsqueda hoy.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-sm">
            Crea tu cuenta en menos de un minuto y recibe alertas personalizadas de vacantes que sí hacen match contigo.
          </p>

          <div className="pt-6 border-t border-white/10 flex items-center gap-6">
            <div>
              <p className="text-xl font-extrabold text-white">100%</p>
              <p className="text-xs text-slate-400">Sin tarjeta al inicio</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-xl font-extrabold text-white">3 min</p>
              <p className="text-xs text-slate-400">Configuración rápida</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} BuscoTrabajito. Todos los derechos reservados.
        </div>
      </div>

      {/* LADO DERECHO: Formulario / Loading de Clerk */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <Link
          href="/"
          className="sm:hidden absolute top-6 left-6 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Volver
        </Link>

        <div className="w-full max-w-md">
          {/* Spinner mientras inicializa el SDK de Clerk */}
          <ClerkLoading>
            <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xl shadow-slate-900/5 animate-pulse flex flex-col items-center justify-center min-h-[440px]">
              <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-medium text-[#64748B]">Preparando registro...</p>
            </div>
          </ClerkLoading>

          {/* Formulario nativo estilizado */}
          <ClerkLoaded>
            <SignUp
              appearance={{
                elements: {
                  card: "bg-white shadow-xl shadow-slate-900/5 border border-slate-200/80 rounded-2xl p-6 sm:p-8 w-full",
                  headerTitle: "text-[#0F2744] font-extrabold text-2xl tracking-tight",
                  headerSubtitle: "text-[#64748B] text-sm",
                  socialButtonsBlockButton:
                    "border-slate-200 hover:bg-slate-50 text-[#0F2744] font-medium text-sm rounded-xl transition-all py-2.5",
                  formButtonPrimary:
                    "bg-[#2563EB] hover:bg-[#1D4ED8] text-sm font-bold rounded-xl py-3 shadow-md shadow-blue-600/15 transition-all",
                  formFieldInput:
                    "rounded-xl border-slate-200 focus:border-[#2563EB] text-sm py-2.5",
                  footerActionLink: "text-[#2563EB] hover:underline font-semibold",
                },
              }}
            />
          </ClerkLoaded>
        </div>
      </div>
    </div>
  );
}
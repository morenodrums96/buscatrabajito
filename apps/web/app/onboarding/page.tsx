"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NIVELES = ["Sin experiencia", "Junior (1-2 años)", "Semi-Senior (3-5 años)", "Senior (5+ años)"];
const MODALIDADES = ["Presencial", "Remoto", "Híbrido", "Cualquiera"];

export default function Onboarding() {
  const router = useRouter();
  const [form, setForm] = useState({
    puesto: "",
    nivel: "",
    ubicacion: "",
    modalidad: "",
    whatsapp: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("ok");
        router.push("/dashboard");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">¿Qué trabajo buscas?</h1>
        <p className="text-gray-500 mt-1 text-sm">Te buscamos vacantes personalizadas cada 30 minutos.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Puesto que buscas</label>
            <input
              type="text"
              placeholder="Ej: Desarrollador Frontend, Contador, Diseñador UX"
              value={form.puesto}
              onChange={(e) => set("puesto", e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Nivel de experiencia</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {NIVELES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set("nivel", n)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    form.nivel === n
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Ubicación</label>
            <input
              type="text"
              placeholder="Ej: Monterrey, CDMX, Guadalajara"
              value={form.ubicacion}
              onChange={(e) => set("ubicacion", e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Modalidad</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {MODALIDADES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("modalidad", m)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    form.modalidad === m
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              WhatsApp <span className="text-gray-400">(opcional — plan premium)</span>
            </label>
            <input
              type="tel"
              placeholder="+52 81 1234 5678"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-red-500">Algo salió mal, intenta de nuevo.</p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !form.nivel || !form.modalidad}
            className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
          >
            {status === "loading" ? "Guardando..." : "Comenzar a buscar →"}
          </button>
        </form>
      </div>
    </main>
  );
}

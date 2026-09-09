"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ChevronRight } from "lucide-react";

interface Step {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: Step[] = [
  {
    target: "[data-tour='dashboard-resumen']",
    title: "¡Bienvenido a tu Dashboard! 👋",
    description: "Aquí verás un resumen de tu búsqueda de empleo: vacantes encontradas, alertas enviadas y tu actividad general.",
    position: "bottom",
  },
  {
    target: "[data-tour='sidebar-cv']",
    title: "Tu CV es el corazón del sistema",
    description: "Antes de empezar, necesitamos conocerte mejor. Ve a 'Mi CV' para subir tu CV o llenar tu perfil con ayuda de nuestra IA.",
    position: "right",
  },
  {
    target: "[data-tour='sidebar-vacantes']",
    title: "Aquí llegan tus vacantes",
    description: "Una vez configurado tu perfil, aquí verás todas las vacantes que encontramos para ti cada 30 minutos.",
    position: "right",
  },
  {
    target: "[data-tour='notificaciones']",
    title: "Te avisamos al instante",
    description: "Recibirás alertas por correo (plan gratuito) o WhatsApp (plan de pago) cuando aparezca algo para ti.",
    position: "top",
  },
  {
    target: "[data-tour='sidebar-cv']",
    title: "¡Empieza ahora! 🚀",
    description: "Dale clic a 'Mi CV' para configurar tu perfil y activar la búsqueda automática de vacantes.",
    position: "right",
  },
];

export const TOUR_KEY = "buscotrabajito_tour_done";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPos {
  top: number;
  left: number;
}

export default function ProductTour({ onFinish }: { onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0 });

  const step = TOUR_STEPS[stepIndex];

  const calcPositions = useCallback(() => {
    const el = document.querySelector(step.target);
    if (!el) return;

    const r = el.getBoundingClientRect();
    const pad = 8;
    setRect({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });

    const tooltipW = 300;
    const tooltipH = 180;
    const margin = 16;
    let top = 0;
    let left = 0;

    if (step.position === "bottom") {
      top = r.bottom + margin;
      left = r.left + r.width / 2 - tooltipW / 2;
    } else if (step.position === "top") {
      top = r.top - tooltipH - margin;
      left = r.left + r.width / 2 - tooltipW / 2;
    } else if (step.position === "right") {
      top = r.top + r.height / 2 - tooltipH / 2;
      left = r.right + margin;
    } else if (step.position === "left") {
      top = r.top + r.height / 2 - tooltipH / 2;
      left = r.left - tooltipW - margin;
    }

    // Evitar que el tooltip se corte fuera de la ventana
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipH - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));

    setTooltipPos({ top, left });
  }, [step]);

  useEffect(() => {
    // Reintentar posicionamiento por si la animación de render de la página toma un momento
    calcPositions();
    const timer = setTimeout(calcPositions, 100);

    window.addEventListener("resize", calcPositions);
    window.addEventListener("scroll", calcPositions, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calcPositions);
      window.removeEventListener("scroll", calcPositions, true);
    };
  }, [calcPositions, stepIndex]);

  function finish() {
    localStorage.setItem(TOUR_KEY, "1");
    onFinish();
  }

  function next() {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      finish();
    }
  }

  const isLast = stepIndex === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay oscuro con spotlight */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ cursor: "default" }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx="10"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.65)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Borde del spotlight */}
        {rect && (
          <motion.div
            key={`highlight-${stepIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute rounded-xl border-2 border-[#60A5FA] shadow-[0_0_0_4px_rgba(96,165,250,0.2)]"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={`tooltip-${stepIndex}`}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute bg-[#0A1220] border border-slate-700 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-[300px] p-5 pointer-events-auto"
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent rounded-t-2xl" />

          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3
              className="text-sm font-extrabold text-white leading-tight pr-2"
              style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              {step.title}
            </h3>
            <button
              onClick={finish}
              className="text-slate-500 hover:text-white transition-colors flex-shrink-0 mt-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Descripción */}
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              {stepIndex + 1} de {TOUR_STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={finish}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Saltar
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
              >
                {isLast ? "¡Empezar!" : "Siguiente"}
                {isLast ? <ArrowRight className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Indicador de progreso */}
          <div className="flex gap-1 mt-3">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "bg-[#60A5FA] flex-1" : "bg-slate-700 w-4"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Hook de ayuda
export function useTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setShow(true);
  }, []);

  return {
    show,
    startTour: () => setShow(true),
    endTour: () => setShow(false),
  };
}
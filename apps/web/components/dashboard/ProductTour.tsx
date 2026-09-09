"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";

interface Step {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  width?: number;
  pinnedTop?: number;
}

const TOUR_STEPS: Step[] = [
  {
    target: "[data-tour='dashboard-resumen']",
    title: "¡Bienvenido a tu Dashboard! 👋",
    description: "Aquí verás un resumen de tu búsqueda de empleo: vacantes encontradas, alertas enviadas y tu actividad general.",
    position: "top",
    width: 450,
    pinnedTop: 2,
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
  arrow: "up" | "down" | "left" | "right";
  arrowOffset: number;
}

export default function ProductTour({ onFinish }: { onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0, arrow: "up", arrowOffset: 0 });
  const [ready, setReady] = useState(false);

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

    const tooltipW = step.width ?? 320;
    const tooltipH = 200;
    const margin = 16;
    let top = 0;
    let left = 0;
    let arrow: TooltipPos["arrow"] = "up";

    if (step.position === "bottom") {
      top = r.bottom + margin;
      left = r.left + r.width / 2 - tooltipW / 2;
      arrow = "up";
    } else if (step.position === "top") {
      const arriba = r.top - tooltipH - margin;
      top = arriba < margin ? step.pinnedTop ?? r.top + margin : arriba;
      left = r.left + r.width / 2 - tooltipW / 2;
      arrow = "down";
    } else if (step.position === "right") {
      top = r.top + r.height / 2 - tooltipH / 2;
      left = r.right + margin;
      arrow = "left";
    } else if (step.position === "left") {
      top = r.top + r.height / 2 - tooltipH / 2;
      left = r.left - tooltipW - margin;
      arrow = "right";
    }

    // Si el paso fija una posición explícita (pinnedTop), respetamos ese
    // valor tal cual en vez de forzar el margen mínimo habitual.
    const topFloor = step.pinnedTop !== undefined ? 0 : margin;
    top = Math.max(topFloor, Math.min(top, window.innerHeight - tooltipH - margin));
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));

    let arrowOffset: number;
    if (arrow === "up" || arrow === "down") {
      const centroX = r.left + r.width / 2;
      arrowOffset = Math.max(24, Math.min(centroX - left, tooltipW - 24));
    } else {
      const centroY = r.top + r.height / 2;
      arrowOffset = Math.max(24, Math.min(centroY - top, tooltipH - 24));
    }

    setTooltipPos({ top, left, arrow, arrowOffset });
  }, [step]);

  useEffect(() => {
    window.addEventListener("resize", calcPositions);
    window.addEventListener("scroll", calcPositions, true);

    if (stepIndex === 0 && !ready) {
      const settle = setTimeout(() => {
        calcPositions();
        setReady(true);
      }, 400);
      return () => {
        clearTimeout(settle);
        window.removeEventListener("resize", calcPositions);
        window.removeEventListener("scroll", calcPositions, true);
      };
    }

    const immediate = setTimeout(() => {
      calcPositions();
      setReady(true);
    }, 0);
    const timer = setTimeout(calcPositions, 100);

    return () => {
      clearTimeout(immediate);
      clearTimeout(timer);
      window.removeEventListener("resize", calcPositions);
      window.removeEventListener("scroll", calcPositions, true);
    };
  }, [calcPositions, stepIndex, ready]);

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

  function prev() {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  }

  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;

  if (!ready) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay con opacidad equilibrada */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto cursor-default">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(15, 23, 42, 0.55)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Resaltado del foco */}
        {rect && (
          <motion.div
            key={`highlight-${stepIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="absolute rounded-xl border-2 border-blue-500 ring-4 ring-blue-500/20 shadow-lg pointer-events-none"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
        )}

        {/* Tarjeta Flotante */}
        <motion.div
          key={`tooltip-${stepIndex}`}
          initial={{ opacity: 0, scale: 0.94, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute bg-slate-900 border-2 border-slate-600/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-5 pointer-events-auto"
          style={{ top: tooltipPos.top, left: tooltipPos.left, width: step.width ?? 320 }}
        >
          {/* Flechas indicadoras */}
          {tooltipPos.arrow === "up" && (
            <div
              className="absolute w-4 h-4 bg-slate-900 border-t-2 border-l-2 border-slate-600 rotate-45 pointer-events-none"
              style={{ top: -9, left: tooltipPos.arrowOffset - 8 }}
            />
          )}
          {tooltipPos.arrow === "down" && (
            <div
              className="absolute w-4 h-4 bg-slate-900 border-b-2 border-r-2 border-slate-600 rotate-45 pointer-events-none"
              style={{ bottom: -9, left: tooltipPos.arrowOffset - 8 }}
            />
          )}
          {tooltipPos.arrow === "left" && (
            <div
              className="absolute w-4 h-4 bg-slate-900 border-b-2 border-l-2 border-slate-600 rotate-45 pointer-events-none"
              style={{ left: -9, top: tooltipPos.arrowOffset - 8 }}
            />
          )}
          {tooltipPos.arrow === "right" && (
            <div
              className="absolute w-4 h-4 bg-slate-900 border-t-2 border-r-2 border-slate-600 rotate-45 pointer-events-none"
              style={{ right: -9, top: tooltipPos.arrowOffset - 8 }}
            />
          )}

          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-t-2xl" />

          {/* Encabezado */}
          <div className="flex items-start justify-between mb-2.5">
            <h3
              className="text-base font-bold text-white leading-snug pr-2"
              style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              {step.title}
            </h3>
            <button
              onClick={finish}
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-0.5 cursor-pointer p-0.5 rounded-md hover:bg-slate-800"
              title="Cerrar tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Texto Descriptivo */}
          <p className="text-sm text-slate-200 leading-relaxed mb-4 font-normal">
            {step.description}
          </p>

          {/* Controles de Navegación */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400 font-medium">
              {stepIndex + 1} de {TOUR_STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                disabled={isFirst}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  isFirst
                    ? "text-slate-600 border-slate-800 cursor-not-allowed opacity-40"
                    : "text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white cursor-pointer active:scale-95"
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Atrás
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-blue-500/25 active:scale-95"
              >
                {isLast ? "¡Empezar!" : "Siguiente"}
                {isLast ? <ArrowRight className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="flex gap-1.5 mt-3.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "bg-blue-400 flex-1" : "bg-slate-700/80 w-3"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

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
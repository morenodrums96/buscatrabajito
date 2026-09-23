"use client";

import { useEffect, useRef, useState } from "react";

// Dominios más comunes en México — al escribir "@" se sugieren todos, y se
// van filtrando conforme el usuario sigue escribiendo. Pensado para evitar
// typos como "outllook.es" (dominio que no existe) que hacen que nunca
// llegue el código de verificación.
const DOMINIOS_COMUNES = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "outlook.es",
  "yahoo.com",
  "yahoo.com.mx",
  "icloud.com",
  "live.com",
  "msn.com",
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function EmailAutocompleteInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  autoFocus,
  className,
}: Props) {
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const arroba = value.indexOf("@");
  const usuario = arroba >= 0 ? value.slice(0, arroba) : value;
  const dominioParcial = arroba >= 0 ? value.slice(arroba + 1).toLowerCase() : "";

  const sugerencias =
    arroba >= 0 && usuario
      ? DOMINIOS_COMUNES.filter(d => d.startsWith(dominioParcial) && d !== dominioParcial)
      : [];

  useEffect(() => {
    setIndiceActivo(0);
  }, [value]);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (!contenedorRef.current?.contains(e.target as Node)) {
        setMostrarSugerencias(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  function elegirDominio(dominio: string) {
    onChange(`${usuario}@${dominio}`);
    setMostrarSugerencias(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mostrarSugerencias && sugerencias.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndiceActivo(i => (i + 1) % sugerencias.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndiceActivo(i => (i - 1 + sugerencias.length) % sugerencias.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        elegirDominio(sugerencias[indiceActivo]);
        return;
      }
      if (e.key === "Escape") {
        setMostrarSugerencias(false);
        return;
      }
    }
    onKeyDown?.(e);
  }

  return (
    <div ref={contenedorRef} className="relative">
      <input
        type="email"
        autoFocus={autoFocus}
        autoComplete="off"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setMostrarSugerencias(true);
        }}
        onFocus={() => setMostrarSugerencias(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />

      {mostrarSugerencias && sugerencias.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {sugerencias.map((d, i) => (
            <button
              key={d}
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                elegirDominio(d);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium cursor-pointer ${
                i === indiceActivo ? "bg-blue-50 text-[#2563EB]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {usuario}@<span className="font-bold">{d}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

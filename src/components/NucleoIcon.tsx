"use client";

import React from "react";

interface NucleoIconProps {
  size?: number;
  className?: string;
  variant?: "black" | "white" | "adaptive";
  showGlow?: boolean;
}

/**
 * Logotipo Icónico Minimalista "N" para NÚCLEO ERP.
 * Diseño geométrico moderno en blanco y negro (estilo Apple / Linear / Vercel).
 */
export const NucleoIcon: React.FC<NucleoIconProps> = ({
  size = 32,
  className = "",
  variant = "black",
  showGlow = false,
}) => {
  const isWhiteBg = variant === "white";

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none group transition-transform duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Sutil halo luminiscente exterior (glow) */}
      {showGlow && (
        <div 
          className="absolute inset-0 rounded-[28%] bg-white/20 blur-md -z-10 group-hover:bg-white/30 transition-all duration-300"
          style={{ width: size, height: size }}
        />
      )}

      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Definición de gradientes monocromáticos sutiles */}
        <defs>
          {/* Brillo de superficie estilo cristal líquido Apple */}
          <linearGradient id="nucleoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1c1c1f" />
            <stop offset="50%" stopColor="#0d0d10" />
            <stop offset="100%" stopColor="#040405" />
          </linearGradient>

          {/* Borde biselado superior con luz especular */}
          <linearGradient id="nucleoBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
            <stop offset="40%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
          </linearGradient>

          {/* Gradiente sutil del glifo N en blanco puro y platino */}
          <linearGradient id="nucleoGlyphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="85%" stopColor="#F4F4F5" />
            <stop offset="100%" stopColor="#E4E4E7" />
          </linearGradient>
        </defs>

        {/* 1. Base Squircle (Continuous Curvature) */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          fill={isWhiteBg ? "#FFFFFF" : "url(#nucleoBgGrad)"}
        />

        {/* 2. Borde exterior ultrafino de alta precisión */}
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="8"
          stroke={isWhiteBg ? "rgba(0, 0, 0, 0.15)" : "url(#nucleoBorderGrad)"}
          strokeWidth="1"
        />

        {/* 3. Glifo Arquitectónico Minimalista "N" */}
        {/* Construcción geométrica con pilares paralelos y corte diagonal de alta tensión */}
        <path
          d="M 7.5 7 H 12.8 L 20.3 18.54 V 7 H 24.5 V 25 H 19.2 L 11.7 13.46 V 25 H 7.5 Z"
          fill={isWhiteBg ? "#09090b" : "url(#nucleoGlyphGrad)"}
          stroke={isWhiteBg ? "#09090b" : "url(#nucleoGlyphGrad)"}
          strokeWidth="0.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

'use client'

import React from 'react'

interface StockPulseVectorLogoProps {
  size?: number
  className?: string
  animated?: boolean
  showGlow?: boolean
}

/**
 * StockPulse Icon Mark:
 * A sharp, geometric 3D inventory warehouse box/cube viewed isometrically from an angle.
 * The front facet of the cube is cut with a sharp, glowing pulse/heartbeat line that seamlessly
 * traces along its edge, symbolizing live real-time stock monitoring and concurrency locks.
 * 
 * Color Palette:
 * - Primary: Warm Amber / Burnt Copper (#F59E0B / #D97706)
 * - Secondary: Deep Walnut & Dark Charcoal (#1F1A17 / #2B2118)
 * - Accent: Crisp Gold (#FBBF24)
 */
export function StockPulseVectorLogo({
  size = 56,
  className = '',
  animated = true,
  showGlow = true,
}: StockPulseVectorLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="StockPulse Isometric Warehouse Cube Icon"
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Ambient Glow Filters */}
          <filter id="amberPulseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
            <feOffset dx="0" dy="12" result="offsetblur" />
            <feFlood floodColor="#000000" floodOpacity="0.65" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Facet Gradients */}
          {/* Top Facet: Deep Walnut / Charcoal with warm specular sheen */}
          <linearGradient id="topFacet" x1="100" y1="20" x2="100" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#382B22" />
            <stop offset="50%" stopColor="#2B2118" />
            <stop offset="100%" stopColor="#1F1A17" />
          </linearGradient>

          {/* Left Facet: Deep Dark Charcoal with subtle warehouse panel groove */}
          <linearGradient id="leftFacet" x1="28" y1="56" x2="100" y2="176" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2A221C" />
            <stop offset="60%" stopColor="#1C1714" />
            <stop offset="100%" stopColor="#14100E" />
          </linearGradient>

          {/* Right Front Facet: Warmer ambient bounce from burnt copper & amber lighting */}
          <linearGradient id="rightFacet" x1="100" y1="92" x2="172" y2="176" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2F251E" />
            <stop offset="40%" stopColor="#231C17" />
            <stop offset="100%" stopColor="#1A1512" />
          </linearGradient>

          {/* Sharp Bevel Rim Gradients */}
          <linearGradient id="bevelGold" x1="28" y1="56" x2="172" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.4" />
          </linearGradient>

          {/* Glowing Pulse Heartbeat Gradients */}
          <linearGradient id="pulseCore" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="35%" stopColor="#FBBF24" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id="pulseGlowFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0.02" />
          </linearGradient>

          {/* Radial drop shadow underneath cube */}
          <radialGradient id="cubeFloorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Floor Shadow */}
        <ellipse cx="100" cy="180" rx="68" ry="18" fill="url(#cubeFloorShadow)" />

        {/* --- 3D ISOMETRIC WAREHOUSE CUBE BASE --- */}
        <g filter="url(#softShadow)">
          {/* TOP FACET: (100, 26) -> (172, 66) -> (100, 106) -> (28, 66) */}
          <polygon
            points="100,26 172,66 100,106 28,66"
            fill="url(#topFacet)"
            stroke="#4A3B2F"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Top Facet Modular Warehouse Ribs / Cargo Pod Lines */}
          <line x1="64" y1="46" x2="136" y2="86" stroke="#F59E0B" strokeOpacity="0.18" strokeWidth="1.2" />
          <line x1="136" y1="46" x2="64" y2="86" stroke="#F59E0B" strokeOpacity="0.18" strokeWidth="1.2" />
          <polygon points="100,56 122,68 100,81 78,68" fill="#1A1512" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="1" />

          {/* LEFT FACET: (28, 66) -> (100, 106) -> (100, 178) -> (28, 138) */}
          <polygon
            points="28,66 100,106 100,178 28,138"
            fill="url(#leftFacet)"
            stroke="#2B2118"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Left Facet Warehouse Rack Slats */}
          <line x1="28" y1="90" x2="100" y2="130" stroke="#F59E0B" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 4" />
          <line x1="28" y1="114" x2="100" y2="154" stroke="#F59E0B" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 4" />

          {/* Vertical Rack Stanchion on Left */}
          <line x1="64" y1="86" x2="64" y2="158" stroke="#F59E0B" strokeOpacity="0.14" strokeWidth="1.2" />

          {/* RIGHT FACET (FRONT/ACTIVE FACET): (100, 106) -> (172, 66) -> (172, 138) -> (100, 178) */}
          <polygon
            points="100,106 172,66 172,138 100,178"
            fill="url(#rightFacet)"
            stroke="#3D3025"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Right Facet Warehouse Grid Channels */}
          <line x1="100" y1="130" x2="172" y2="90" stroke="#F59E0B" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 4" />
          <line x1="100" y1="154" x2="172" y2="114" stroke="#F59E0B" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="3 4" />
          <line x1="136" y1="86" x2="136" y2="158" stroke="#F59E0B" strokeOpacity="0.14" strokeWidth="1.2" />
        </g>

        {/* --- SHARP ISOMETRIC BEVEL HIGHLIGHTS --- */}
        {/* Top Outer Ridge Highlight */}
        <polyline
          points="28,66 100,26 172,66"
          stroke="url(#bevelGold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Vertical Axis (Intersection Edge) */}
        <line
          x1="100"
          y1="106"
          x2="100"
          y2="178"
          stroke="#F59E0B"
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />

        {/* --- THE SHARP GLOWING PULSE / HEARTBEAT CUT --- */}
        {/*
          The pulse cut travels across the front faces and traces along the cube edges:
          Starts on the left face, crosses the center edge at (100, 134),
          surges upward into a sharp ECG heartbeat spike on the front facet,
          dips deeply into a trough, recovers, and traces along the front lower edge to (172, 110)
        */}

        {/* Recessed Dark Channel behind the pulse */}
        <path
          d="M 38,126 L 68,110 L 78,110 L 84,96 L 90,122 L 96,110 L 100,110 L 108,110 L 118,74 L 126,142 L 134,98 L 140,114 L 148,114 L 168,102"
          stroke="#0D0A08"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* Outer Amber Pulse Ambient Flare */}
        {showGlow && (
          <path
            d="M 38,126 L 68,110 L 78,110 L 84,96 L 90,122 L 96,110 L 100,110 L 108,110 L 118,74 L 126,142 L 134,98 L 140,114 L 148,114 L 168,102"
            stroke="#F59E0B"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#amberPulseGlow)"
            opacity="0.75"
            className={animated ? 'animate-pulse' : ''}
          />
        )}

        {/* Mid Burnt Copper / Gold Core Line */}
        <path
          d="M 38,126 L 68,110 L 78,110 L 84,96 L 90,122 L 96,110 L 100,110 L 108,110 L 118,74 L 126,142 L 134,98 L 140,114 L 148,114 L 168,102"
          stroke="url(#pulseCore)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Sharp Luminous Core (White-Gold Inner Filament) */}
        <path
          d="M 38,126 L 68,110 L 78,110 L 84,96 L 90,122 L 96,110 L 100,110 L 108,110 L 118,74 L 126,142 L 134,98 L 140,114 L 148,114 L 168,102"
          stroke="#FFFBEB"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Animated Traveling Comet / Energy Pulse Head */}
        {animated && (
          <path
            d="M 38,126 L 68,110 L 78,110 L 84,96 L 90,122 L 96,110 L 100,110 L 108,110 L 118,74 L 126,142 L 134,98 L 140,114 L 148,114 L 168,102"
            stroke="#FBBF24"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#amberPulseGlow)"
            className="animate-pulse-trace"
          />
        )}

        {/* --- CONCURRENCY LOCK NODES (Sharp Geometric Status Anchors) --- */}
        {/* Center Apex Node (100, 26) */}
        <circle cx="100" cy="26" r="3" fill="#FBBF24" filter="url(#amberPulseGlow)" />
        <circle cx="100" cy="26" r="1.5" fill="#FFFFFF" />

        {/* Pulse Peak Node (118, 74) */}
        <circle cx="118" cy="74" r="3.5" fill="#FBBF24" filter="url(#amberPulseGlow)" />
        <circle cx="118" cy="74" r="1.8" fill="#FFFFFF" />

        {/* Pulse Trough Lock Node (126, 142) */}
        <circle cx="126" cy="142" r="3" fill="#D97706" filter="url(#amberPulseGlow)" />
        <circle cx="126" cy="142" r="1.5" fill="#FBBF24" />

        {/* Lower Front Corner Node (100, 178) */}
        <circle cx="100" cy="178" r="2.8" fill="#F59E0B" />
        <circle cx="100" cy="178" r="1.2" fill="#FFFFFF" />

        {/* Concurrency Lock Symbol Accent: A micro padlock / lock glyph at the active concurrency crest */}
        <g transform="translate(142, 60)" opacity="0.85">
          <rect x="0" y="4" width="10" height="8" rx="1.5" fill="#2B2118" stroke="#FBBF24" strokeWidth="1" />
          <path d="M 2.5,4 V 2.5 A 2.5,2.5 0 0,1 7.5,2.5 V 4" stroke="#FBBF24" strokeWidth="1" fill="none" />
          <circle cx="5" cy="8" r="0.8" fill="#FBBF24" />
        </g>
      </svg>
    </div>
  )
}

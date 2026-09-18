import React, { useState, useEffect } from 'react';

interface ScadaSchematicSVGProps {
  liveState: Record<string, any>;
  hasMotor2?: boolean;
  activeAssetId?: string;
  viewBox?: string;
  className?: string;
}

export const ScadaSchematicSVG: React.FC<ScadaSchematicSVGProps> = ({
  liveState,
  hasMotor2 = false,
  activeAssetId = 'Packaging_Line_1',
  viewBox = "0 0 980 440",
  className = "w-full h-auto max-h-[500px]"
}) => {
  const m1Running = Boolean(liveState.Motor_1_RunStatus);
  const m1Trip = Boolean(liveState.Motor_1_Trip);
  const m2Running = Boolean(liveState.Motor_2_RunStatus);
  const pumpRunning = Boolean(liveState.Pump_101_RunStatus);

  const tempVal = typeof liveState.Temperature_PV === 'number' ? liveState.Temperature_PV : 72.0;
  const pressVal = typeof liveState.Pressure_PV === 'number' ? liveState.Pressure_PV : 6.2;
  const speedVal = typeof liveState.Conveyor_Speed_PV === 'number' ? liveState.Conveyor_Speed_PV : 24.5;
  const tankLevel = typeof liveState.Tank_Level === 'number' ? liveState.Tank_Level : 78.5;
  const isTempCritical = tempVal > 90.0;

  // Live counter ticks state
  const [m3Counter, setM3Counter] = useState(28770);
  const [meterCounter, setMeterCounter] = useState(27590);

  useEffect(() => {
    if (!pumpRunning && !m1Running) return;
    const interval = setInterval(() => {
      setM3Counter(prev => prev + 1);
      setMeterCounter(prev => prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [pumpRunning, m1Running]);

  // 100% Full Visibility across all SCADA sections
  const fluidOpacity = 1.0;
  const conveyorOpacity = 1.0;

  const m1Color = m1Trip ? '#ef4444' : m1Running ? '#00e676' : '#64748b';
  const pumpColor = pumpRunning ? '#00e676' : '#ef4444';

  const tankFillHeight = Math.min(100, Math.max(10, (tankLevel / 100) * 100));
  const tankFillY = 130 - tankFillHeight;

  // Format 7-digit rolling counter array
  const formattedCounterDigits = m3Counter.toString().padStart(7, '0').split('');
  const formattedMeterDigits = meterCounter.toString().padStart(7, '0').split('');

  return (
    <div className="bg-[#030611] border border-cyan-500/30 rounded-xl p-3 relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.95)]">
      {/* Industrial Header Status Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#e2e8f0', borderBottom: '1px solid rgba(6, 182, 212, 0.25)', padding: '8px 12px', marginBottom: '12px', backgroundColor: '#060b17', borderRadius: '8px', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px', flexShrink: 0 }}>
            <span className="animate-ping" style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '9999px', backgroundColor: '#22d3ee', opacity: 0.75 }} />
            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '9999px', height: '10px', width: '10px', backgroundColor: '#06b6d4' }} />
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px', letterSpacing: '0.025em', fontFamily: 'var(--font-heading)' }}>
              PACKAGING LINE VISUALIZER
            </span>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ color: '#22d3ee', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
              PLANT 01 — MULTI-TANK FLUID PROCESS SCHEMATIC
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '10px' }}>
          <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(8, 47, 73, 0.8)', border: '1px solid rgba(6, 182, 212, 0.5)', color: '#22d3ee', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 0 8px rgba(0, 243, 255, 0.2)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#22d3ee' }} className="animate-pulse" />
            LIVE WS SYNC
          </span>
          <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid #1e3a8a', color: '#93c5fd', fontWeight: 700 }}>
            MODE: AUTO PLC
          </span>
          <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(2, 44, 34, 0.8)', border: '1px solid #065f46', color: '#6ee7b7', fontWeight: 700 }}>
            CYCLE: 1.0s
          </span>
          <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#94a3b8', fontWeight: 700 }}>
            ISA-95 L2
          </span>
        </div>
      </div>

      <svg viewBox={viewBox} className={className} style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.95))' }}>
        <defs>
          {/* Blueprint Background Grid */}
          <pattern id="scadaCadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
          </pattern>

          {/* Glowing Filters for Pipe Fluid Streams */}
          <filter id="neonCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neonEmeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Metal Tank Gradient */}
          <linearGradient id="scadaMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="30%" stopColor="#475569" />
            <stop offset="70%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Blue Fluid Gradient */}
          <linearGradient id="scadaBlueFluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.9" />
          </linearGradient>

          {/* Red Fluid Gradient */}
          <linearGradient id="scadaRedFluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0.9" />
          </linearGradient>

          {/* Belt Shading */}
          <linearGradient id="scadaBeltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#374151" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* CAD Grid Overlay */}
        <rect width="100%" height="100%" fill="url(#scadaCadGrid)" opacity="0.7" />

        {/* ========================================================================= */}
        {/* PANEL 1 (TOP LEFT): PRIMARY WATER STORAGE RESERVOIR & MECHANICAL COUNTER */}
        {/* ========================================================================= */}
        <g transform="translate(15, 15)" opacity={fluidOpacity}>
          <rect x="0" y="0" width="350" height="235" rx="8" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          <rect x="5" y="5" width="120" height="20" rx="3" fill="#1e293b" />
          <text x="65" y="19" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">1-8 Toplama / Tank 101</text>          {/* Primary Water Vessel */}
          <g transform="translate(15, 30)">
            <rect x="0" y="0" width="80" height="130" rx="6" fill="url(#scadaMetalGrad)" stroke="#0284c7" strokeWidth="2" />
            <rect x="35" y="5" width="40" height="120" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
            <rect x="37" y={tankFillY - 10} width="36" height={tankFillHeight} fill="url(#scadaBlueFluidGrad)" />
            <text x="40" y="18" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="Chakra Petch">TANK 101</text>
            <rect x="-10" y="136" width="100" height="20" rx="4" fill="#030712" stroke="#0284c7" strokeWidth="1.5" />
            <text x="40" y="150" textAnchor="middle" fill="#38bdf8" fontSize="9.5" fontWeight="bold" fontFamily="JetBrains Mono">{tankLevel.toFixed(1)}% ({((tankLevel/100)*339).toFixed(1)} M³)</text>
          </g>

          {/* 7-Digit Mechanical Rolling Counter Box */}
          <g transform="translate(105, 30)">
            <rect x="0" y="0" width="140" height="32" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
            <text x="70" y="12" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">Toplam Su Miktarı (M3)</text>
            {formattedCounterDigits.map((digit, i) => (
              <g key={i} transform={`translate(${10 + i * 17}, 16)`}>
                <rect x="0" y="0" width="14" height="13" rx="2" fill="#000000" stroke="#334155" strokeWidth="1" />
                <text x="7" y="10" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">{digit}</text>
              </g>
            ))}
          </g>

          {/* Collection Pump Motor (7-8 Toplama Motor) */}
          <g transform="translate(230, 20)">
            <rect x="0" y="0" width="85" height="40" rx="4" fill="url(#scadaMetalGrad)" stroke={pumpColor} strokeWidth="2" />
            <line x1="15" y1="5" x2="15" y2="35" stroke="#475569" strokeWidth="1.5" />
            <line x1="25" y1="5" x2="25" y2="35" stroke="#475569" strokeWidth="1.5" />
            <line x1="35" y1="5" x2="35" y2="35" stroke="#475569" strokeWidth="1.5" />

            <g transform="translate(70, 20)">
              <g className={pumpRunning ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cx="0" cy="0" r="10" fill="#0f172a" stroke={pumpColor} strokeWidth="1.5" />
                <path d="M -6 -6 L 6 6 M -6 6 L 6 -6" stroke={pumpColor} strokeWidth="2" />
              </g>
            </g>
            {/* Dedicated title badge to eliminate overlap */}
            <rect x="2" y="-12" width="81" height="12" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="42" y="-3" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="Chakra Petch">7-8 Toplama Motor</text>
          </g>

          {/* Solenoid Valve 1-8 Açık & Disinfectant Unit */}
          <g transform="translate(230, 75)">
            <rect x="0" y="0" width="75" height="22" rx="3" fill="#064e3b" stroke="#00e676" strokeWidth="1.5" />
            <text x="37.5" y="14" textAnchor="middle" fill="#00e676" fontSize="8.5" fontWeight="bold" fontFamily="JetBrains Mono">1-8 Açık (VALVE)</text>
          </g>

          <g transform="translate(230, 110)">
            <rect x="0" y="0" width="85" height="50" rx="4" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
            <text x="42" y="14" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="Chakra Petch">Dezenfektan</text>
            <rect x="10" y="20" width="30" height="24" fill="#38bdf8" />
            <rect x="40" y="20" width="35" height="24" fill="#0284c7" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* PANEL 2 (TOP MIDDLE): HEAVY INDUSTRIAL PUMP & 1-6 COUNTER                 */}
        {/* ========================================================================= */}
        <g transform="translate(380, 15)" opacity={fluidOpacity}>
          <rect x="0" y="0" width="220" height="235" rx="8" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          <rect x="5" y="5" width="125" height="20" rx="3" fill="#1e293b" />
          <text x="67.5" y="19" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">1-6 Toplama / Sayaç</text>

          {/* 1-6 Counter Box with Needle Meter */}
          <g transform="translate(15, 30)">
            <rect x="0" y="0" width="140" height="55" rx="5" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
            <text x="70" y="12" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="Chakra Petch">1-6 Sayaç (M3)</text>
            {formattedMeterDigits.map((digit, i) => (
              <g key={i} transform={`translate(${8 + i * 18}, 18)`}>
                <rect x="0" y="0" width="15" height="16" rx="2" fill="#000000" stroke="#334155" strokeWidth="1" />
                <text x="7.5" y="12" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">{digit}</text>
              </g>
            ))}
            {/* Scale Gauge Ticks */}
            <line x1="10" y1="44" x2="130" y2="44" stroke="#475569" strokeWidth="2" />
            <polygon points="70,38 65,48 75,48" fill="#00e676" />
          </g>

          {/* Heavy Motor */}
          <g transform="translate(15, 95)">
            <rect x="0" y="0" width="120" height="60" rx="6" fill="url(#scadaMetalGrad)" stroke={pumpColor} strokeWidth="2.5" />
            <line x1="20" y1="5" x2="20" y2="55" stroke="#475569" strokeWidth="2" />
            <line x1="35" y1="5" x2="35" y2="55" stroke="#475569" strokeWidth="2" />
            <line x1="50" y1="5" x2="50" y2="55" stroke="#475569" strokeWidth="2" />
            <circle cx="100" cy="30" r="16" fill="#0f172a" stroke={pumpColor} strokeWidth="2" />
            <circle cx="100" cy="30" r="6" fill={pumpColor} className={pumpRunning ? "scada-beacon-active" : ""} />
            <text x="60" y="76" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">MAIN PUMP MOTOR</text>
          </g>

          {/* SSR Indicators */}
          <g transform="translate(165, 100)">
            <rect x="0" y="0" width="40" height="18" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="20" y="12" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">SSR-3</text>
            <rect x="0" y="24" width="40" height="18" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <text x="20" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">SSR-2</text>
            <rect x="0" y="48" width="40" height="18" rx="2" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
            <text x="20" y="60" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono">SSR-1</text>
          </g>
        </g>

        {/* ========================================================================= */}
        {/* PANEL 3 (TOP RIGHT): PRODUCTION & DRAIN COUNTERS & ROLLER CONVEYOR        */}
        {/* ========================================================================= */}
        <g transform="translate(615, 15)" opacity={conveyorOpacity}>
          <rect x="0" y="0" width="350" height="235" rx="8" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          <rect x="5" y="5" width="145" height="20" rx="3" fill="#1e293b" />
          <text x="77.5" y="19" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">Conveyor Belt A &amp; Sealer</text>

          {/* Conveyor Rollers (DZN-1, DZN-2) */}
          <g transform="translate(15, 30)">
            <rect x="0" y="0" width="180" height="34" rx="17" fill="url(#scadaBeltGrad)" stroke={m1Color} strokeWidth="2.5" />
            <g transform="translate(20, 17)">
              <g className={m1Running ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cx="0" cy="0" r="12" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#94a3b8" strokeWidth="2" />
              </g>
            </g>
            <g transform="translate(90, 17)">
              <g className={m1Running ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cx="0" cy="0" r="12" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#94a3b8" strokeWidth="2" />
              </g>
            </g>
            <g transform="translate(160, 17)">
              <g className={m1Running ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cx="0" cy="0" r="12" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#94a3b8" strokeWidth="2" />
              </g>
            </g>

            {/* Conveyor Speed Badge */}
            <rect x="40" y="42" width="100" height="22" rx="3" fill="#000000" stroke="#00e676" strokeWidth="1.5" />
            <text x="90" y="56" textAnchor="middle" fill="#00e676" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">{speedVal.toFixed(1)} m/s</text>
          </g>

          {/* Motors & Buttons */}
          <g transform="translate(210, 30)">
            {/* MOTOR 1 */}
            <rect x="0" y="0" width="125" height="60" rx="6" fill="url(#scadaMetalGrad)" stroke={m1Color} strokeWidth="2" />
            <g transform="translate(100, 30)">
              <g className={m1Running ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cx="0" cy="0" r="14" fill="#0f172a" stroke={m1Color} strokeWidth="1.5" />
                <path d="M -9 -9 L 9 9 M -9 9 L 9 -9" stroke={m1Color} strokeWidth="2" />
              </g>
            </g>
            <text x="50" y="34" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">MOTOR 1</text>

            {/* MOTOR 2 (AUX VFD) GRAPHIC - Dynamic when present or added by AI */}
            {(hasMotor2 || liveState.Motor_2_RunStatus !== undefined || Boolean(liveState.hasMotor2)) ? (
              <g transform="translate(0, 70)">
                <rect x="0" y="0" width="125" height="60" rx="6" fill="url(#scadaMetalGrad)" stroke={m2Running ? "#00e676" : "#f59e0b"} strokeWidth="2" />
                <g transform="translate(100, 30)">
                  <g className={m2Running ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                    <circle cx="0" cy="0" r="14" fill="#0f172a" stroke={m2Running ? "#00e676" : "#f59e0b"} strokeWidth="1.5" />
                    <path d="M -9 -9 L 9 9 M -9 9 L 9 -9" stroke={m2Running ? "#00e676" : "#f59e0b"} strokeWidth="2" />
                  </g>
                </g>
                <text x="50" y="24" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="Chakra Petch">MOTOR 2 (AUX)</text>
                <text x="50" y="42" textAnchor="middle" fill={m2Running ? "#00e676" : "#ef4444"} fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">{m2Running ? '● RUNNING' : '○ STOPPED'}</text>
              </g>
            ) : (
              <g transform="translate(0, 70)">
                <rect x="0" y="0" width="125" height="24" rx="4" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
                <text x="62" y="16" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">RO Kapat / Stop</text>
              </g>
            )}
          </g>

          {/* DZN-1 / DZN-2 Status Lamps */}
          <g transform="translate(15, 115)">
            <rect x="0" y="0" width="60" height="20" rx="3" fill="#064e3b" stroke="#00e676" strokeWidth="1" />
            <text x="30" y="14" textAnchor="middle" fill="#00e676" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">DZN-2</text>
            <rect x="0" y="26" width="60" height="20" rx="3" fill="#064e3b" stroke="#00e676" strokeWidth="1" />
            <text x="30" y="40" textAnchor="middle" fill="#00e676" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">DZN-1</text>
          </g>

          {/* Temperature Readout Box */}
          <g transform="translate(90, 115)">
            <rect x="0" y="0" width="110" height="46" rx="4" fill="#000000" stroke={isTempCritical ? "#ef4444" : "#38bdf8"} strokeWidth="1.5" className={isTempCritical ? "scada-alarm-flash" : ""} />
            <text x="55" y="16" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">LINE TEMP (PV)</text>
            <text x="55" y="34" textAnchor="middle" fill={isTempCritical ? "#ef4444" : "#38bdf8"} fontSize="14" fontWeight="bold" fontFamily="JetBrains Mono">{tempVal.toFixed(1)} °C</text>
          </g>
        </g>

        {/* ========================================================================= */}
        {/* PANEL 4 (BOTTOM LEFT): DUAL BUFFER TANKS (RED & BLUE) & SAND FILTER       */}
        {/* ========================================================================= */}
        <g transform="translate(15, 260)" opacity={fluidOpacity}>
          <rect x="0" y="0" width="420" height="165" rx="8" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          <rect x="5" y="5" width="135" height="18" rx="3" fill="#1e293b" />
          <text x="67.5" y="17" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="Chakra Petch">Buffer Tanks &amp; Filter</text>

          {/* Mode Selectors positioned clearly at top right to avoid pipe intersection */}
          <g transform="translate(345, 8)">
            <rect x="0" y="0" width="70" height="50" rx="4" fill="#030712" stroke="#1e293b" strokeWidth="1" />
            <text x="6" y="14" fill="#38bdf8" fontSize="8" fontWeight="bold" fontFamily="JetBrains Mono">● Otomatik</text>
            <text x="6" y="28" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">○ Direkt</text>
            <text x="6" y="42" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">○ Manuel</text>
          </g>

          {/* Red Fluid Tank (350.0 Cm) */}
          <g transform="translate(15, 28)">
            <rect x="0" y="0" width="70" height="85" rx="4" fill="url(#scadaMetalGrad)" stroke="#ef4444" strokeWidth="2" />
            <rect x="5" y="15" width="60" height="65" fill="url(#scadaRedFluidGrad)" />
            <text x="35" y="45" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">350.0 Cm</text>
            <rect x="5" y="92" width="60" height="18" rx="2" fill="#000000" stroke="#ef4444" strokeWidth="1" />
            <text x="35" y="104" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">1798 M3</text>
          </g>

          {/* Blue Fluid Tank (347.6 Cm) */}
          <g transform="translate(100, 28)">
            <rect x="0" y="0" width="70" height="85" rx="4" fill="url(#scadaMetalGrad)" stroke="#0284c7" strokeWidth="2" />
            <rect x="5" y="20" width="60" height="60" fill="url(#scadaBlueFluidGrad)" />
            <text x="35" y="45" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">347.6 Cm</text>
            <rect x="5" y="92" width="60" height="18" rx="2" fill="#000000" stroke="#0284c7" strokeWidth="1" />
            <text x="35" y="104" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">3980 M3</text>
          </g>

          {/* Buffer Infeed Pump */}
          <g transform="translate(185, 75)">
            <circle cx="20" cy="20" r="20" fill="url(#scadaMetalGrad)" stroke={pumpColor} strokeWidth="2" />
            <g transform="translate(20, 20)">
              <g className={pumpRunning ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#38bdf8" strokeWidth="2" />
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#38bdf8" strokeWidth="2" />
              </g>
            </g>
            <text x="20" y="48" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="bold" fontFamily="Chakra Petch">FEED PUMP</text>
          </g>

          {/* Sand Filter Vessel (Kum Filtresi) */}
          <g transform="translate(260, 45)">
            <rect x="0" y="0" width="75" height="70" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="37" y="16" textAnchor="middle" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="Chakra Petch">Kum Filtresi</text>
            <rect x="10" y="24" width="55" height="38" fill="#1e293b" />
            <rect x="15" y="40" width="45" height="20" fill="#38bdf8" opacity="0.8" />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* PANEL 5 (BOTTOM RIGHT): MAIN SECONDARY RESERVOIRS & DISTRIBUTION PUMP     */}
        {/* ========================================================================= */}
        <g transform="translate(450, 260)" opacity={fluidOpacity}>
          <rect x="0" y="0" width="515" height="165" rx="8" fill="#090d16" stroke="#1e293b" strokeWidth="2" />
          {/* Expanded header pill to fit full title without text truncation */}
          <rect x="5" y="5" width="210" height="18" rx="3" fill="#1e293b" />
          <text x="110" y="17" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold" fontFamily="Chakra Petch">Derenin Karşısı / Main Reservoirs</text>

          {/* Tank 1 (359.9 Cm) */}
          <g transform="translate(15, 28)">
            <rect x="0" y="0" width="90" height="110" rx="6" fill="url(#scadaMetalGrad)" stroke="#0284c7" strokeWidth="2" />
            <rect x="10" y="15" width="70" height="85" fill="url(#scadaBlueFluidGrad)" />
            <rect x="10" y="0" width="70" height="18" rx="2" fill="#f59e0b" />
            <text x="45" y="13" textAnchor="middle" fill="#000000" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">359.9 Cm</text>
          </g>

          {/* Tank 2 (Counter 462 M3) */}
          <g transform="translate(115, 28)">
            <rect x="0" y="0" width="90" height="110" rx="6" fill="url(#scadaMetalGrad)" stroke="#0284c7" strokeWidth="2" />
            <rect x="10" y="25" width="70" height="35" rx="3" fill="#000000" stroke="#0284c7" strokeWidth="1" />
            <text x="45" y="48" textAnchor="middle" fill="#38bdf8" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">4 6 2</text>
            <text x="45" y="14" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">Toplam M3</text>
          </g>

          {/* System Status Indicators */}
          <g transform="translate(225, 28)">
            <rect x="0" y="0" width="120" height="22" rx="3" fill="#064e3b" stroke="#00e676" strokeWidth="1" />
            <text x="60" y="15" textAnchor="middle" fill="#00e676" fontSize="9" fontWeight="bold" fontFamily="JetBrains Mono">1 Nolu Tank Müsait</text>

            <rect x="0" y="28" width="120" height="22" rx="3" fill="#065f46" stroke="#10b981" strokeWidth="1" />
            <text x="60" y="43" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="Chakra Petch">Sistem Açık (ONLINE)</text>
          </g>

          {/* Distribution Motor Pump */}
          <g transform="translate(360, 60)">
            <rect x="0" y="0" width="105" height="50" rx="6" fill="url(#scadaMetalGrad)" stroke={pumpColor} strokeWidth="2.5" />
            <g transform="translate(90, 25)">
              <g className={pumpRunning ? "scada-spin" : ""} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cx="0" cy="0" r="14" fill="#0f172a" stroke={pumpColor} strokeWidth="2" />
                <path d="M -8 -8 L 8 8 M -8 8 L 8 -8" stroke={pumpColor} strokeWidth="2" />
              </g>
            </g>
            <text x="45" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold" fontFamily="Chakra Petch">MAIN PUMP</text>

            {/* Flow Arrow Out */}
            <polygon points="120,25 105,15 105,35" fill="#00e676" className={pumpRunning ? "animate-pulse" : ""} />
          </g>
        </g>

        {/* ========================================================================= */}
        {/* INTERCONNECTED PIPING NETWORK ON TOP OF ALL PANELS (SLEEK HIGH-TECH PIPES) */}
        {/* ========================================================================= */}
        <g id="scada-top-piping-network">
          {/* 1. Main Feed Pipe: Tank 101 -> Collection Pump -> Counter */}
          <path d="M 85 140 L 160 140 L 160 110 L 245 110" fill="none" stroke="#0284c7" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 85 140 L 160 140 L 160 110 L 245 110" fill="none" stroke="#031329" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 85 140 L 160 140 L 160 110 L 245 110" fill="none" stroke={pumpRunning ? "#0284c7" : "#1e3a8a"} strokeWidth="4" strokeLinejoin="round" opacity={fluidOpacity} />
          {pumpRunning && (
            <path d="M 85 140 L 160 140 L 160 110 L 245 110" fill="none" stroke="#00f3ff" strokeWidth="3.5" strokeLinejoin="round" className="scada-pipe-flow-cyan" filter="url(#neonCyanGlow)" opacity={fluidOpacity} />
          )}
          <circle cx="160" cy="140" r="4" fill="#0f172a" stroke="#00f3ff" strokeWidth="1.5" />
          <circle cx="160" cy="110" r="4" fill="#0f172a" stroke="#00f3ff" strokeWidth="1.5" />

          {/* 2. Disinfectant Tank Dosing Line */}
          <path d="M 245 160 L 245 200 L 110 200 L 110 230" fill="none" stroke="#0284c7" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 245 160 L 245 200 L 110 200 L 110 230" fill="none" stroke="#031329" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 245 160 L 245 200 L 110 200 L 110 230" fill="none" stroke={pumpRunning ? "#38bdf8" : "#1e3a8a"} strokeWidth="3.5" strokeLinejoin="round" opacity={fluidOpacity} />
          {pumpRunning && (
            <path d="M 245 160 L 245 200 L 110 200 L 110 230" fill="none" stroke="#60a5fa" strokeWidth="3" strokeLinejoin="round" className="scada-pipe-flow-blue" opacity={fluidOpacity} />
          )}
          <circle cx="245" cy="200" r="4" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />
          <circle cx="110" cy="200" r="4" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" />

          {/* 3. High Flow Meter -> Main Counter Motor in Panel 2 */}
          <path d="M 345 110 L 415 110 L 415 140" fill="none" stroke="#0284c7" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 345 110 L 415 110 L 415 140" fill="none" stroke="#031329" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 345 110 L 415 110 L 415 140" fill="none" stroke={pumpRunning ? "#0284c7" : "#1e3a8a"} strokeWidth="4" opacity={fluidOpacity} />
          {pumpRunning && (
            <path d="M 345 110 L 415 110 L 415 140" fill="none" stroke="#00f3ff" strokeWidth="3.5" className="scada-pipe-flow-cyan" filter="url(#neonCyanGlow)" opacity={fluidOpacity} />
          )}
          <circle cx="415" cy="110" r="4" fill="#0f172a" stroke="#00f3ff" strokeWidth="1.5" />

          {/* 4. Bottom Dual Buffer Tanks Interconnect Matrix */}
          <path d="M 100 330 L 185 330 L 185 360 L 260 360" fill="none" stroke="#059669" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 100 330 L 185 330 L 185 360 L 260 360" fill="none" stroke="#031329" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 100 330 L 185 330 L 185 360 L 260 360" fill="none" stroke={pumpRunning ? "#10b981" : "#064e3b"} strokeWidth="4" opacity={fluidOpacity} />
          {pumpRunning && (
            <path d="M 100 330 L 185 330 L 185 360 L 260 360" fill="none" stroke="#00e676" strokeWidth="3.5" className="scada-pipe-flow-emerald" filter="url(#neonEmeraldGlow)" opacity={fluidOpacity} />
          )}
          <circle cx="185" cy="330" r="4" fill="#0f172a" stroke="#00e676" strokeWidth="1.5" />
          <circle cx="185" cy="360" r="4" fill="#0f172a" stroke="#00e676" strokeWidth="1.5" />

          {/* 5. Buffer Pump -> Sand Filter -> Main Distribution Tank */}
          <path d="M 225 355 L 275 355 L 275 325 L 450 325 M 450 325 L 535 325 L 535 390 L 650 390" fill="none" stroke="#0284c7" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 225 355 L 275 355 L 275 325 L 450 325 M 450 325 L 535 325 L 535 390 L 650 390" fill="none" stroke="#031329" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" opacity={fluidOpacity} />
          <path d="M 225 355 L 275 355 L 275 325 L 450 325 M 450 325 L 535 325 L 535 390 L 650 390" fill="none" stroke={pumpRunning ? "#0284c7" : "#1e3a8a"} strokeWidth="4" opacity={fluidOpacity} />
          {pumpRunning && (
            <path d="M 225 355 L 275 355 L 275 325 L 450 325 M 450 325 L 535 325 L 535 390 L 650 390" fill="none" stroke="#00f3ff" strokeWidth="3.5" className="scada-pipe-flow-cyan" filter="url(#neonCyanGlow)" opacity={fluidOpacity} />
          )}
          <circle cx="275" cy="355" r="4" fill="#0f172a" stroke="#00f3ff" strokeWidth="1.5" />
          <circle cx="275" cy="325" r="4" fill="#0f172a" stroke="#00f3ff" strokeWidth="1.5" />
          <circle cx="535" cy="325" r="4" fill="#0f172a" stroke="#00f3ff" strokeWidth="1.5" />
          <circle cx="535" cy="390" r="4" fill="#0f172a" stroke="#00f3ff" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};

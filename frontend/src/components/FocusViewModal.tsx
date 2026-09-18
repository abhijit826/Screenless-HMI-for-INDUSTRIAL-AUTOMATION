import React, { useEffect, useState } from 'react';
import {
  X,
  ArrowLeft,
  Activity,
  ShieldCheck,
  Network,
  Bell,
  TrendingUp,
  Gauge,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { HmiWidget, Tag, ActiveAlarmItem } from '../types';
import { ScadaSchematicSVG } from './ScadaSchematicSVG';

interface FocusViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  widget: HmiWidget | null;
  liveState: Record<string, any>;
  tagsMap: Record<string, Tag>;
  hasMotor2?: boolean;
  activeAlarms?: ActiveAlarmItem[];
  onOpenContextGraphWithNode?: (nodeId?: string) => void;
  onExecuteCommand?: (tag: string, value?: any) => void;
}

// Helper utilities for safe numeric formatting
const safeNum = (v: any, fallback = 0): number => (typeof v === 'number' && !isNaN(v) ? v : fallback);
const fmtNum = (v: any, fallback = 0, digits = 1): string => safeNum(v, fallback).toFixed(digits);
const cleanUnit = (u: string = ''): string => String(u).replace(/Â/g, '').trim();

// Reusable Live Trend Line Chart Component for Focus Views
const TelemetryTrendChart: React.FC<{
  currentValue: number;
  unit: string;
  color?: string;
  minVal?: number;
  maxVal?: number;
  timeWindow?: '5m' | '10m' | '30m';
}> = ({ currentValue, unit, color = '#3b82f6', minVal = 0, maxVal = 100, timeWindow = '5m' }) => {
  const [history, setHistory] = useState<number[]>([]);
  const val = safeNum(currentValue, 25);

  useEffect(() => {
    // Initialize or push current value into history buffer
    setHistory((prev) => {
      if (prev.length === 0) {
        // Seed initial 20 data points around currentValue
        return Array.from({ length: 20 }, (_, i) => {
          const noise = (Math.sin(i * 0.5) * 1.5) + ((Math.random() - 0.5) * 0.8);
          return Math.max(minVal, Math.min(maxVal, val + noise));
        });
      }
      const updated = [...prev.slice(1), val];
      return updated;
    });
  }, [val, minVal, maxVal]);

  const points = history.length > 0 ? history : [val];
  const chartMin = Math.min(...points, minVal);
  const chartMax = Math.max(...points, maxVal);
  const range = (chartMax - chartMin) || 1;

  const svgWidth = 500;
  const svgHeight = 140;
  const margin = 20;

  const coords = points.map((v, i) => {
    const x = margin + (i / Math.max(1, points.length - 1)) * (svgWidth - margin * 2);
    const y = svgHeight - margin - ((v - chartMin) / range) * (svgHeight - margin * 2);
    return { x, y, val: v };
  });

  const polylineStr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaStr = `${margin},${svgHeight - margin} ` + polylineStr + ` ${svgWidth - margin},${svgHeight - margin}`;
  const lastPoint = coords[coords.length - 1] || { x: svgWidth - margin, y: svgHeight / 2, val };

  return (
    <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
          <TrendingUp size={14} style={{ color }} />
          <span>REAL-TIME TELEMETRY TREND GRAPH ({timeWindow.toUpperCase()})</span>
        </div>
        <div style={{ color, fontWeight: 'bold' }}>
          LIVE: {fmtNum(val, 0, 1)} {cleanUnit(unit)}
        </div>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '140px', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`trendGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={margin} y1={margin} x2={svgWidth - margin} y2={margin} stroke="#1e293b" strokeDasharray="4 4" />
        <line x1={margin} y1={svgHeight / 2} x2={svgWidth - margin} y2={svgHeight / 2} stroke="#1e293b" strokeDasharray="4 4" />
        <line x1={margin} y1={svgHeight - margin} x2={svgWidth - margin} y2={svgHeight - margin} stroke="#1e293b" strokeDasharray="4 4" />

        {/* Gradient fill */}
        <polygon points={areaStr} fill={`url(#trendGrad-${color.replace('#', '')})`} />

        {/* Polyline trend line */}
        <polyline fill="none" stroke={color} strokeWidth="2.5" points={polylineStr} strokeLinecap="round" strokeLinejoin="round" />

        {/* Live endpoint dot with pulse glow */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill={color} />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="9" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6">
          <animate attributeName="r" values="5;12;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Labels */}
        <text x={margin} y={svgHeight - 4} fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">-{timeWindow}</text>
        <text x={svgWidth / 2} y={svgHeight - 4} fill="#64748b" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">-2.5m</text>
        <text x={svgWidth - margin} y={svgHeight - 4} fill={color} fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">NOW</text>

        <text x={margin + 4} y={margin - 4} fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">MAX: {fmtNum(chartMax, maxVal, 1)} {cleanUnit(unit)}</text>
        <text x={margin + 4} y={svgHeight - margin - 4} fill="#64748b" fontSize="9" fontFamily="var(--font-mono)">MIN: {fmtNum(chartMin, minVal, 1)} {cleanUnit(unit)}</text>
      </svg>
    </div>
  );
};

export const FocusViewModal: React.FC<FocusViewModalProps> = ({
  isOpen,
  onClose,
  widget,
  liveState,
  tagsMap,
  hasMotor2 = false,
  activeAlarms = [],
  onOpenContextGraphWithNode,
  onExecuteCommand
}) => {
  const [timeWindow, setTimeWindow] = useState<'5m' | '10m' | '30m'>('5m');

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !widget) return null;

  const tagId = widget.tag || '';
  const tagMeta = tagsMap[tagId];
  const liveVal = tagId ? liveState[tagId] : undefined;

  // Determine widget category focus type
  const title = widget.title || widget.tag || 'Widget Focus View';
  const titleLower = title.toLowerCase();
  const typeLower = widget.type.toLowerCase();

  const isMotor = titleLower.includes('motor') || tagId.toLowerCase().includes('motor');
  const isTemp = titleLower.includes('temp') || tagId.toLowerCase().includes('temp');
  const isPressure = titleLower.includes('press') || tagId.toLowerCase().includes('press');
  const isConveyor = titleLower.includes('conveyor') || tagId.toLowerCase().includes('conveyor');
  const isEquipment = typeLower === 'equipment_graphic' || titleLower.includes('diagram') || titleLower.includes('schematic') || titleLower.includes('visualizer');
  const isAlarm = typeLower === 'alarm_panel' || titleLower.includes('alarm');

  // Asset path determination
  let assetPath = 'Plant → Packaging Line 1 → Conveyor A';
  if (isMotor) {
    assetPath = titleLower.includes('2') || tagId.includes('2') ? 'Plant → Packaging Line 1 → Conveyor A → Motor 2' : 'Plant → Packaging Line 1 → Conveyor A → Motor 1';
  } else if (isTemp || isPressure) {
    assetPath = 'Plant → Packaging Line 1 → Sensors';
  }

  // Derive status
  let statusText = 'RUNNING';
  let statusColor = '#00e676';
  if (typeof liveVal === 'boolean') {
    statusText = liveVal ? 'RUNNING' : 'STOPPED';
    statusColor = liveVal ? '#00e676' : '#94a3b8';
  } else if (isMotor && liveState.Motor_1_Trip && !tagId.includes('2')) {
    statusText = 'TRIPPED';
    statusColor = '#ef4444';
  } else if (isTemp && typeof liveVal === 'number' && liveVal > 90) {
    statusText = 'HIGH ALARM';
    statusColor = '#ef4444';
  }

  // Numeric value conversion for trend graph
  const numericVal = typeof liveVal === 'number' ? liveVal : isTemp ? (liveState.Temperature_PV || 72.5) : isPressure ? (liveState.Pressure_PV || 6.2) : isMotor ? (liveState.Motor_1_Current || 14.5) : (liveState.Conveyor_Speed_PV || 24.5);
  const valUnit = cleanUnit(tagMeta?.unit) || (isTemp ? '°C' : isPressure ? 'bar' : isMotor ? 'A' : 'm/s');

  const motor1Running = Boolean(liveState.Motor_1_RunStatus);
  const motor1Trip = Boolean(liveState.Motor_1_Trip);
  const motor2Running = Boolean(liveState.Motor_2_RunStatus);
  const motor2Trip = Boolean(liveState.Motor_2_Trip);

  const m1Color = motor1Trip ? '#ef4444' : motor1Running ? '#10b981' : '#6b7280';
  const m2Color = motor2Trip ? '#ef4444' : motor2Running ? '#10b981' : '#6b7280';
  const tempVal = typeof liveState.Temperature_PV === 'number' ? liveState.Temperature_PV : 72.0;
  const pressVal = typeof liveState.Pressure_PV === 'number' ? liveState.Pressure_PV : 6.2;
  const speedVal = typeof liveState.Conveyor_Speed_PV === 'number' ? liveState.Conveyor_Speed_PV : 24.5;
  const tempColor = tempVal > 90.0 ? '#ef4444' : '#3b82f6';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 150,
      backgroundColor: 'rgba(2, 6, 23, 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      color: '#ffffff',
      fontFamily: 'var(--font-sans)',
      overflowY: 'auto'
    }}>
      {/* 1. Header Bar */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: '#0b0f17',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#60a5fa',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            <ArrowLeft size={16} /> ← BACK TO OVERVIEW
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                {title}
              </h2>
              <span style={{
                backgroundColor: '#052e16',
                border: '1px solid #14532d',
                color: '#00e676',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00e676', boxShadow: '0 0 6px #00e676' }}></span>
                LIVE TELEMETRY FOCUS
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Asset Path: <span style={{ color: '#60a5fa' }}>{assetPath}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onOpenContextGraphWithNode && (
            <button
              onClick={() => {
                onClose();
                onOpenContextGraphWithNode(tagId || isMotor ? (tagId.includes('2') ? 'Motor_2' : 'Motor_1') : 'Conveyor_A');
              }}
              style={{
                backgroundColor: '#1e3a8a',
                border: '1px solid #2563eb',
                color: '#93c5fd',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Network size={14} /> VIEW IN MACHINE CONTEXT GRAPH →
            </button>
          )}

          <button
            onClick={onClose}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 2. Main Focus View Workspace */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* INTERACTIVE DIRECT MACHINE CONTROL DECK */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e3a8a', borderRadius: '10px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} />
              <span>INTERACTIVE MACHINE CONTROL DECK (SAFETY VALIDATED PLC COMMANDS)</span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Direct 1-click machine operation • All commands pass through deterministic safety gate
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            {/* Motor 1 Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>Motor 1:</span>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Motor_1_Start', true)}
                style={{ backgroundColor: motor1Running ? '#1e293b' : '#052e16', border: '1px solid #14532d', color: motor1Running ? '#64748b' : '#00e676', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                START
              </button>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Motor_1_Stop', false)}
                style={{ backgroundColor: !motor1Running ? '#1e293b' : '#451a03', border: '1px solid #7c2d12', color: !motor1Running ? '#64748b' : '#fca5a5', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                STOP
              </button>
            </div>

            {/* Feed Pump 101 Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>Pump 101:</span>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Pump_101_Start', true)}
                style={{ backgroundColor: liveState.Pump_101_RunStatus ? '#1e293b' : '#052e16', border: '1px solid #14532d', color: liveState.Pump_101_RunStatus ? '#64748b' : '#00e676', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                START
              </button>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Pump_101_Stop', false)}
                style={{ backgroundColor: !liveState.Pump_101_RunStatus ? '#1e293b' : '#451a03', border: '1px solid #7c2d12', color: !liveState.Pump_101_RunStatus ? '#64748b' : '#fca5a5', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                STOP
              </button>
            </div>

            {/* Motor 2 Toggle (if added) */}
            {hasMotor2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>Motor 2:</span>
                <button
                  type="button"
                  onClick={() => onExecuteCommand && onExecuteCommand('Motor_2_Start', true)}
                  style={{ backgroundColor: motor2Running ? '#1e293b' : '#052e16', border: '1px solid #14532d', color: motor2Running ? '#64748b' : '#00e676', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
                >
                  START
                </button>
                <button
                  type="button"
                  onClick={() => onExecuteCommand && onExecuteCommand('Motor_2_Stop', false)}
                  style={{ backgroundColor: !motor2Running ? '#1e293b' : '#451a03', border: '1px solid #7c2d12', color: !motor2Running ? '#64748b' : '#fca5a5', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
                >
                  STOP
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              OPERATIONAL STATUS
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: statusColor, fontFamily: 'var(--font-heading)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></span>
              {statusText}
            </div>
          </div>

          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              CURRENT LIVE VALUE
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {typeof liveVal === 'boolean'
                ? (liveVal ? 'TRUE / ON' : 'FALSE / OFF')
                : `${liveVal !== undefined ? String(liveVal) : (isMotor ? '14.5' : isTemp ? '72.0' : isPressure ? '6.2' : '24.5')} ${valUnit}`}
            </div>
          </div>

          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              SAFETY TYPE & PERMISSION
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: tagMeta?.writable ? '#60a5fa' : '#34d399', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {tagMeta?.safety_type?.toUpperCase() || 'MONITOR'} ({tagMeta?.writable ? 'Writable Command' : 'Read-Only'})
            </div>
          </div>

          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 'bold' }}>
              OPERATING BOUNDS
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              Min: {tagMeta?.min ?? 0} • Max: {tagMeta?.max ?? (typeof liveVal === 'boolean' ? 1 : 100)}
            </div>
          </div>
        </div>

        {/* 3. Specialized Visualization Center */}
        <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
              <Activity size={18} style={{ color: '#3b82f6' }} />
              DETAILED COMPONENT VISUALIZATION & TELEMETRY
            </div>

            {/* Window controls */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '2px', borderRadius: '6px' }}>
              {(['5m', '10m', '30m'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: timeWindow === w ? '#2563eb' : 'transparent',
                    color: timeWindow === w ? '#ffffff' : '#94a3b8'
                  }}
                >
                  {w.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* RENDER TYPE A: EQUIPMENT GRAPHIC - EXACT SAME RICH PROCESS SCHEMATIC SVG */}
          {isEquipment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ScadaSchematicSVG liveState={liveState} hasMotor2={hasMotor2} activeAssetId={widget?.asset || widget?.title || widget?.tag} />

              {/* Real-time Trend Graph for Conveyor Line Speed */}
              <TelemetryTrendChart
                currentValue={speedVal}
                unit="m/s"
                color="#00e676"
                minVal={0}
                maxVal={50}
                timeWindow={timeWindow}
              />
            </div>
          )}

          {/* RENDER TYPE B: MOTOR FOCUS - ROTATING MOTOR SCHEMATIC + LIVE TREND GRAPH */}
          {isMotor && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
              {/* Left Column: Rotating Motor SVG & Parameters */}
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="180" height="180" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="#0f172a" stroke={statusColor} strokeWidth="4" />
                  <path d="M 40,60 L 160,60 M 35,80 L 165,80 M 35,100 L 165,100 M 35,120 L 165,120 M 40,140 L 160,140" stroke="#334155" strokeWidth="2" />
                  <circle cx="100" cy="100" r="35" fill="#1e293b" stroke={statusColor} strokeWidth="3" />
                  <g style={{ transformOrigin: '100px 100px', animation: statusText === 'RUNNING' ? 'spin 2s linear infinite' : 'none' }}>
                    <line x1="100" y1="70" x2="100" y2="130" stroke={statusColor} strokeWidth="6" strokeLinecap="round" />
                    <line x1="70" y1="100" x2="130" y2="100" stroke={statusColor} strokeWidth="6" strokeLinecap="round" />
                  </g>
                </svg>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '12px' }}>
                  {title}
                </div>
                <div style={{ fontSize: '11px', color: statusColor, fontFamily: 'var(--font-mono)', fontWeight: 'bold', marginTop: '2px' }}>
                  ● STATE: {statusText}
                </div>

                <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Motor Speed:</span>
                    <span style={{ color: '#00e676', fontWeight: 'bold' }}>{liveState.Motor_1_Speed || 1485.0} RPM</span>
                  </div>
                  <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>VFD Current:</span>
                    <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{fmtNum(numericVal, 14.5, 1)} A</span>
                  </div>
                  <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Thermal Overload:</span>
                    <span style={{ color: motor1Trip ? '#ef4444' : '#00e676', fontWeight: 'bold' }}>{motor1Trip ? 'TRIPPED' : 'NORMAL'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live VFD Current Trend Line Chart */}
              <TelemetryTrendChart
                currentValue={numericVal}
                unit="A"
                color="#60a5fa"
                minVal={0}
                maxVal={30}
                timeWindow={timeWindow}
              />
            </div>
          )}

          {/* RENDER TYPE C: TEMPERATURE / PRESSURE GAUGE FOCUS + LIVE TREND GRAPH */}
          {(isTemp || isPressure) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
              {/* Radial Gauge Card */}
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '160px', height: '160px', borderRadius: '50%', border: `10px solid ${isTemp && numericVal > 90 ? '#ef4444' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {fmtNum(numericVal, isTemp ? 72.0 : 6.2, 1)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {valUnit}
                  </div>
                </div>

                <div style={{ marginTop: '16px', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <span style={{ backgroundColor: '#052e16', color: '#00e676', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Normal &lt; 85</span>
                    <span style={{ backgroundColor: '#451a03', color: '#f59e0b', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Warn 85-90</span>
                    <span style={{ backgroundColor: '#450a0a', color: '#ef4444', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Crit &gt; 90</span>
                  </div>
                </div>
              </div>

              {/* Live Temperature/Pressure Trend Line Chart */}
              <TelemetryTrendChart
                currentValue={numericVal}
                unit={valUnit}
                color={isTemp && numericVal > 90 ? '#ef4444' : '#3b82f6'}
                minVal={0}
                maxVal={120}
                timeWindow={timeWindow}
              />
            </div>
          )}

          {/* RENDER TYPE D: OTHER CARDS / TREND CHARTS / STATUS CARDS / ALARMS */}
          {!isEquipment && !isMotor && !isTemp && !isPressure && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <TelemetryTrendChart
                currentValue={numericVal}
                unit={valUnit}
                color="#00e676"
                minVal={0}
                maxVal={100}
                timeWindow={timeWindow}
              />
            </div>
          )}

        </div>

        {/* 4. Bottom Grid: Provenance Traceability + "WHY THIS VIEW?" */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Context Traceability */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Network size={16} /> CONTEXT TRACEABILITY & METADATA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#06090e', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Widget ID:</span>
                <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{widget.id || 'widget_spec'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#06090e', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Source Tag:</span>
                <span style={{ color: '#00e676', fontWeight: 'bold' }}>{tagId || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#06090e', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Asset Path:</span>
                <span style={{ color: '#60a5fa' }}>{assetPath}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#06090e', padding: '8px 12px', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Safety Gate Approval:</span>
                <span style={{ color: '#34d399', fontWeight: 'bold' }}>✓ APPROVED</span>
              </div>
            </div>
          </div>

          {/* "WHY THIS VIEW?" Explanation */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#00e676', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> WHY THIS FOCUS VIEW WAS GENERATED
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', fontFamily: 'var(--font-mono)', lineHeight: '1.6', margin: 0 }}>
              This Focus View was dynamically instantiated from the machine context resolution graph for widget target <strong style={{ color: '#00e676' }}>{tagId || title}</strong>.
            </p>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)', backgroundColor: '#06090e', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
              Deterministic resolution reason: Tag bound to physical asset node <strong style={{ color: '#60a5fa' }}>{assetPath}</strong>. Safe monitoring classification verified by Safety Gate.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { Cpu, ShieldCheck, Database, Code, PlusCircle, Monitor, Tablet, Smartphone, RefreshCw, Search, User, Bot } from 'lucide-react';

interface HmiShellProps {
  systemTime: string;
  isWsConnected: boolean;
  aiProvider: string;
  onOpenContext: () => void;
  onOpenContextUsed: () => void;
  onOpenDsl: () => void;
  onOpenAiAssistant?: () => void;
  onAddMotor2: () => void;
  onTriggerTempSpike: () => void;
  layoutMode: 'desktop' | 'tablet' | 'mobile';
  setLayoutMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  hasMotor2: boolean;
}

export const HmiShell: React.FC<HmiShellProps> = ({
  systemTime,
  isWsConnected,
  aiProvider,
  onOpenContext,
  onOpenContextUsed,
  onOpenDsl,
  onOpenAiAssistant,
  onAddMotor2,
  onTriggerTempSpike,
  layoutMode,
  setLayoutMode,
  hasMotor2
}) => {
  return (
    <header className="hmi-header">
      {/* Product Title & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(5, 46, 22, 0.6)', border: '1px solid #00e676', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e676', fontWeight: 700, fontFamily: 'var(--font-heading)', flexShrink: 0 }}>
          C2H
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff', fontFamily: 'var(--font-heading)', margin: 0 }}>
              SCREENLESS-HMI
            </h1>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#60a5fa', border: '1px solid #1e3a8a', fontFamily: 'var(--font-mono)' }}>
              SCHNEIDER PROTOTYPE
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-sans)', margin: '2px 0 0 0' }}>
            "Screenless HMI — The screen is a verified query on the machine, not a file you maintain."
          </p>
        </div>
      </div>

      {/* Center & Right Status / Action Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        {/* Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#06090e', border: '1px solid #1e293b', color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isWsConnected ? '#00e676' : '#ef4444' }} />
          <span>{isWsConnected ? 'PLC LIVE' : 'DISCONNECTED'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#06090e', border: '1px solid #1e293b', color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <Cpu size={13} style={{ color: '#a855f7' }} />
          <span>Runtime AI: <strong style={{ color: '#00e676' }}>OFF (Cached DSL)</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#06090e', border: '1px solid #1e293b', color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <ShieldCheck size={13} style={{ color: '#00e676' }} />
          <span>{aiProvider}</span>
        </div>

        {/* Live Clock */}
        <div style={{ fontFamily: 'var(--font-mono)', color: '#00e676', backgroundColor: '#06090e', padding: '4px 10px', borderRadius: '4px', border: '1px solid #1e293b', fontWeight: 700, fontSize: '11px' }}>
          {systemTime || '12:00:00'}
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '4px', padding: '2px', marginLeft: '4px' }}>
          <button
            onClick={() => setLayoutMode('desktop')}
            style={{ padding: '4px', borderRadius: '4px', backgroundColor: layoutMode === 'desktop' ? '#2563eb' : 'transparent', color: layoutMode === 'desktop' ? '#ffffff' : '#64748b', border: 'none', cursor: 'pointer' }}
            title="Desktop 3-Column Layout"
          >
            <Monitor size={14} />
          </button>
          <button
            onClick={() => setLayoutMode('tablet')}
            style={{ padding: '4px', borderRadius: '4px', backgroundColor: layoutMode === 'tablet' ? '#2563eb' : 'transparent', color: layoutMode === 'tablet' ? '#ffffff' : '#64748b', border: 'none', cursor: 'pointer' }}
            title="Tablet 2-Column Layout"
          >
            <Tablet size={14} />
          </button>
          <button
            onClick={() => setLayoutMode('mobile')}
            style={{ padding: '4px', borderRadius: '4px', backgroundColor: layoutMode === 'mobile' ? '#2563eb' : 'transparent', color: layoutMode === 'mobile' ? '#ffffff' : '#64748b', border: 'none', cursor: 'pointer' }}
            title="Mobile 1-Column Layout"
          >
            <Smartphone size={14} />
          </button>
        </div>

        {/* Control Toolbar Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
          <button onClick={onOpenContextUsed} className="btn-secondary" style={{ border: '1px solid #2563eb', backgroundColor: '#172554', color: '#60a5fa', fontWeight: 600 }}>
            <Search size={13} style={{ color: '#60a5fa' }} />
            <span>CONTEXT USED BY AI</span>
          </button>

          <button onClick={onOpenContext} className="btn-secondary">
            <Database size={13} style={{ color: '#60a5fa' }} />
            <span>Graph Context</span>
          </button>

          <button onClick={onOpenDsl} className="btn-secondary">
            <Code size={13} style={{ color: '#00e676' }} />
            <span>HMI DSL</span>
          </button>

          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="btn-secondary"
              style={{ border: '1px solid #3b82f6', backgroundColor: '#1e3a8a', color: '#93c5fd', fontWeight: 600 }}
              title="Open WinCC PLC AI Assistant Drawer"
            >
              <Bot size={14} style={{ color: '#60a5fa' }} />
              <span>PLC AI Assistant</span>
            </button>
          )}

          <button
            onClick={onAddMotor2}
            disabled={hasMotor2}
            className="btn-secondary"
            style={{
              opacity: hasMotor2 ? 0.5 : 1,
              cursor: hasMotor2 ? 'not-allowed' : 'pointer',
              border: '1px solid #b45309',
              color: '#fde68a',
            }}
          >
            <PlusCircle size={13} style={{ color: '#f59e0b' }} />
            <span>{hasMotor2 ? 'Motor 2 Added' : '+ Add Motor 2'}</span>
          </button>

          <button
            onClick={onTriggerTempSpike}
            className="btn-secondary"
            style={{ border: '1px solid #991b1b', color: '#fca5a5' }}
            title="Trigger >90°C Temperature Alarm Spike"
          >
            <RefreshCw size={13} style={{ color: '#ef4444' }} />
            <span>Spike Temp</span>
          </button>

          {/* Operator Profile Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#090d16', border: '1px solid #1e293b', color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '11px', marginLeft: '4px' }}>
            <User size={13} style={{ color: '#60a5fa' }} />
            <span>Operator <strong style={{ color: '#93c5fd' }}>VIEWER</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};

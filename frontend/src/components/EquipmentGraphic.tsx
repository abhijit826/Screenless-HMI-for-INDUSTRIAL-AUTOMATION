import React, { useState } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, HelpCircle } from 'lucide-react';
import { HmiWidget } from '../types';
import { ScadaSchematicSVG } from './ScadaSchematicSVG';

interface EquipmentGraphicProps {
  widget: HmiWidget;
  liveState: Record<string, any>;
  hasMotor2?: boolean;
  activeAsset?: string;
  onWidgetClick?: (widget: HmiWidget) => void;
  onExecuteCommand?: (tag: string, value?: any) => void;
}

export const EquipmentGraphic: React.FC<EquipmentGraphicProps> = ({
  widget,
  liveState,
  hasMotor2 = false,
  activeAsset,
  onWidgetClick,
  onExecuteCommand
}) => {
  const [showProvenance, setShowProvenance] = useState(false);
  const motor1Running = Boolean(liveState.Motor_1_RunStatus);
  const motor1Trip = Boolean(liveState.Motor_1_Trip);
  const motor2Running = Boolean(liveState.Motor_2_RunStatus);
  const motor2Trip = Boolean(liveState.Motor_2_Trip);

  return (
    <div
      className="hmi-card col-span-1 md:col-span-3 flex flex-col"
      onClick={() => onWidgetClick && onWidgetClick(widget)}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      title="Click to open Industrial Focus View"
    >
      <div>
        {/* Real-time Animated SCADA Process Schematic with Dynamic ISA-95 Asset Focus */}
        <ScadaSchematicSVG liveState={liveState} hasMotor2={hasMotor2} activeAssetId={activeAsset || widget.title} />
      </div>

      {/* 7. DIRECT INTERACTIVE MACHINE CONTROLS BAR */}
      <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>⚡ DIRECT MACHINE CONTROLS (SAFETY VALIDATED PLC COMMANDS)</span>
          <span style={{ fontSize: '10px', color: '#00e676', fontFamily: 'var(--font-mono)' }}>● LIVE INTERACTION READY</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          {/* Motor 1 Controls */}
          <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>Motor 1</div>
              <div style={{ fontSize: '10px', color: motor1Running ? '#00e676' : '#ef4444', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {motor1Trip ? 'TRIPPED' : motor1Running ? '● RUNNING' : '○ STOPPED'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Motor_1_Start', true)}
                style={{ backgroundColor: motor1Running ? '#1e293b' : '#052e16', border: '1px solid #14532d', color: motor1Running ? '#64748b' : '#00e676', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                START
              </button>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Motor_1_Stop', false)}
                style={{ backgroundColor: !motor1Running ? '#1e293b' : '#451a03', border: '1px solid #7c2d12', color: !motor1Running ? '#64748b' : '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                STOP
              </button>
            </div>
          </div>

          {/* Feed Pump 101 Controls */}
          <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>Feed Pump 101</div>
              <div style={{ fontSize: '10px', color: liveState.Pump_101_RunStatus ? '#00e676' : '#ef4444', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {liveState.Pump_101_RunStatus ? '● RUNNING' : '○ STOPPED'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Pump_101_Start', true)}
                style={{ backgroundColor: liveState.Pump_101_RunStatus ? '#1e293b' : '#052e16', border: '1px solid #14532d', color: liveState.Pump_101_RunStatus ? '#64748b' : '#00e676', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                START
              </button>
              <button
                type="button"
                onClick={() => onExecuteCommand && onExecuteCommand('Pump_101_Stop', false)}
                style={{ backgroundColor: !liveState.Pump_101_RunStatus ? '#1e293b' : '#451a03', border: '1px solid #7c2d12', color: !liveState.Pump_101_RunStatus ? '#64748b' : '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              >
                STOP
              </button>
            </div>
          </div>

          {/* Motor 2 Controls (if present) */}
          {hasMotor2 && (
            <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', fontFamily: 'var(--font-heading)' }}>Motor 2 (New)</div>
                <div style={{ fontSize: '10px', color: motor2Running ? '#00e676' : '#ef4444', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {motor2Trip ? 'TRIPPED' : motor2Running ? '● RUNNING' : '○ STOPPED'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => onExecuteCommand && onExecuteCommand('Motor_2_Start', true)}
                  style={{ backgroundColor: motor2Running ? '#1e293b' : '#052e16', border: '1px solid #14532d', color: motor2Running ? '#64748b' : '#00e676', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
                >
                  START
                </button>
                <button
                  type="button"
                  onClick={() => onExecuteCommand && onExecuteCommand('Motor_2_Stop', false)}
                  style={{ backgroundColor: !motor2Running ? '#1e293b' : '#451a03', border: '1px solid #7c2d12', color: !motor2Running ? '#64748b' : '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
                >
                  STOP
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Open Focus View Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1e293b', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
        <span>↗ CLICK ANYWHERE TO OPEN FULL PROCESS FOCUS VIEW</span>
      </div>

      {/* Collapsible Provenance Footer */}
      <div className="provenance-box" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setShowProvenance(!showProvenance)}
          className="provenance-toggle"
        >
          {showProvenance ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={11} /> WHY THIS WIDGET?
          </span>
        </button>
        {showProvenance && (
          <div className="provenance-content">
            <div><span className="text-gray-400">Asset Binding:</span> {widget.asset || 'Conveyor_A'}</div>
            <div><span className="text-gray-400">State Tag:</span> {widget.stateTag || 'Motor_1_RunStatus'}</div>
            <div><span className="text-gray-400">Diagram Type:</span> Interactive Process SVG</div>
          </div>
        )}
      </div>
    </div>
  );
};

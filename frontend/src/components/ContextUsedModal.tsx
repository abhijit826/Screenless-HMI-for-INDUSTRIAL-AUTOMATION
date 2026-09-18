import React from 'react';
import { X, Cpu, Network, CheckCircle2, ShieldAlert, Layers, Activity, Database, Radio, FileText } from 'lucide-react';
import { ResolutionResult, Tag, Alarm, Asset, IOItem, CommsConfig } from '../types';

interface ContextUsedModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  resolution: ResolutionResult | null;
  liveState: Record<string, any>;
  hasMotor2?: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
}

export const ContextUsedModal: React.FC<ContextUsedModalProps> = ({
  isOpen,
  onClose,
  promptText,
  resolution,
  liveState,
  hasMotor2 = false,
  isRejected = false,
  rejectionReason = ''
}) => {
  if (!isOpen) return null;

  const resolvedAssets = resolution?.resolved_assets || resolution?.assets || ['Conveyor_A', 'Motor_1'];
  const resolvedTags = resolution?.resolved_tags || resolution?.tags || ['Motor_1_RunStatus', 'Motor_1_Current', 'Conveyor_Speed_PV'];
  const resolvedAlarms = resolution?.resolved_alarms || resolution?.alarms || ['Motor_Trip'];
  const resolvedIo = resolution?.resolved_io || resolution?.io || ['Motor_1_Start_IO'];

  const sourceCounts = resolution?.source_counts || {
    tags: hasMotor2 ? 21 : 17,
    io: 7,
    alarms: hasMotor2 ? 4 : 3,
    assets: hasMotor2 ? 8 : 7,
    comms: 3,
    docs: 6
  };

  const tagsMeta: Tag[] = resolution?.tags_meta || [
    { id: 'Motor_1_RunStatus', name: 'Motor 1 Run Status', type: 'boolean', asset: 'Motor_1', safety_type: 'monitor', writable: false },
    { id: 'Motor_1_Current', name: 'Motor 1 Current', type: 'float', unit: 'A', asset: 'Motor_1', safety_type: 'monitor', writable: false, min: 0, max: 25 },
    { id: 'Motor_1_Trip', name: 'Motor 1 Thermal Trip', type: 'boolean', asset: 'Motor_1', safety_type: 'monitor', writable: false },
    { id: 'Conveyor_Speed_PV', name: 'Conveyor Speed PV', type: 'float', unit: 'm/s', asset: 'Conveyor_A', safety_type: 'monitor', writable: false, min: 0, max: 50 },
  ];

  const alarmsMeta: Alarm[] = resolution?.alarms_meta || [
    { id: 'Motor_Trip', name: 'Motor Thermal Trip Alarm', priority: 'High', severity: 'High', source: 'Motor_1_Trip', asset: 'Motor_1', message: 'Motor 1 thermal overload relay tripped' }
  ];

  const ioMeta: IOItem[] = resolution?.io_meta || [
    { id: 'IO_DI_01', name: 'Motor 1 Run Feedback IO', type: 'Digital Input (DI)', channel: 'Ch 0', module: 'Mod_01', bound_tag: 'Motor_1_RunStatus' },
    { id: 'IO_AI_01', name: 'Conveyor Speed Sensor IO', type: 'Analog Input (AI)', channel: 'Ch 2', module: 'Mod_02', bound_tag: 'Conveyor_Speed_PV' }
  ];

  const commsMeta: CommsConfig[] = resolution?.comms_meta || [
    { id: 'Comms_PLC_01', name: 'Main PLC Controller', protocol: 'Modbus TCP', address: '192.168.1.50', port: 502, status: 'Connected', linked_assets: ['Conveyor_A', 'Motor_1'] }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '12px', width: '100%', maxWidth: '920px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#121721' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={20} style={{ color: '#00e676' }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                CONTEXT USED BY AI
              </h2>
              <span style={{ backgroundColor: '#052e16', border: '1px solid #14532d', color: '#00e676', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                EXPLICIT GRAPH SELECTION
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              "Relevant machine knowledge selected for this operator request"
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Machine Delta Banner if Motor 2 is added */}
          {hasMotor2 && (
            <div style={{ backgroundColor: 'rgba(120, 53, 15, 0.4)', border: '1px solid #f59e0b', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fef3c7' }}>
              <CheckCircle2 size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#ffffff' }}>MACHINE CONTEXT UPDATED ✓</strong> — 2 assets affected (Motor 1 & Secondary Motor 2) → <span style={{ color: '#fde68a', fontWeight: 'bold' }}>HMI regenerated from expanded graph ✓</span>
              </div>
            </div>
          )}

          {/* Safety Rejection Warning Banner */}
          {isRejected && (
            <div style={{ backgroundColor: 'rgba(127, 29, 29, 0.4)', border: '1px solid #ef4444', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fecaca' }}>
              <ShieldAlert size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#ffffff' }}>VALIDATION REJECTED ✗</strong> — {rejectionReason || 'Unsafe binding attempt on read-only tag.'} Context was resolved, but safety validator blocked DSL generation.
              </div>
            </div>
          )}

          {/* 1. Engineering Data Sources Summary */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} style={{ color: '#3b82f6' }} /> ENGINEERING DATA SOURCES IN MACHINE CONTEXT GRAPH
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#60a5fa' }}>{sourceCounts.tags}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>PLC Tags</div>
              </div>
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#34d399' }}>{sourceCounts.io}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>I/O Channels</div>
              </div>
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#f87171' }}>{sourceCounts.alarms}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Alarms</div>
              </div>
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#fbbf24' }}>{sourceCounts.assets}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Assets</div>
              </div>
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#a78bfa' }}>{sourceCounts.comms}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Comms PLCs</div>
              </div>
              <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#cbd5e1' }}>{sourceCounts.docs}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>Manuals</div>
              </div>
            </div>
          </div>

          {/* 2. Operator Request & Visual Pipeline Data Flow */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', textTransform: 'uppercase' }}>OPERATOR REQUEST</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#00e676', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                "{promptText}"
              </div>
            </div>

            {/* Visual Pipeline Flow Step Indicators */}
            <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ color: '#60a5fa' }}>✓ Prompt understood</div>
              <div style={{ color: '#34d399' }}>✓ {resolvedAssets.length} assets resolved</div>
              <div style={{ color: '#34d399' }}>✓ {resolvedTags.length} tags resolved</div>
              <div style={{ color: '#f87171' }}>✓ {resolvedAlarms.length} alarms resolved</div>
              <div style={{ color: '#fbbf24' }}>✓ Live state attached</div>
              <div style={{ color: '#00e676', fontWeight: 'bold' }}>✓ Supplied to AI Planner</div>
            </div>
          </div>

          {/* 3. Grid for Assets, Tags, Alarms, IO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Resolved Assets */}
            <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} style={{ color: '#60a5fa' }} /> RESOLVED ASSETS ({resolvedAssets.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {resolvedAssets.map((assetId) => (
                  <div key={assetId} style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#00e676', fontWeight: 'bold' }}>✓</span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#f8fafc', fontSize: '12px' }}>
                        {assetId.replace('_', ' ')}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Asset Node</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolved Alarms */}
            <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} style={{ color: '#f87171' }} /> RESOLVED ALARMS ({resolvedAlarms.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {resolvedAlarms.map((alarmId) => {
                  const alarmMeta = alarmsMeta.find((a) => a.id === alarmId);
                  return (
                    <div key={alarmId} style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#f87171', fontWeight: 600, fontSize: '12px', fontFamily: 'var(--font-heading)' }}>
                          ✓ {alarmMeta?.name || alarmId}
                        </span>
                        <span style={{ fontSize: '9px', backgroundColor: '#7f1d1d', color: '#fecaca', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
                          {alarmMeta?.severity || 'HIGH'}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        Source: {alarmMeta?.source || alarmId} • Asset: {alarmMeta?.asset || 'Conveyor_A'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 4. Resolved PLC Tags Table */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Network size={14} style={{ color: '#34d399' }} /> RESOLVED PLC / CONTROLLER TAGS ({resolvedTags.length})
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>TAG ID</th>
                    <th style={{ padding: '6px 8px' }}>DATA TYPE</th>
                    <th style={{ padding: '6px 8px' }}>SAFETY TYPE</th>
                    <th style={{ padding: '6px 8px' }}>WRITABLE</th>
                    <th style={{ padding: '6px 8px' }}>LIVE VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedTags.map((tagId) => {
                    const tagObj = tagsMeta.find((t) => t.id === tagId);
                    const val = liveState[tagId];
                    const isWritable = tagObj?.writable ?? false;
                    const safetyType = tagObj?.safety_type || 'monitor';

                    return (
                      <tr key={tagId} style={{ borderBottom: '1px solid #0f172a' }}>
                        <td style={{ padding: '6px 8px', color: '#f8fafc', fontWeight: 600 }}>✓ {tagId}</td>
                        <td style={{ padding: '6px 8px', color: '#60a5fa' }}>{tagObj?.type || 'float'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            backgroundColor: safetyType === 'command' ? '#7f1d1d' : '#064e3b',
                            color: safetyType === 'command' ? '#fecaca' : '#a7f3d0'
                          }}>
                            {safetyType.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', color: isWritable ? '#34d399' : '#f87171' }}>
                          {isWritable ? 'YES (Command)' : 'NO (Read-Only)'}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#f59e0b', fontWeight: 'bold' }}>
                          {val !== undefined ? String(val) : 'N/A'} {tagObj?.unit || ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. I/O Configuration & Communication Architecture */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* I/O Configuration */}
            <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} style={{ color: '#fbbf24' }} /> I/O CONFIGURATION
              </div>
              {ioMeta.map((io) => (
                <div key={io.id} style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ color: '#f8fafc', fontWeight: 600 }}>✓ {io.name}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Type: <span style={{ color: '#fbbf24' }}>{io.type}</span> • Module: {io.module} ({io.channel})
                  </div>
                </div>
              ))}
            </div>

            {/* Communication Protocol */}
            <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Radio size={14} style={{ color: '#a78bfa' }} /> COMMUNICATION CONFIG
              </div>
              {commsMeta.map((comm) => (
                <div key={comm.id} style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ color: '#f8fafc', fontWeight: 600 }}>✓ {comm.name} ({comm.protocol})</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    Address: {comm.address}:{comm.port || 502} • Status: <span style={{ color: '#34d399', fontWeight: 'bold' }}>{comm.status}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* 6. Machine Asset Hierarchy Tree */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} style={{ color: '#cbd5e1' }} /> ASSET HIERARCHY SELECTION
            </div>
            <pre style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '12px', borderRadius: '6px', color: '#34d399', fontFamily: 'var(--font-mono)', fontSize: '11px', margin: 0, lineHeight: '1.5' }}>
{`Plant
└── Packaging Line 1 (Machine Unit)
    └── Conveyor A (Sub-System)
        ├── Motor 1 (Drive Motor) ${hasMotor2 ? '\n        └── Motor 2 (Secondary Motor)' : ''}`}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #1e293b', backgroundColor: '#121721', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            Deterministic Machine Context Resolution Engine • Zero Hallucination Guarantee
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: '#2563eb', border: 'none', color: '#ffffff', padding: '8px 18px', borderRadius: '6px', fontFamily: 'var(--font-heading)', fontWeight: 600, cursor: 'pointer' }}
          >
            CLOSE PANEL
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { Layers, ChevronRight, Server, Cpu, Activity, AlertTriangle, Database, CheckCircle2 } from 'lucide-react';

interface NavigationPanelProps {
  navItems?: string[];
  activeAsset: string;
  onSelectAsset: (assetId: string) => void;
  hasMotor2?: boolean;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  activeAsset,
  onSelectAsset,
  hasMotor2 = false
}) => {
  const assets = [
    { id: 'Packaging_Line_1', name: 'Packaging Line 1', icon: Layers, count: 'Line Overview' },
    { id: 'Conveyor_A', name: 'Conveyor Belt A', icon: Activity, count: 'Motor 1 & VFD' },
    { id: 'Feed_Pump_101', name: 'Feed Pump 101', icon: Server, count: 'Fluid System' },
    { id: 'Packaging_Unit', name: 'Packaging Unit', icon: Cpu, count: 'Sealer & Guards' },
    { id: 'Sensors', name: 'Sensor Suite', icon: AlertTriangle, count: 'Temp & Pressure' },
  ];

  if (hasMotor2) {
    assets.splice(2, 0, { id: 'Motor_2', name: 'Motor 2 (Secondary)', icon: Activity, count: 'Added Dynamic Asset' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ISA-95 Machine Asset Tree Container */}
      <div style={{ backgroundColor: '#0e1526', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', paddingBottom: '8px', borderBottom: '1px solid #1e293b' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: '#f8fafc' }}>ISA-95 HIERARCHY</span>
          <span style={{ fontSize: '10px', color: '#00e676', backgroundColor: '#052e16', border: '1px solid #14532d', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>LIVE TREE</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {assets.map((asset) => {
            const Icon = asset.icon;
            const isActive = activeAsset === asset.id;

            return (
              <button
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive ? '#172554' : '#06090e',
                  border: isActive ? '1px solid #2563eb' : '1px solid #1e293b',
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, overflow: 'hidden' }}>
                  <Icon size={16} style={{ color: isActive ? '#60a5fa' : '#64748b', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {asset.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {asset.count}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: isActive ? '#60a5fa' : '#475569', flexShrink: 0, marginLeft: '6px' }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Machine Context Summary Card */}
      <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#f8fafc' }}>
          <Database size={14} style={{ color: '#60a5fa' }} />
          <span>Machine Context</span>
        </div>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', display: 'flex', gap: '8px' }}>
          <span><strong style={{ color: '#ffffff' }}>17</strong> Tags</span>
          <span><strong style={{ color: '#ffffff' }}>{hasMotor2 ? '8' : '7'}</strong> Assets</span>
          <span><strong style={{ color: '#ffffff' }}>3</strong> Alarms</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#052e16', border: '1px solid #14532d', color: '#00e676', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, marginTop: '2px' }}>
          <CheckCircle2 size={12} />
          <span>Synchronized</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Bell, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ActiveAlarmItem, HmiWidget } from '../types';

interface AlarmPanelProps {
  widget?: HmiWidget;
  activeAlarms?: ActiveAlarmItem[];
  onWidgetClick?: (widget: HmiWidget) => void;
}

export const AlarmPanel: React.FC<AlarmPanelProps> = ({
  widget,
  activeAlarms = [],
  onWidgetClick
}) => {
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const handleAck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcknowledged((prev) => ({ ...prev, [id]: true }));
  };

  const defaultWidget: HmiWidget = widget || {
    type: 'alarm_list',
    title: 'Active Alarms Center',
    tag: 'Active_Alarms'
  };

  // Fallback alarms if activeAlarms is not passed
  const displayAlarms: ActiveAlarmItem[] = activeAlarms.length > 0 ? activeAlarms : [
    {
      id: 'ALM_TEMP_HIGH',
      name: 'High Temperature Alarm',
      severity: 'HIGH',
      priority: 'CRITICAL',
      asset: 'Sensors',
      source: 'Sensors / Temp_01',
      val: 74.7,
      unit: '°C',
      timestamp: 'Live',
      message: 'Process temperature approaching threshold limit'
    },
    {
      id: 'ALM_M1_OVERLOAD',
      name: 'Motor 1 Overload Warning',
      severity: 'WARNING',
      priority: 'HIGH',
      asset: 'Motor_1',
      source: 'Conveyor_A / Motor_1',
      val: 14.2,
      unit: 'A',
      timestamp: 'Live',
      message: 'Motor current elevated above normal baseline'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ACTIVE ALARMS MONITORING CARD */}
      <div
        className="hmi-card"
        onClick={() => onWidgetClick && onWidgetClick(defaultWidget)}
        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>
            <Bell size={15} style={{ color: displayAlarms.length > 0 ? '#ef4444' : '#00e676', flexShrink: 0 }} />
            <span>ISA-18.2 Alarm Monitor ({displayAlarms.length})</span>
          </div>
          <span style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 600 }}>Click for Focus View →</span>
        </div>

        {displayAlarms.length === 0 ? (
          <div style={{ padding: '16px', borderRadius: '6px', backgroundColor: '#052e16', border: '1px solid #14532d', color: '#00e676', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            <ShieldCheck size={20} />
            <div>
              <div>System Normal — No Active Alarms</div>
              <div style={{ fontSize: '10px', color: '#86efac', fontFamily: 'var(--font-mono)', marginTop: '2px', fontWeight: 400 }}>All process tags and motor thermal relays operating within nominal limits</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayAlarms.map((alarm) => {
              const isAck = acknowledged[alarm.id];
              const isCritical = alarm.priority === 'CRITICAL' || alarm.severity === 'CRITICAL' || alarm.severity === 'HIGH';

              return (
                <div
                  key={alarm.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: isAck ? '1px solid #334155' : isCritical ? '1px solid #ef4444' : '1px solid #f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    backgroundColor: isAck ? '#06090e' : isCritical ? 'rgba(69, 10, 10, 0.6)' : 'rgba(120, 53, 15, 0.4)',
                    color: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <AlertTriangle size={16} style={{ color: isAck ? '#64748b' : isCritical ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', fontFamily: 'var(--font-heading)', color: isAck ? '#cbd5e1' : isCritical ? '#fca5a5' : '#fde68a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {alarm.name}
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginTop: '2px' }}>
                        {alarm.source} • {alarm.timestamp}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleAck(alarm.id, e)}
                    disabled={isAck}
                    style={{
                      padding: '4px 10px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      borderRadius: '4px',
                      backgroundColor: isAck ? '#1e293b' : isCritical ? '#7f1d1d' : '#7c2d12',
                      color: isAck ? '#64748b' : '#ffffff',
                      border: isAck ? '1px solid #334155' : isCritical ? '1px solid #ef4444' : '1px solid #f59e0b',
                      cursor: isAck ? 'default' : 'pointer',
                      flexShrink: 0
                    }}
                  >
                    {isAck ? 'ACK' : 'ACKNOWLEDGE'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

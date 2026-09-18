import React from 'react';
import { HmiDsl, Tag, ActiveAlarmItem, HmiWidget } from '../types';
import { StatusCard } from '../components/StatusCard';
import { AnalogGauge } from '../components/AnalogGauge';
import { TrendChart } from '../components/TrendChart';
import { AlarmPanel } from '../components/AlarmPanel';
import { EquipmentGraphic } from '../components/EquipmentGraphic';
import { PredictiveMaintenanceWidget } from '../components/PredictiveMaintenanceWidget';
import { CheckCircle, Sun, Activity, Zap, Thermometer, Gauge as GaugeIcon } from 'lucide-react';

interface HmiRendererProps {
  dsl: HmiDsl;
  tagsMap: Record<string, Tag>;
  liveState: Record<string, any>;
  hasMotor2?: boolean;
  activeAsset?: string;
  onWidgetClick?: (widget: HmiWidget) => void;
  onExecuteCommand?: (tag: string, value?: any) => void;
}

export const HmiRenderer: React.FC<HmiRendererProps> = ({
  dsl,
  tagsMap,
  liveState,
  hasMotor2 = false,
  activeAsset,
  onWidgetClick,
  onExecuteCommand
}) => {
  if (!dsl || !dsl.widgets || dsl.widgets.length === 0) {
    return (
      <div style={{ backgroundColor: '#0e1526', border: '1px solid #1e293b', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontFamily: 'var(--font-mono)' }}>No HMI layout generated yet. Enter a prompt above to generate runtime screens.</p>
      </div>
    );
  }

  // Live telemetry calculations
  const speedVal = typeof liveState.Conveyor_Speed_PV === 'number' ? liveState.Conveyor_Speed_PV : 2.5;
  const tempVal = typeof liveState.Temperature_PV === 'number' ? liveState.Temperature_PV : 72.4;
  const pressVal = typeof liveState.Pressure_PV === 'number' ? liveState.Pressure_PV : 4.2;
  const m1CurrentVal = typeof liveState.Motor_1_Current === 'number' ? liveState.Motor_1_Current : 8.4;

  const activeAlarms: ActiveAlarmItem[] = [];
  if (tempVal > 90.0) {
    activeAlarms.push({
      id: 'ALM_TEMP_HIGH',
      name: 'High Temperature Alarm',
      severity: 'HIGH',
      priority: 'HIGH',
      asset: 'Sensors',
      source: 'Sensors / Temp_01',
      val: tempVal,
      unit: '°C',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Process temperature exceeded safety limit of 90.0 °C'
    });
  }

  if (liveState.Motor_1_Trip) {
    activeAlarms.push({
      id: 'ALM_M1_TRIP',
      name: 'Motor 1 Thermal Trip',
      severity: 'CRITICAL',
      priority: 'CRITICAL',
      asset: 'Conveyor_A',
      source: 'Conveyor_A / Motor_1',
      val: 'TRIPPED',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Motor 1 thermal overload relay tripped'
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. SCADA TOP LIVE OVERVIEW HEADER CARD */}
      <div style={{ backgroundColor: '#0e1526', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#172554', border: '1px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {dsl.title || 'Packaging Line 1 — Live Overview'}
              </h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#052e16', border: '1px solid #14532d', color: '#00e676', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                <CheckCircle size={12} /> RUNNING
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              ISA-85: Plant &gt; Line 1 &gt; Conveyor A | Real-time machine status and key process variables
            </p>
          </div>
        </div>

        {/* Ambient Temp & Radial Efficiency Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={18} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>24.8 °C</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-sans)' }}>Ambient</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #1e293b', paddingLeft: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #00e676', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#00e676', fontFamily: 'var(--font-mono)' }}>
              92%
            </div>
            <div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>92% kW</div>
              <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-sans)' }}>Line Efficiency</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SVG EQUIPMENT GRAPHIC CENTERPIECE */}
      <EquipmentGraphic
        widget={{
          type: 'equipment_graphic',
          asset: activeAsset || 'Conveyor_A',
          title: 'Packaging Line Visualizer'
        }}
        liveState={liveState}
        hasMotor2={hasMotor2}
        activeAsset={activeAsset}
        onWidgetClick={onWidgetClick}
        onExecuteCommand={onExecuteCommand}
      />

      {/* 3. KPI CARDS ROW (4 CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* KPI 1: Conveyor Speed */}
        <div
          className="hmi-card"
          onClick={() => onWidgetClick && onWidgetClick({ type: 'analog', tag: 'Conveyor_Speed_PV', title: 'Conveyor Speed' })}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: '#94a3b8', fontWeight: 500 }}>Conveyor Speed</span>
            <Activity size={15} style={{ color: '#00e676' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', margin: '4px 0' }}>
            {speedVal.toFixed(1)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>m/s</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', backgroundColor: '#090d16', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (speedVal / 3.0) * 100)}%`, height: '100%', backgroundColor: '#00e676', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>83% of 3.0</span>
          </div>
        </div>

        {/* KPI 2: Line Temperature */}
        <div
          className="hmi-card"
          onClick={() => onWidgetClick && onWidgetClick({ type: 'analog', tag: 'Temperature_PV', title: 'Line Temperature' })}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: '#94a3b8', fontWeight: 500 }}>Line Temperature</span>
            <Thermometer size={15} style={{ color: tempVal > 90 ? '#ef4444' : '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', margin: '4px 0' }}>
            {tempVal.toFixed(1)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>°C</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', backgroundColor: '#090d16', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (tempVal / 100) * 100)}%`, height: '100%', backgroundColor: tempVal > 90 ? '#ef4444' : '#f59e0b', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: tempVal > 90 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
              {tempVal > 90 ? 'ALARM' : 'NORMAL'}
            </span>
          </div>
        </div>

        {/* KPI 3: Line Pressure */}
        <div
          className="hmi-card"
          onClick={() => onWidgetClick && onWidgetClick({ type: 'analog', tag: 'Pressure_PV', title: 'Line Pressure' })}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: '#94a3b8', fontWeight: 500 }}>Line Pressure</span>
            <GaugeIcon size={15} style={{ color: '#06b6d4' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', margin: '4px 0' }}>
            {pressVal.toFixed(1)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>bar</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', backgroundColor: '#090d16', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (pressVal / 6.0) * 100)}%`, height: '100%', backgroundColor: '#06b6d4', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>NORMAL</span>
          </div>
        </div>

        {/* KPI 4: Motor 1 Current */}
        <div
          className="hmi-card"
          onClick={() => onWidgetClick && onWidgetClick({ type: 'analog', tag: 'Motor_1_Current', title: 'Motor 1 Current' })}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: '#94a3b8', fontWeight: 500 }}>Motor 1 Current</span>
            <Zap size={15} style={{ color: '#00e676' }} />
          </div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', margin: '4px 0' }}>
            {m1CurrentVal.toFixed(1)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>A</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', backgroundColor: '#090d16', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (m1CurrentVal / 25.0) * 100)}%`, height: '100%', backgroundColor: '#00e676', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>NORMAL</span>
          </div>
        </div>
      </div>

      {/* 4. LIVE TELEMETRY TREND CHARTS ROW (3 CHARTS SIDE-BY-SIDE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        <TrendChart
          widget={{ type: 'trend', tag: 'Conveyor_Speed_PV', title: 'Conveyor Speed Trend' }}
          tagMeta={tagsMap.Conveyor_Speed_PV}
          liveVal={speedVal}
          onWidgetClick={onWidgetClick}
        />
        <TrendChart
          widget={{ type: 'trend', tag: 'Temperature_PV', title: 'Temperature Trend' }}
          tagMeta={tagsMap.Temperature_PV}
          liveVal={tempVal}
          onWidgetClick={onWidgetClick}
        />
        <TrendChart
          widget={{ type: 'trend', tag: 'Motor_1_Current', title: 'Motor Current Trend' }}
          tagMeta={tagsMap.Motor_1_Current}
          liveVal={m1CurrentVal}
          onWidgetClick={onWidgetClick}
        />
      </div>

      {/* 5. AI PREDICTIVE MAINTENANCE & ANOMALY DETECTOR */}
      <PredictiveMaintenanceWidget liveState={liveState} />

      {/* 5. DYNAMICALLY GENERATED DSL WIDGETS (IF ANY ADDITIONAL) */}
      {dsl.widgets.filter(w => w.type !== 'equipment_graphic').length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#60a5fa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI-Generated Dynamic Controls &amp; Status
          </div>
          <div className="hmi-render-grid">
            {dsl.widgets.filter(w => w.type !== 'equipment_graphic').map((widget, idx) => {
              const tagMeta = widget.tag ? tagsMap[widget.tag] : undefined;
              const liveVal = widget.tag ? liveState[widget.tag] : undefined;

              switch (widget.type) {
                case 'status':
                case 'kpi':
                  return (
                    <StatusCard
                      key={widget.id || idx}
                      widget={widget}
                      tagMeta={tagMeta}
                      liveVal={liveVal}
                      onWidgetClick={onWidgetClick}
                    />
                  );
                case 'gauge':
                case 'analog':
                  return (
                    <AnalogGauge
                      key={widget.id || idx}
                      widget={widget}
                      tagMeta={tagMeta}
                      liveVal={liveVal}
                      onWidgetClick={onWidgetClick}
                    />
                  );
                case 'trend':
                  return (
                    <TrendChart
                      key={widget.id || idx}
                      widget={widget}
                      tagMeta={tagMeta}
                      liveVal={liveVal}
                      onWidgetClick={onWidgetClick}
                    />
                  );
                case 'alarm_list':
                case 'alarm_banner':
                  return (
                    <AlarmPanel
                      key={widget.id || idx}
                      widget={widget}
                      activeAlarms={activeAlarms}
                      onWidgetClick={onWidgetClick}
                    />
                  );
                default:
                  return (
                    <StatusCard
                      key={widget.id || idx}
                      widget={widget}
                      tagMeta={tagMeta}
                      liveVal={liveVal}
                      onWidgetClick={onWidgetClick}
                    />
                  );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};

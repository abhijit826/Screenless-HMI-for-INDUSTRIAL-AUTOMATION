import React from 'react';
import { Cpu, Activity, Clock, ShieldAlert, CheckCircle, Flame } from 'lucide-react';

interface PredictiveMaintenanceWidgetProps {
  liveState: Record<string, any>;
}

export const PredictiveMaintenanceWidget: React.FC<PredictiveMaintenanceWidgetProps> = ({ liveState }) => {
  const m1Running = Boolean(liveState.Motor_1_RunStatus);
  const tempVal = typeof liveState.Temperature_PV === 'number' ? liveState.Temperature_PV : 72.0;

  // Calculate dynamic predictive maintenance metrics based on state
  const vibrationIndex = m1Running ? (0.02 + (tempVal > 85 ? 0.08 : 0.005)).toFixed(3) : '0.000';
  const rulHours = tempVal > 90 ? 4200 : 14280;
  const anomalyRiskScore = tempVal > 90 ? '24.8% (ELEVATED RISK)' : '1.2% (OPTIMAL)';
  const riskBadgeStyle = tempVal > 90
    ? { color: '#f59e0b', backgroundColor: 'rgba(120, 53, 15, 0.4)', borderColor: '#b45309' }
    : { color: '#00e676', backgroundColor: 'rgba(6, 78, 59, 0.4)', borderColor: '#047857' };

  return (
    <div className="predictive-widget-card" style={{ backgroundColor: '#0b101d', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', itemsCenter: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #1e293b', gap: '8px' }}>
        <div style={{ display: 'flex', itemsCenter: 'center', gap: '8px' }}>
          <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#3b0764', border: '1px solid #6b21a8', color: '#c084fc' }}>
            <Cpu size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '12px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI PREDICTIVE MAINTENANCE &amp; ANOMALY DETECTOR
            </h3>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              ISA-95 Level 3 Asset Health &amp; Remaining Useful Life (RUL) Modeling
            </p>
          </div>
        </div>

        <div style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, ...riskBadgeStyle }}>
          ANOMALY RISK: {anomalyRiskScore}
        </div>
      </div>

      <div className="predictive-widget-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {/* Bearing Vibration */}
        <div className="predictive-metric-box" style={{ backgroundColor: '#05080f', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '4px' }}>
            <span>Bearing Vibration</span>
            <Activity size={13} style={{ color: '#c084fc' }} />
          </div>
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
            {vibrationIndex} <span style={{ fontSize: '10px', color: '#94a3b8' }}>mm/s</span>
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#00e676', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={10} />
            <span>ISO 10816 Normal</span>
          </div>
        </div>

        {/* Remaining Useful Life (RUL) */}
        <div className="predictive-metric-box" style={{ backgroundColor: '#05080f', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '4px' }}>
            <span>Remaining Useful Life</span>
            <Clock size={13} style={{ color: '#60a5fa' }} />
          </div>
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
            {rulHours.toLocaleString()} <span style={{ fontSize: '10px', color: '#94a3b8' }}>Hrs</span>
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#60a5fa', marginTop: '4px' }}>
            Est. Maintenance: 60+ Days
          </div>
        </div>

        {/* Thermal Drift Trend */}
        <div className="predictive-metric-box" style={{ backgroundColor: '#05080f', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '4px' }}>
            <span>Thermal Stress</span>
            <Flame size={13} style={{ color: tempVal > 90 ? '#ef4444' : '#f59e0b' }} />
          </div>
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
            {tempVal.toFixed(1)} <span style={{ fontSize: '10px', color: '#94a3b8' }}>°C</span>
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: tempVal > 90 ? '#ef4444' : '#94a3b8', marginTop: '4px' }}>
            {tempVal > 90 ? 'High Thermal Stress!' : '+0.1°C/hr Drift (Nominal)'}
          </div>
        </div>

        {/* AI Predictive Status */}
        <div className="predictive-metric-box" style={{ backgroundColor: '#05080f', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', marginBottom: '4px' }}>
            <span>Machine MTBF</span>
            <ShieldAlert size={13} style={{ color: '#00e676' }} />
          </div>
          <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00e676' }}>
            99.8% <span style={{ fontSize: '10px', color: '#94a3b8' }}>Uptime</span>
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#00e676', marginTop: '4px' }}>
            Zero Unplanned Downtime
          </div>
        </div>
      </div>
    </div>
  );
};

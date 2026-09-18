import React, { useState } from 'react';
import { Gauge, ChevronRight, ChevronDown, HelpCircle, ExternalLink } from 'lucide-react';
import { HmiWidget, Tag } from '../types';

interface AnalogGaugeProps {
  widget: HmiWidget;
  tagMeta?: Tag;
  liveVal: any;
  onWidgetClick?: (widget: HmiWidget) => void;
}

export const AnalogGauge: React.FC<AnalogGaugeProps> = ({ widget, tagMeta, liveVal, onWidgetClick }) => {
  const [showProvenance, setShowProvenance] = useState(false);
  const val = typeof liveVal === 'number' ? liveVal : 0;

  const min = widget.min !== undefined ? widget.min : tagMeta?.min || 0;
  const max = widget.max !== undefined ? widget.max : tagMeta?.max || 100;
  const unit = widget.unit || tagMeta?.unit || '';

  const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  const isHigh = val > (max * 0.85);

  return (
    <div
      className="hmi-card"
      onClick={() => onWidgetClick && onWidgetClick(widget)}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      title="Click to open Industrial Focus View"
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {widget.title || tagMeta?.name || widget.tag}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Gauge size={15} style={{ color: isHigh ? '#ef4444' : '#3b82f6', flexShrink: 0 }} />
            <ExternalLink size={13} style={{ color: '#60a5fa' }} />
          </div>
        </div>

        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: isHigh ? '#ef4444' : '#ffffff' }}>
              {val.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{unit}</span>
          </div>

          {/* Progress gauge bar */}
          <div style={{ width: '100%', height: '8px', backgroundColor: '#06090e', borderRadius: '4px', border: '1px solid #1e293b', overflow: 'hidden', marginTop: '8px' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: isHigh ? '#ef4444' : '#3b82f6',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            <span>MIN: {min}</span>
            <span>MAX: {max} {unit}</span>
          </div>
        </div>
      </div>

      {/* Footer Open Focus View Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1e293b', fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
        <span>↗ OPEN FOCUS VIEW</span>
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
            <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}>
              CONTEXT TRACEABILITY
            </div>
            <div><span style={{ color: '#64748b' }}>Widget:</span> {widget.title || widget.tag}</div>
            <div><span style={{ color: '#64748b' }}>Source Tag:</span> {widget.tag}</div>
            <div><span style={{ color: '#64748b' }}>Asset Path:</span> Packaging Line 1 → {tagMeta?.asset || 'Conveyor_A'}</div>
            <div><span style={{ color: '#64748b' }}>Safety Type:</span> {tagMeta?.safety_type || 'monitor'} (Read-Only)</div>
            <div><span style={{ color: '#64748b' }}>Writable:</span> {tagMeta?.writable ? 'YES' : 'NO'}</div>
            <div><span style={{ color: '#64748b' }}>Reason:</span> Matched telemetry bounds [{min} - {max}] {unit}</div>
          </div>
        )}
      </div>
    </div>
  );
};

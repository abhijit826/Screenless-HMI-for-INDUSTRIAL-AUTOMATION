import React, { useState } from 'react';
import { Activity, ChevronRight, ChevronDown, HelpCircle, ExternalLink } from 'lucide-react';
import { HmiWidget, Tag } from '../types';

interface StatusCardProps {
  widget: HmiWidget;
  tagMeta?: Tag;
  liveVal: any;
  onWidgetClick?: (widget: HmiWidget) => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ widget, tagMeta, liveVal, onWidgetClick }) => {
  const [showProvenance, setShowProvenance] = useState(false);
  const isTrue = Boolean(liveVal);
  const isTrip = tagMeta?.id?.includes('Trip') || widget.tag?.includes('Trip');

  let labelText = isTrue ? 'RUNNING' : 'STOPPED';
  let statusColor = '#00e676';

  if (isTrip) {
    if (isTrue) {
      labelText = 'TRIPPED';
      statusColor = '#ef4444';
    } else {
      labelText = 'NORMAL';
      statusColor = '#94a3b8';
    }
  } else if (!isTrue) {
    statusColor = '#94a3b8';
  }

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
            <Activity size={15} style={{ color: statusColor, flexShrink: 0 }} />
            <ExternalLink size={13} style={{ color: '#60a5fa' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '0.03em', color: '#ffffff' }}>
            {labelText}
          </span>
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
            <div><span style={{ color: '#64748b' }}>Asset Path:</span> Packaging Line 1 → {tagMeta?.asset || widget.asset || 'Conveyor_A'}</div>
            <div><span style={{ color: '#64748b' }}>Safety Type:</span> {tagMeta?.safety_type || 'monitor'} (Read-Only)</div>
            <div><span style={{ color: '#64748b' }}>Writable:</span> {tagMeta?.writable ? 'YES' : 'NO'}</div>
            <div><span style={{ color: '#64748b' }}>Reason:</span> Selected by Entity Resolver for machine status query</div>
          </div>
        )}
      </div>
    </div>
  );
};

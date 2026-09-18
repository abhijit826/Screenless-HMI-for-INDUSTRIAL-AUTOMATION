import React, { useState } from 'react';
import { TrendingUp, ChevronRight, ChevronDown, ExternalLink, HelpCircle } from 'lucide-react';
import { HmiWidget, Tag } from '../types';

interface TrendChartProps {
  widget: HmiWidget;
  tagMeta?: Tag;
  liveVal: any;
  onWidgetClick?: (widget: HmiWidget) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({ widget, tagMeta, liveVal, onWidgetClick }) => {
  const [showProvenance, setShowProvenance] = useState(false);
  const val = typeof liveVal === 'number' ? liveVal : 25.0;
  const unit = widget.unit || tagMeta?.unit || 'm/s';

  // Mock trend data points relative to current val
  const points = [
    val - 0.8,
    val - 0.3,
    val + 0.5,
    val - 0.2,
    val + 0.1,
    val - 0.4,
    val
  ];

  const minVal = Math.min(...points) - 1.0;
  const maxVal = Math.max(...points) + 1.0;

  const svgWidth = 260;
  const svgHeight = 60;

  const polylinePoints = points
    .map((pt, i) => {
      const x = (i / (points.length - 1)) * svgWidth;
      const y = svgHeight - ((pt - minVal) / (maxVal - minVal)) * svgHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

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
            {widget.title || tagMeta?.name || widget.tag} ({unit})
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <ExternalLink size={13} style={{ color: '#60a5fa' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
            {val.toFixed(1)}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{unit}</span>
        </div>

        {/* Real-time Trend Graph */}
        <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '4px', padding: '8px', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '50px' }}>
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={polylinePoints}
            />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            <span>WINDOW: 5m</span>
            <span>RANGE: {minVal.toFixed(1)} - {maxVal.toFixed(1)} {unit}</span>
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
            <div><span style={{ color: '#64748b' }}>Tag:</span> {widget.tag}</div>
            <div><span style={{ color: '#64748b' }}>Asset:</span> {tagMeta?.asset || 'Conveyor_A'}</div>
            <div><span style={{ color: '#64748b' }}>Sample Rate:</span> 1.0s (WebSocket)</div>
          </div>
        )}
      </div>
    </div>
  );
};

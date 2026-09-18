import React from 'react';
import { Database, Network, Cpu, ShieldCheck, Monitor, Search } from 'lucide-react';

interface PipelineViewProps {
  hasValidationPass?: boolean;
  onOpenContextUsed?: () => void;
  resolvedTagCount?: number;
  resolvedAssetCount?: number;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  hasValidationPass = true,
  onOpenContextUsed,
  resolvedTagCount = 4,
  resolvedAssetCount = 2
}) => {
  const steps = [
    { id: 1, label: 'Engineering Data', detail: 'Loaded', icon: Database },
    { id: 2, label: 'Machine Context', detail: 'Synchronized', icon: Network },
    { id: 3, label: 'Context Resolution', detail: `${resolvedTagCount} Tags / ${resolvedAssetCount} Assets`, icon: Search, isInteractive: true },
    { id: 4, label: 'AI Planner', detail: 'Proposed', icon: Cpu },
    { id: 5, label: 'Validation Gate', detail: hasValidationPass ? 'Approved' : 'Intervened', icon: ShieldCheck },
    { id: 6, label: 'Runtime HMI', detail: 'Live Spec', icon: Monitor },
  ];

  return (
    <div className="pipeline-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, overflowX: 'auto' }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isClickable = step.isInteractive && onOpenContextUsed;

          return (
            <React.Fragment key={step.id}>
              <div
                onClick={isClickable ? onOpenContextUsed : undefined}
                className={`pipeline-step ${step.id === 6 ? 'pipeline-step-active' : ''}`}
                style={{
                  cursor: isClickable ? 'pointer' : 'default',
                  border: step.id === 3 ? '1px solid #3b82f6' : undefined,
                  backgroundColor: step.id === 3 ? '#1e3a8a' : undefined
                }}
                title={isClickable ? 'Click to inspect Context Used by AI' : undefined}
              >
                <Icon size={14} style={{ color: step.id === 6 ? '#00e676' : step.id === 3 ? '#60a5fa' : '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{step.id}. {step.label}</span>
                <span style={{ fontSize: '10px', color: step.id === 5 && !hasValidationPass ? '#f87171' : '#00e676', fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>
                  ✓ {step.detail}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <span style={{ color: '#475569', fontWeight: 'bold', padding: '0 2px', flexShrink: 0 }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8', borderLeft: '1px solid #1e293b', paddingLeft: '16px', flexShrink: 0 }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>AI PROPOSES</span>
        <span>→</span>
        <span style={{ color: '#00e676', fontWeight: 'bold' }}>VALIDATOR DISPOSES</span>
      </div>
    </div>
  );
};

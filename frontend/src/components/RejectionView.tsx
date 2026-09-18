import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  Lock,
  Database,
  ArrowRight
} from 'lucide-react';
import { ValidationResult } from '../types';

interface RejectionViewProps {
  validation?: ValidationResult | null;
  prompt: string;
  onClear: () => void;
  onOpenContext?: () => void;
}

export const RejectionView: React.FC<RejectionViewProps> = ({
  validation,
  prompt,
  onClear,
  onOpenContext
}) => {
  const [showWhyBlocked, setShowWhyBlocked] = useState<boolean>(true);
  const [showValidationDetails, setShowValidationDetails] = useState<boolean>(false);

  if (!validation) return null;

  const errors = validation.errors || [];
  const checks = validation.checks || [];
  const isApproved = validation.status === 'approved';

  // Dynamic tag extraction from error text / reason / prompt
  const rawErrText = (errors.join(' ') + ' ' + (validation.reason || '') + ' ' + prompt).toLowerCase();
  
  let targetTag = 'Pressure_PV';
  let targetTagName = 'Pneumatic Line Pressure';
  let targetTagAsset = 'Sensors';
  
  if (rawErrText.includes('temperature_pv') || rawErrText.includes('temperature') || rawErrText.includes('temp')) {
    targetTag = 'Temperature_PV';
    targetTagName = 'Line Ambient Temperature';
    targetTagAsset = 'Sensors';
  } else if (rawErrText.includes('motor_1_current') || rawErrText.includes('motor 1 current')) {
    targetTag = 'Motor_1_Current';
    targetTagName = 'Motor 1 Current Draw';
    targetTagAsset = 'Motor_1';
  } else if (rawErrText.includes('tank_level') || rawErrText.includes('tank level')) {
    targetTag = 'Tank_Level';
    targetTagName = 'Raw Material Tank Level';
    targetTagAsset = 'Feed_Pump_101';
  } else if (rawErrText.includes('conveyor_speed_pv') || rawErrText.includes('conveyor speed')) {
    targetTag = 'Conveyor_Speed_PV';
    targetTagName = 'Measured Conveyor Speed';
    targetTagAsset = 'Conveyor_A';
  } else if (rawErrText.includes('pressure') || rawErrText.includes('press')) {
    targetTag = 'Pressure_PV';
    targetTagName = 'Pneumatic Line Pressure';
    targetTagAsset = 'Sensors';
  }

  // Derive requested action label
  const promptLower = (prompt || '').toLowerCase();
  let requestedAction = 'START CONTROL ACTION';
  if (promptLower.includes('pump')) requestedAction = 'START PUMP COMMAND';
  else if (promptLower.includes('motor')) requestedAction = 'START MOTOR COMMAND';
  else if (promptLower.includes('setpoint') || promptLower.includes('speed')) requestedAction = 'WRITE SPEED SETPOINT';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        fontFamily: 'var(--font-sans)',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          backgroundColor: '#0b0f19',
          border: isApproved ? '1px solid #059669' : '1px solid #991b1b',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isApproved ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)' : '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* 1. Modal Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: isApproved ? '#064e3b' : '#450a0a',
            borderBottom: isApproved ? '1px solid #047857' : '1px solid #7f1d1d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: isApproved ? '1px solid #10b981' : '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isApproved ? '#34d399' : '#f87171'
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', color: '#ffffff', margin: 0 }}>
                  DETERMINISTIC SAFETY GATE
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: isApproved ? '#047857' : '#991b1b',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {isApproved ? 'STATUS: PROPOSAL APPROVED ✓' : 'STATUS: PROPOSAL BLOCKED ✕'}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '2px 0 0 0', fontFamily: 'var(--font-mono)' }}>
                ISA-101 Industrial Safety Gate Enforcement • Zero AI Bypass
              </p>
            </div>
          </div>

          <button
            onClick={onClear}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Safety Gate Overlay"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 2. Validation Flow Pipeline Visualization */}
          <div
            style={{
              backgroundColor: '#121721',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '12px 16px'
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>
              PIPELINE STAGE EXECUTION
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              {/* Step 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Operator Prompt</span>
              </div>
              <ArrowRight size={12} style={{ color: '#475569' }} />

              {/* Step 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Context Resolution</span>
              </div>
              <ArrowRight size={12} style={{ color: '#475569' }} />

              {/* Step 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>AI Planner</span>
              </div>
              <ArrowRight size={12} style={{ color: '#475569' }} />

              {/* Step 4: Safety Gate */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: isApproved ? '#34d399' : '#f87171' }}>
                {isApproved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                <span>Safety Validator</span>
              </div>
              <ArrowRight size={12} style={{ color: '#475569' }} />

              {/* Step 5 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: isApproved ? '#34d399' : '#ef4444' }}>
                <span
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isApproved ? '#047857' : '#991b1b',
                    color: '#ffffff',
                    fontSize: '10px'
                  }}
                >
                  {isApproved ? 'RUNTIME RENDERED' : 'RUNTIME BLOCKED'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Top Status Section Banner */}
          <div
            style={{
              backgroundColor: isApproved ? 'rgba(6, 78, 59, 0.3)' : 'rgba(127, 29, 29, 0.3)',
              border: isApproved ? '1px solid #047857' : '1px solid #991b1b',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: isApproved ? '#34d399' : '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SAFETY INTERVENTION — {isApproved ? 'AI PROPOSAL APPROVED' : 'AI-PROPOSED HMI ACTION BLOCKED'}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '3px' }}>
                {isApproved
                  ? 'The proposed HMI specification meets all deterministic safety rules and is cleared for rendering.'
                  : 'The requested control action could not be safely bound to the selected machine tag.'}
              </div>
            </div>

            <div
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: isApproved ? '#065f46' : '#7f1d1d',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isApproved ? '#34d399' : '#ef4444' }}></span>
              {isApproved ? 'PASSED VALIDATION GATE' : 'BLOCKED BY VALIDATION GATE'}
            </div>
          </div>

          {/* 4. Operator Request Card */}
          <div
            style={{
              backgroundColor: '#121721',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '12px 16px'
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold', textTransform: 'uppercase' }}>
              OPERATOR PROMPT REQUEST
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              "{prompt}"
            </div>
          </div>

          {/* 5. Validation Result Card */}
          <div
            style={{
              backgroundColor: '#121721',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: isApproved ? '#34d399' : '#f87171', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={14} />
              {isApproved ? 'VALIDATION PASS DETAILS' : 'SAFETY RULE VIOLATION BREAKDOWN'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>REQUESTED ACTION</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{requestedAction}</div>
              </div>

              <div style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>TARGET TAG</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{targetTag}</div>
                <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Asset: {targetTagAsset}</div>
              </div>

              <div style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>SAFETY TYPE</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>MONITOR / READ-ONLY</div>
              </div>

              <div style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>WRITABLE PERMISSION</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>NO (writable = False)</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', backgroundColor: '#450a0a', border: '1px solid #991b1b', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
              <strong>Result:</strong> CONTROL ACTION BLOCKED — Tag <code>{targetTag}</code> is a process monitoring tag and cannot be bound to a writable command button.
            </div>
          </div>

          {/* 6. "WHY BLOCKED?" Expandable Section */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setShowWhyBlocked(!showWhyBlocked)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0b0f17',
                border: 'none',
                borderBottom: showWhyBlocked ? '1px solid #1e293b' : 'none',
                color: '#f1f5f9',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={14} className="text-amber-400" /> WHY WAS THIS BLOCKED?
              </span>
              {showWhyBlocked ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {showWhyBlocked && (
              <div style={{ padding: '14px 16px', fontSize: '12px', color: '#cbd5e1', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>▸</span>
                  <span>Tag <strong>{targetTag}</strong> has safety classification <strong>MONITOR</strong> (Read-Only).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>▸</span>
                  <span>Writable permission is set to <strong>NO (false)</strong> in the Machine Context Graph.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>▸</span>
                  <span>Command buttons require tags classified explicitly as <strong>COMMAND</strong> with operator role interlocks.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>▸</span>
                  <span>The Safety Gate prevented the unsafe proposal from reaching the dynamic runtime renderer.</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. "VIEW VALIDATION DETAILS" Expandable Section */}
          <div style={{ backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0b0f17',
                border: 'none',
                borderBottom: showValidationDetails ? '1px solid #1e293b' : 'none',
                color: '#94a3b8',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={14} /> VIEW VALIDATION DETAILS (ENGINEERING RULE CHECKS)
              </span>
              {showValidationDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {showValidationDetails && (
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: '#f87171', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                  REASON: {validation.reason}
                </div>

                {errors.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>EXACT ERROR MESSAGES:</div>
                    {errors.map((err, idx) => (
                      <div key={idx} style={{ backgroundColor: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '4px', padding: '8px', fontSize: '11px', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
                        • {err}
                      </div>
                    ))}
                  </div>
                )}

                {checks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>EXECUTED RULE CHECKS ({checks.length}):</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                      {checks.map((chk, idx) => (
                        <div key={idx} style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '4px', padding: '6px 8px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: chk.status === 'PASS' ? '#34d399' : '#f87171', fontWeight: 'bold' }}>[{chk.status}]</span> {chk.rule}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 8. Modal Footer Action Bar */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#0b0f17',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            AI Proposed → Validator Blocked → Runtime Prevented
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {onOpenContext && (
              <button
                onClick={onOpenContext}
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                View Machine Context
              </button>
            )}

            <button
              onClick={onClear}
              style={{
                backgroundColor: '#2563eb',
                border: '1px solid #3b82f6',
                color: '#ffffff',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              Return to HMI Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

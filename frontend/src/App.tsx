import React, { useEffect, useState } from 'react';
import { PromptBar } from './components/PromptBar';
import { HmiShell } from './components/HmiShell';
import { PipelineView } from './components/PipelineView';
import { NavigationPanel } from './components/NavigationPanel';
import { HmiRenderer } from './renderer/HmiRenderer';
import { RejectionView } from './components/RejectionView';
import { ContextViewer } from './components/ContextViewer';
import { ContextUsedModal } from './components/ContextUsedModal';
import { DslViewer } from './components/DslViewer';
import { FocusViewModal } from './components/FocusViewModal';
import { AlarmPanel } from './components/AlarmPanel';
import { PlcAiAssistantDrawer } from './components/PlcAiAssistantDrawer';
import { CheckCircle2 } from 'lucide-react';
import {
  fetchHealth,
  fetchContext,
  fetchLiveState,
  sendPrompt,
  sendMachineChange,
  triggerTempSpike,
  sendCommand,
  connectLiveWebSocket
} from './api';
import { HmiDsl, LiveStateSnapshot, ValidationResult, ResolutionResult, HmiWidget } from './types';

export const App: React.FC = () => {
  const [systemTime, setSystemTime] = useState<string>('');
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [aiProvider, setAiProvider] = useState<string>('Local Deterministic Composer');
  
  const [tagsMeta, setTagsMeta] = useState<Record<string, any>>({});
  const [liveState, setLiveState] = useState<LiveStateSnapshot>({
    timestamp: Date.now(),
    time_formatted: '12:00:00',
    values: {
      Motor_1_RunStatus: true,
      Motor_1_Current: 14.2,
      Motor_1_Speed: 1485.0,
      Motor_1_Trip: false,
      Conveyor_Speed_PV: 24.5,
      Conveyor_Speed_SP: 25.0,
      Temperature_PV: 72.0,
      Pressure_PV: 6.2,
      Tank_Level: 78.5,
      Emergency_Stop: false,
      Door_Switch: true,
      Pump_101_RunStatus: true,
      Valve_102_Status: true
    },
    active_alarms: [],
    alarm_count: 0
  });

  const [currentPrompt, setCurrentPrompt] = useState<string>('Show conveyor health and motor faults');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasValidationPass, setHasValidationPass] = useState<boolean>(true);

  const [activeDsl, setActiveDsl] = useState<HmiDsl | null>(null);
  const [rejection, setRejection] = useState<ValidationResult | null>(null);
  const [lastResolution, setLastResolution] = useState<ResolutionResult | null>(null);

  const [hasMotor2, setHasMotor2] = useState<boolean>(false);
  const [motor2Toast, setMotor2Toast] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeAsset, setActiveAsset] = useState<string>('Conveyor_A');

  const [isContextOpen, setIsContextOpen] = useState<boolean>(false);
  const [isContextUsedOpen, setIsContextUsedOpen] = useState<boolean>(false);
  const [isDslOpen, setIsDslOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [focusedWidget, setFocusedWidget] = useState<HmiWidget | null>(null);

  // 1. Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initial Data Loading & WebSocket setup
  useEffect(() => {
    fetchHealth()
      .then((h) => {
        if (h.ai_provider) setAiProvider(h.ai_provider);
      })
      .catch(console.error);

    fetchContext()
      .then((c) => {
        if (c.tags) setTagsMeta(c.tags);
      })
      .catch(console.error);

    const ws = connectLiveWebSocket((snapshot) => {
      setIsWsConnected(true);
      setLiveState(snapshot);
    });

    // Run initial default prompt
    handlePromptSubmit('Show conveyor health and motor faults');

    return () => {
      ws.close();
    };
  }, []);

  // Handler for prompt execution
  const handlePromptSubmit = async (promptText: string) => {
    setCurrentPrompt(promptText);
    setIsLoading(true);
    setRejection(null);

    try {
      const res = await sendPrompt(promptText);
      if (res.ai_provider) setAiProvider(res.ai_provider);
      if (res.resolved_context) {
        setLastResolution(res.resolved_context);
      }

      if (res.status === 'approved' && res.proposed_dsl) {
        setHasValidationPass(true);
        setActiveDsl(res.proposed_dsl);
        setRejection(null);
      } else {
        setHasValidationPass(false);
        setRejection(null); // Keep screen clean without automatic modal popups
      }
    } catch (err: any) {
      console.error('[Prompt Error]', err);
      setHasValidationPass(false);
      setRejection(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMotor2 = async () => {
    try {
      await sendMachineChange('add_motor_2');
      setHasMotor2(true);
      setMotor2Toast(true);
      setTimeout(() => setMotor2Toast(false), 5000);

      const c = await fetchContext();
      if (c.tags) setTagsMeta(c.tags);

      // Auto-run prompt to regenerate HMI with Motor 2 included!
      handlePromptSubmit('Show me the health of the whole machine');
    } catch (err) {
      console.error('[Add Motor 2 Error]', err);
    }
  };

  const handleTriggerTempSpike = async () => {
    await triggerTempSpike();
  };

  const handleExecuteCommand = async (tag: string, val: any = true) => {
    try {
      await sendCommand(tag, val);
      const latest = await fetchLiveState();
      if (latest) setLiveState(latest);
    } catch (err: any) {
      console.error('[Execute Command Error]', err);
    }
  };

  // Layout mode class
  const gridClass =
    layoutMode === 'desktop'
      ? 'grid-desktop'
      : layoutMode === 'tablet'
      ? 'grid-tablet'
      : 'grid-mobile';

  const resolvedTagCount = lastResolution?.resolved_tags?.length || lastResolution?.tags?.length || 4;
  const resolvedAssetCount = lastResolution?.resolved_assets?.length || lastResolution?.assets?.length || 2;

  return (
    <div className="app-shell">
      {/* 1. Compact Header Shell */}
      <HmiShell
        systemTime={systemTime}
        isWsConnected={isWsConnected}
        aiProvider={aiProvider}
        onOpenContext={() => setIsContextOpen(true)}
        onOpenContextUsed={() => setIsContextUsedOpen(true)}
        onOpenDsl={() => setIsDslOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onAddMotor2={handleAddMotor2}
        onTriggerTempSpike={handleTriggerTempSpike}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        hasMotor2={hasMotor2}
      />

      {/* 2. Operator Prompt Bar */}
      <PromptBar
        onGenerate={handlePromptSubmit}
        isLoading={isLoading}
      />

      {/* 3. Horizontal Pipeline View */}
      <PipelineView
        hasValidationPass={hasValidationPass}
        onOpenContextUsed={() => setIsContextUsedOpen(true)}
        resolvedTagCount={resolvedTagCount}
        resolvedAssetCount={resolvedAssetCount}
      />

      {/* 4. Machine Delta Toast Banner */}
      {motor2Toast && (
        <div className="toast-banner">
          <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
          <div>
            <strong className="text-white uppercase tracking-wider">MACHINE CONTEXT UPDATED ✓</strong> Motor 2 detected in context graph → <span className="text-amber-300 font-bold">AFFECTED HMI REGENERATED ✓</span>
          </div>
        </div>
      )}

      {/* 5. Main HMI Body Area */}
      <main style={{ flex: 1 }}>
        {/* Dynamic Screen Layout */}
        <div className={gridClass}>
          {/* Left Column: Machine Navigation Tree */}
          {layoutMode === 'desktop' && (
            <div style={{ minWidth: 0 }}>
              <NavigationPanel
                activeAsset={activeAsset}
                onSelectAsset={(assetId) => {
                  setActiveAsset(assetId);

                  // Map ISA-95 asset selection directly to widget focus or prompt view
                  const assetWidgetMap: Record<string, any> = {
                    'Packaging_Line_1': { id: 'w_line1', type: 'equipment_graphic', title: 'Packaging Line 1 Overview', asset: 'Packaging_Line_1' },
                    'Conveyor_A': { id: 'w_conv_a', type: 'equipment_graphic', title: 'Conveyor Belt A & Motor 1', asset: 'Conveyor_A', tag: 'Motor_1_RunStatus' },
                    'Motor_2': { id: 'w_m2', type: 'status', title: 'Motor 2 (Secondary Line)', asset: 'Motor_2', tag: 'Motor_2_RunStatus' },
                    'Feed_Pump_101': { id: 'w_pump101', type: 'equipment_graphic', title: 'Feed Pump 101 & Fluid System', asset: 'Feed_Pump_101', tag: 'Pump_101_RunStatus' },
                    'Packaging_Unit': { id: 'w_pkg_unit', type: 'equipment_graphic', title: 'Packaging Unit & Safety Interlocks', asset: 'Packaging_Unit', tag: 'Door_Switch' },
                    'Sensors': { id: 'w_sensors', type: 'gauge', title: 'Process Temperature & Pressure Sensor Suite', asset: 'Sensors', tag: 'Temperature_PV' }
                  };

                  const widgetToFocus = assetWidgetMap[assetId];
                  if (widgetToFocus) {
                    setFocusedWidget(widgetToFocus);
                  }

                  const promptMap: Record<string, string> = {
                    'Packaging_Line_1': 'Show me the health of the whole machine',
                    'Conveyor_A': 'Show conveyor health and motor status',
                    'Motor_2': 'Show Motor 2 running status, current and fault status',
                    'Feed_Pump_101': 'Show pump 101 status and pressure telemetry',
                    'Packaging_Unit': 'Show packaging unit status and safety guards',
                    'Sensors': 'Show process temperature, pressure and active alarms'
                  };
                  const promptText = promptMap[assetId] || `Show status for ${assetId}`;
                  handlePromptSubmit(promptText);
                }}
                hasMotor2={hasMotor2}
              />
            </div>
          )}

          {/* Center Workspace: Dynamic HMI Renderer */}
          <div style={{ minWidth: 0 }}>
            {activeDsl ? (
              <HmiRenderer
                dsl={activeDsl}
                liveState={liveState.values || {}}
                tagsMap={tagsMeta}
                hasMotor2={hasMotor2}
                activeAsset={activeAsset}
                onWidgetClick={(widget) => setFocusedWidget(widget)}
                onExecuteCommand={handleExecuteCommand}
              />
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#121721', border: '1px solid #1e293b', borderRadius: '8px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Instantiating dynamic HMI from machine context...
              </div>
            )}
          </div>

          {/* Right Column: Active Alarms & Process Diagnostics */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <AlarmPanel
              activeAlarms={liveState.active_alarms || []}
              onWidgetClick={(widget) => setFocusedWidget(widget)}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {rejection && (
        <RejectionView
          validation={rejection}
          prompt={currentPrompt}
          onClear={() => setRejection(null)}
          onOpenContext={() => setIsContextOpen(true)}
        />
      )}
      <ContextViewer isOpen={isContextOpen} onClose={() => setIsContextOpen(false)} />
      <ContextUsedModal
        isOpen={isContextUsedOpen}
        onClose={() => setIsContextUsedOpen(false)}
        promptText={currentPrompt}
        resolution={lastResolution}
        liveState={liveState.values || {}}
        hasMotor2={hasMotor2}
        isRejected={!hasValidationPass && Boolean(rejection)}
        rejectionReason={rejection?.reason}
      />
      <DslViewer isOpen={isDslOpen} onClose={() => setIsDslOpen(false)} dsl={activeDsl || undefined} />

      {/* Full-Screen Industrial Focus View Overlay */}
      <FocusViewModal
        isOpen={Boolean(focusedWidget)}
        onClose={() => setFocusedWidget(null)}
        widget={focusedWidget}
        liveState={liveState.values || {}}
        tagsMap={tagsMeta}
        hasMotor2={hasMotor2}
        activeAlarms={liveState.active_alarms || []}
        onOpenContextGraphWithNode={() => setIsContextOpen(true)}
        onExecuteCommand={handleExecuteCommand}
      />

      {/* 6. WinCC Unified RT Style PLC AI Assistant Conversational Drawer */}
      <PlcAiAssistantDrawer
        liveState={liveState.values || {}}
        onExecuteCommand={handleExecuteCommand}
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />
    </div>
  );
};

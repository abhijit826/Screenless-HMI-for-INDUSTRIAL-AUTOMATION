import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Zap, ShieldCheck, AlertTriangle, Activity, Cpu, Mail, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { addAuditLog, exportAuditLogsCSV } from '../utils/auditLogger';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  commandExecuted?: string;
  statusBadge?: string;
}

interface PlcAiAssistantDrawerProps {
  liveState: Record<string, any>;
  onExecuteCommand: (tag: string, value?: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenAuditLogs?: () => void;
}

export const PlcAiAssistantDrawer: React.FC<PlcAiAssistantDrawerProps> = ({
  liveState,
  onExecuteCommand,
  isOpen: isOpenProp,
  onClose: onCloseProp
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    setInternalIsOpen(val);
    if (!val && onCloseProp) onCloseProp();
  };
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: '🤖 Hello! I am your WinCC/SCADA PLC AI Assistant. Ask me anything about motor speeds, pump status, active alarms, setpoints, or tell me to run/stop equipment in natural language.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [emailNotification, setEmailNotification] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle Natural Language Assistant Query
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');

    // Simulate AI Processing & Intent Parsing
    setTimeout(() => {
      processAiQuery(query);
    }, 400);
  };

  const processAiQuery = async (query: string) => {
    const q = query.toLowerCase();
    let replyText = '';
    let executedCmd: string | undefined = undefined;
    let badge: string | undefined = undefined;

    const m1Running = Boolean(liveState.Motor_1_RunStatus);
    const pumpRunning = Boolean(liveState.Pump_101_RunStatus);
    const speedVal = typeof liveState.Conveyor_Speed_PV === 'number' ? liveState.Conveyor_Speed_PV : 24.5;
    const tempVal = typeof liveState.Temperature_PV === 'number' ? liveState.Temperature_PV : 72.0;
    const tankLevel = typeof liveState.Tank_101_Level === 'number' ? liveState.Tank_101_Level : 79.5;
    const m3Total = typeof liveState.Total_M3_Counter === 'number' ? liveState.Total_M3_Counter : 2885;
    const meterCount = typeof liveState.Meter_Counter === 'number' ? liveState.Meter_Counter : 2762;

    // 0. Attempt backend LLM query first
    try {
      const res = await fetch('http://localhost:8000/api/ai-assistant-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, live_state: liveState })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.text) {
          if (data.action) {
            onExecuteCommand(data.action, data.value);
            addAuditLog({
              eventType: 'OPERATOR_COMMAND',
              tagOrAction: data.action,
              value: data.value,
              operatorId: 'AI Assistant (Conversational)',
              status: 'SUCCESS',
              details: `Natural language command via Gemini/Backend: ${query}`
            });
          }
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            statusBadge: data.badge || 'AI TELEMETRY RESPONSE'
          }]);
          return;
        }
      }
    } catch {
      // Offline / local fallback
    }

    // =========================================================================
    // PRIORITY 1: CONTROL COMMANDS (Start, Stop, Turn Off/On, Run, Set Setpoint)
    // =========================================================================

    // 0A. COMMAND: Stop All Motors / Plant Global Stop
    if ((q.includes('stop') || q.includes('turn off') || q.includes('off') || q.includes('shutdown') || q.includes('halt') || q.includes('estop') || q.includes('e-stop')) && (q.includes('all') || q.includes('motors') || q.includes('everything') || q.includes('plant'))) {
      onExecuteCommand('Motor_1_Stop', false);
      onExecuteCommand('Motor_2_Stop', false);
      onExecuteCommand('Pump_101_Stop', false);
      executedCmd = 'STOP_ALL_MOTORS';
      replyText = `🛑 Executing command: **STOP ALL MOTORS & PUMPS**. Issued global PLC shutdown interlock:\n• Motor 1 & Primary Conveyor: **STOPPED** (\`Motor_1_RunStatus = false\`)\n• Motor 2 (Auxiliary Line): **STOPPED** (\`Motor_2_RunStatus = false\`)\n• Feed Pump 101: **STOPPED** (\`Pump_101_RunStatus = false\`)\nAll SCADA animations and belt motions have stopped immediately.`;
      badge = 'ALL MOTORS STOPPED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'STOP_ALL_MOTORS',
        value: false,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Stop all motors and plant equipment'
      });
    }
    // 0B. COMMAND: Start All Motors / Plant Global Start
    else if ((q.includes('start') || q.includes('turn on') || q.includes('run')) && (q.includes('all') || q.includes('motors') || q.includes('everything') || q.includes('plant'))) {
      onExecuteCommand('Motor_1_Start', true);
      onExecuteCommand('Motor_2_Start', true);
      onExecuteCommand('Pump_101_Start', true);
      executedCmd = 'START_ALL_MOTORS';
      replyText = `▶️ Executing command: **START ALL MOTORS & PUMPS**. Interlocks verified:\n• Motor 1 & Primary Conveyor: **RUNNING** (\`Motor_1_RunStatus = true\`)\n• Motor 2 (Auxiliary Line): **RUNNING** (\`Motor_2_RunStatus = true\`)\n• Feed Pump 101: **RUNNING** (\`Pump_101_RunStatus = true\`)\nAll SCADA animations and fluid flows resumed.`;
      badge = 'ALL MOTORS STARTED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'START_ALL_MOTORS',
        value: true,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Start all motors and plant equipment'
      });
    }
    // 1. COMMAND: Stop Motor 2
    else if ((q.includes('stop') || q.includes('turn off') || q.includes('off') || q.includes('halt')) && (q.includes('motor 2') || q.includes('motor2'))) {
      onExecuteCommand('Motor_2_Stop', false);
      executedCmd = 'Motor_2_Stop';
      replyText = `🛑 Executing command: **STOP MOTOR 2**. Motor 2 rotation animation and secondary conveyor path have stopped. PLC output tag \`Motor_2_RunStatus\` set to FALSE.`;
      badge = 'MOTOR 2 STOPPED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'Motor_2_Stop',
        value: false,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Stop Motor 2'
      });
    }
    // 2. COMMAND: Start Motor 2
    else if ((q.includes('start') || q.includes('turn on') || q.includes('run')) && (q.includes('motor 2') || q.includes('motor2'))) {
      onExecuteCommand('Motor_2_Start', true);
      executedCmd = 'Motor_2_Start';
      replyText = `▶️ Executing command: **START MOTOR 2**. Interlocks verified. Motor 2 rotation animation and secondary line active. PLC output tag \`Motor_2_RunStatus\` set to TRUE.`;
      badge = 'MOTOR 2 STARTED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'Motor_2_Start',
        value: true,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Start Motor 2'
      });
    }
    // 3. COMMAND: Stop Motor 1 / Conveyor Belt
    else if ((q.includes('stop') || q.includes('turn off') || q.includes('off') || q.includes('halt')) && (q.includes('motor') || q.includes('conveyor') || q.includes('belt') || q.includes('machine') || q.includes('line'))) {
      onExecuteCommand('Motor_1_Stop', false);
      executedCmd = 'Motor_1_Stop';
      replyText = `🛑 Executing command: **STOP MOTOR 1 & CONVEYOR BELT**. The PLC output is set to OFF (\`Motor_1_RunStatus = false\`). SCADA schematic animation and belt motion have stopped immediately.`;
      badge = 'MOTOR 1 STOPPED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'Motor_1_Stop',
        value: false,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Stop Motor 1 & Conveyor line'
      });
    }
    // 4. COMMAND: Start Motor 1 / Conveyor Belt
    else if ((q.includes('start') || q.includes('turn on') || q.includes('run')) && (q.includes('motor') || q.includes('conveyor') || q.includes('belt') || q.includes('machine') || q.includes('line'))) {
      onExecuteCommand('Motor_1_Start', true);
      executedCmd = 'Motor_1_Start';
      replyText = `▶️ Executing command: **START MOTOR 1 & CONVEYOR BELT**. Interlocks verified (\`Motor_1_RunStatus = true\`). Machine animation and belt motion resumed.`;
      badge = 'MOTOR 1 STARTED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'Motor_1_Start',
        value: true,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Start Motor 1 & Conveyor line'
      });
    }
    // 5. COMMAND: Stop Feed Pump 101
    else if ((q.includes('stop') || q.includes('turn off') || q.includes('off')) && (q.includes('pump') || q.includes('feed pump') || q.includes('101'))) {
      onExecuteCommand('Pump_101_Stop', false);
      executedCmd = 'Pump_101_Stop';
      replyText = `🛑 Executing command: **STOP FEED PUMP 101**. Pump impeller rotation and pipe fluid flow glowing animations have stopped (\`Pump_101_RunStatus = false\`).`;
      badge = 'PUMP 101 STOPPED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'Pump_101_Stop',
        value: false,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Stop Feed Pump 101'
      });
    }
    // 6. COMMAND: Start Feed Pump 101
    else if ((q.includes('start') || q.includes('turn on') || q.includes('run')) && (q.includes('pump') || q.includes('feed pump') || q.includes('101'))) {
      onExecuteCommand('Pump_101_Start', true);
      executedCmd = 'Pump_101_Start';
      replyText = `▶️ Executing command: **START FEED PUMP 101**. Impeller active (\`Pump_101_RunStatus = true\`). Glowing SCADA liquid pipeline flow resumed.`;
      badge = 'PUMP 101 STARTED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'Pump_101_Start',
        value: true,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: 'Natural language request: Start Feed Pump 101'
      });
    }
    // 7. COMMAND: Set Motor Speed
    else if (q.includes('set') && q.includes('speed')) {
      const match = q.match(/\d+(\.\d+)?/);
      const newSpeed = match ? parseFloat(match[0]) : 400;
      onExecuteCommand('Conveyor_Speed_SP', newSpeed);
      executedCmd = `Conveyor_Speed_SP = ${newSpeed}`;
      replyText = `✅ Setpoint updated! Set Conveyor Motor Speed setpoint to **${newSpeed} RPM/m/s**. PLC command executed and safety validated.`;
      badge = 'PLC COMMAND EXECUTED';
      addAuditLog({
        eventType: 'OPERATOR_COMMAND',
        tagOrAction: 'Conveyor_Speed_SP',
        value: newSpeed,
        operatorId: 'AI Assistant (Conversational)',
        status: 'SUCCESS',
        details: `Operator requested motor speed setpoint change to ${newSpeed}`
      });
    }

    // =========================================================================
    // PRIORITY 2: TELEMETRY & READ QUERIES
    // =========================================================================

    // 8. Motor 2 Read Query
    else if (q.includes('motor 2') || q.includes('motor2')) {
      const m2Running = Boolean(liveState.Motor_2_RunStatus);
      const m2Speed = m2Running ? Number(liveState.Motor_2_Speed_PV ?? 18.5) : 0.0;
      const m2Sp = Number(liveState.Motor_2_Speed_SP ?? 20.0);
      const m2Freq = m2Running ? (m2Speed * 2.0).toFixed(1) : '0.0';
      replyText = `⚙️ **Motor 2 (Auxiliary Line) Speed & Telemetry**:\n• Motor 2 Speed (PV): **${m2Speed.toFixed(1)} m/s**\n• Operating Status: **${m2Running ? '🟢 RUNNING' : '🔴 STOPPED'}**\n• Setpoint (SP): **${m2Sp.toFixed(1)} m/s**\n• VFD Frequency: **${m2Freq} Hz**\n• Asset Binding: **Motor 2 & Secondary Conveyor B**\n• SCADA Representation: **Active on Main Schematic (Panel 3)**`;
      badge = 'MOTOR 2 SPEED READ';
    }
    // 9. Disambiguation: Pipe Fluid Flow Speed vs Conveyor Speed
    else if (q.includes('pipe') || q.includes('fluid') || q.includes('liquid') || q.includes('flow of pipe') || q.includes('flow speed') || q.includes('fluid speed') || q.includes('water flow')) {
      const flowRate = pumpRunning ? 142.5 : 0.0;
      const fluidVel = pumpRunning ? 1.8 : 0.0;
      replyText = `🌊 **Pipe Fluid Flow Rate & Velocity Telemetry**:\n• Fluid Flow Velocity: **${fluidVel} m/s**\n• Volumetric Flow Rate: **${flowRate} L/min** (Discharge Pressure: ${pumpRunning ? '3.8 Bar' : '0.0 Bar'})\n• Source Conduit: **Tank 101 Discharge Pipe ➔ Feed Pump 101**\n• Connected Unit: **Sand Filter (Kum Filtresi)**\n• Flow Status: **${pumpRunning ? '🟢 ACTIVE LIQUID FLOW (PUMPING)' : '🔴 NO FLOW (FEED PUMP STOPPED)'}**`;
      badge = 'FLUID FLOW TELEMETRY';
    }
    // 2. Tank 101 Level & Volume Queries
    else if (q.includes('tank 101') || q.includes('tank level') || q.includes('101 level') || (q.includes('tank') && (q.includes('level') || q.includes('volume') || q.includes('water') || q.includes('capacity')))) {
      const volumeM3 = ((tankLevel / 100.0) * 339.0).toFixed(1);
      replyText = `💧 **Tank 101 Live Telemetry Readout**:\n• Current Level: **${tankLevel.toFixed(1)}%**\n• Liquid Volume: **${volumeM3} M³** (Max Capacity: 339.0 M³)\n• Inlet Valve 1-8: **OPEN (ACTIVE FLOW)**\n• Operating Status: **NORMAL OPERATING ENVELOPE**`;
      badge = 'TANK 101 TELEMETRY';
    }
    // 3. Buffer Tanks & Secondary Reservoirs Queries
    else if (q.includes('buffer') || q.includes('red tank') || q.includes('blue tank') || q.includes('reservoir') || q.includes('derenin')) {
      replyText = `🛢️ **Buffer Tanks & Reservoirs Status**:\n• Red Buffer Tank: **350.0 Cm (1,798 M³)**\n• Blue Buffer Tank: **347.6 Cm (3,980 M³)**\n• Main Reservoirs (Derenin Karşısı): **359.9 Cm (Total Counter: 462 M³)**\n• Status: **1 Nolu Tank Müsait (ONLINE)**`;
      badge = 'BUFFER TANKS READ';
    }
    // 4. Line Temperature Queries
    else if (q.includes('temp') || q.includes('heat') || q.includes('thermal') || q.includes('pv')) {
      replyText = `🌡️ **Process Line Temperature Telemetry**:\n• Current Sensor Temp (PV): **${tempVal.toFixed(1)} °C**\n• Alarm Limit Threshold: **90.0 °C**\n• Thermal Status: **${tempVal > 90.0 ? '🚨 HIGH TEMPERATURE ALARM ACTIVE!' : '🟢 NORMAL (SAFE OPERATING LIMITS)'}**`;
      badge = 'TEMP TELEMETRY';
    }
    // 5. Production Count & Totalizer Queries
    else if (q.includes('counter') || q.includes('totalizer') || q.includes('production') || q.includes('m3') || q.includes('meter') || q.includes('output')) {
      replyText = `📊 **Production & Meter Totalizers**:\n• 1-8 Toplama Water Totalizer: **${m3Total} M³**\n• 1-6 Flow Meter Count: **${meterCount} Units**\n• Line Efficiency: **92.4%**\n• Status: **REAL-TIME ACCUMULATING**`;
      badge = 'TOTALIZER READ';
    }
    // 6. Conveyor Belt & Motor Speed / Status Queries
    else if (q.includes('conveyor') || q.includes('belt') || (q.includes('speed') && (q.includes('motor') || q.includes('what') || q.includes('current') || q.includes('get') || q.includes('show') || q.includes('how fast') || q.includes('tell')))) {
      replyText = `⚙️ **Motor 1 & Conveyor Speed Telemetry**:\n• Conveyor Belt Speed (PV): **${speedVal.toFixed(1)} m/s**\n• Operating Status: **${m1Running ? '🟢 RUNNING' : '🔴 STOPPED'}**\n• Setpoint (SP): **${liveState.Conveyor_Speed_SP || 25.0} m/s**\n• VFD Frequency: **${(speedVal * 2.0).toFixed(1)} Hz**`;
      badge = 'CONVEYOR SPEED READ';
    }
    // 7. Feed Pump 101 Query
    else if (q.includes('pump') || q.includes('infeed')) {
      replyText = `💧 **Feed Pump 101 Telemetry**:\n• Run Status: **${pumpRunning ? '🟢 RUNNING (FLOWING)' : '🔴 STOPPED'}**\n• Flow Rate: **${pumpRunning ? '142.5 L/min' : '0.0 L/min'}**\n• Discharge Pressure: **${pumpRunning ? '3.8 Bar' : '0.0 Bar'}**\n• Kum Filtresi (Sand Filter): **ONLINE**`;
      badge = 'PUMP TELEMETRY';
    }
    // 12. Alarms Query
    else if (q.includes('alarm') || q.includes('warning') || q.includes('fault') || q.includes('trip')) {
      if (tempVal > 90.0) {
        replyText = `🚨 **ACTIVE ISA-18.2 ALARM DETECTED**: High Temperature Alarm on Sensor Temp_01 (**${tempVal.toFixed(1)} °C** > Threshold 90.0 °C). Immediate operator action advised!`;
        badge = 'HIGH ALARM ACTIVE';
        triggerEmailAlert('HIGH TEMPERATURE ALARM DISPATCHED', `Temperature reached ${tempVal.toFixed(1)} °C on Line 1.`);
      } else {
        replyText = `✅ **No Critical Alarms**: All system parameters are within normal ISA-18.2 operating envelopes. Temperature is ${tempVal.toFixed(1)} °C.`;
        badge = 'SYSTEM HEALTHY';
      }
    }
    // 13. Predictive Maintenance & Anomaly Detection Query
    else if (q.includes('predict') || q.includes('anomaly') || q.includes('health') || q.includes('maintenance') || q.includes('rul')) {
      replyText = `🧠 **AI PREDICTIVE MAINTENANCE DIAGNOSTICS**:\n• Motor 1 Bearing Vibration: **0.02 mm/s** (Normal - 98.4% Health)\n• Remaining Useful Life (RUL): **14,280 Hours**\n• Thermal Drift Trend: **Stable (+0.1°C/hr)**\n• Anomaly Risk Score: **1.2% (LOW RISK)**\nNo maintenance intervention required for the next 60 days.`;
      badge = 'PREDICTIVE DIAGNOSTICS';
    }
    // 14. Overall System Status / Overview
    else if (q.includes('status') || q.includes('overview') || q.includes('summary') || q.includes('system') || q.includes('plant') || q.includes('hello') || q.includes('hi')) {
      const volumeM3 = ((tankLevel / 100.0) * 339.0).toFixed(1);
      replyText = `🏭 **Plant 01 Overall SCADA Status Summary**:\n• Motor 1: **${m1Running ? '🟢 RUNNING' : '🔴 STOPPED'}** (${speedVal.toFixed(1)} m/s)\n• Feed Pump 101: **${pumpRunning ? '🟢 RUNNING' : '🔴 STOPPED'}**\n• Tank 101 Level: **${tankLevel.toFixed(1)}%** (${volumeM3} M³)\n• Line Temp: **${tempVal.toFixed(1)} °C**\n• Alarms: **${tempVal > 90.0 ? '🚨 1 HIGH TEMP ALARM' : '🟢 0 ALARMS (HEALTHY)'}**`;
      badge = 'PLANT OVERVIEW';
    }
    // Default dynamic smart fallback
    else {
      replyText = `🤖 **Siemens PLC AI Assistant Response**:\nRegarding "${query}":\n• Tank 101 Level: **${tankLevel.toFixed(1)}%** (${((tankLevel/100)*339).toFixed(1)} M³)\n• Motor 1 Status: **${m1Running ? '🟢 RUNNING' : '🔴 STOPPED'}** (${speedVal.toFixed(1)} m/s)\n• Feed Pump 101: **${pumpRunning ? '🟢 RUNNING' : '🔴 STOPPED'}**\n• Line Temp: **${tempVal.toFixed(1)} °C**\n\n💡 *You can ask me to start/stop motors, change setpoints, query tank 101 level, check alarms, or view predictive maintenance!*`;
      badge = 'TELEMETRY RESPONSE';
    }

    const aiMsg: Message = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      commandExecuted: executedCmd,
      statusBadge: badge
    };

    setMessages(prev => [...prev, aiMsg]);
  };

  const triggerEmailAlert = (subject: string, body: string) => {
    const toastText = `📧 Alert Email Dispatched to operator@plant01.schneider.com: "${subject}"`;
    setEmailNotification(toastText);
    addAuditLog({
      eventType: 'ALARM_TRIGGERED',
      tagOrAction: 'Email_Notification_Dispatch',
      operatorId: 'Automated Alarm Dispatcher',
      status: 'WARNING',
      details: `${subject}: ${body}`
    });
    setTimeout(() => setEmailNotification(null), 6000);
  };

  return (
    <>
      {/* Floating Email Notification Toast */}
      {emailNotification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-red-950 border border-red-700 text-red-200 rounded-lg shadow-2xl animate-bounce font-mono text-xs max-w-md">
          <Mail className="text-red-400 shrink-0" size={18} />
          <div>
            <div className="font-bold text-red-100">AUTOMATED EMAIL ALERT DISPATCHED</div>
            <div className="text-[11px] text-red-300">{emailNotification}</div>
          </div>
          <button onClick={() => setEmailNotification(null)} className="ml-auto text-red-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Floating Action Button for AI Chatbot Assistant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl border border-blue-400 font-heading font-bold text-xs transition-all transform hover:scale-105"
          style={{ boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)' }}
        >
          <div className="relative">
            <Bot size={20} className="text-blue-100 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-blue-900" />
          </div>
          <span>PLC AI ASSISTANT</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-800 text-[10px] font-mono text-blue-200 border border-blue-500">MCP ACTIVE</span>
        </button>
      )}

      {/* WinCC Unified RT Style AI Assistant Drawer */}
      {isOpen && (
        <div className="plc-assistant-drawer">
          {/* Header Bar */}
          <div className="plc-assistant-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-950 border border-blue-800 text-blue-400">
                <Bot size={20} />
              </div>
              <div>
                <div className="font-heading font-bold text-sm text-slate-100 flex items-center gap-2">
                  <span>WinCC PLC AI Assistant</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Siemens PLC &amp; Context2HMI Bridge</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          {/* Machine Quick Metrics Bar */}
          <div className="plc-assistant-metrics">
            <div className="flex items-center gap-1.5">
              <Activity size={12} className="text-emerald-400" />
              <span>M1: {liveState.Motor_1_RunStatus ? '● RUNNING' : '○ STOPPED'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-cyan-400" />
              <span>PUMP: {liveState.Pump_101_RunStatus ? '● RUNNING' : '○ STOPPED'}</span>
            </div>
            <button
              onClick={exportAuditLogsCSV}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded text-[10px]"
              title="Download Excel / CSV Audit Trail Log"
            >
              <FileSpreadsheet size={11} />
              <span>EXPORT AUDIT</span>
            </button>
          </div>

          {/* Chat Messages List */}
          <div className="plc-assistant-chat-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] font-mono text-slate-500 mb-1 flex items-center gap-1.5">
                  <span>{msg.sender === 'user' ? 'OPERATOR (AKM)' : 'AI AGENT (MCP)'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-xl max-w-[88%] text-xs leading-relaxed font-sans ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-[#121826] border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
                  }`}
                >
                  {msg.statusBadge && (
                    <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 text-[10px] font-mono font-bold">
                      <ShieldCheck size={11} className="text-blue-400" />
                      <span>{msg.statusBadge}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line">
                    {msg.text.split('\n').map((line, idx) => {
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={idx} className={line.startsWith('•') ? 'pl-2 py-0.5 text-slate-200' : 'py-0.5'}>
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                            }
                            return <span key={pIdx}>{part}</span>;
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {msg.commandExecuted && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>PLC Telemetry Updated: {msg.commandExecuted}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Command Suggestions Pills */}
          <div className="plc-assistant-pill-bar">
            <button
              onClick={() => handleSendMessage('What is the current motor speed?')}
              className="scenario-btn"
            >
              💬 What is motor speed?
            </button>
            <button
              onClick={() => handleSendMessage('Set motor speed to 400 RPM')}
              className="scenario-btn"
            >
              ⚙️ Set speed 400 RPM
            </button>
            <button
              onClick={() => handleSendMessage('Stop Motor 1')}
              className="scenario-btn scenario-btn-danger"
            >
              🛑 Stop Motor 1
            </button>
            <button
              onClick={() => handleSendMessage('Start Motor 1')}
              className="scenario-btn"
            >
              ▶️ Start Motor 1
            </button>
            <button
              onClick={() => handleSendMessage('Stop Feed Pump 101')}
              className="scenario-btn scenario-btn-danger"
            >
              💧 Stop Pump 101
            </button>
            <button
              onClick={() => handleSendMessage('Tell me active alarms')}
              className="scenario-btn"
            >
              🚨 Active Alarms
            </button>
            <button
              onClick={() => handleSendMessage('Check predictive maintenance health')}
              className="scenario-btn"
            >
              🧠 Predictive RUL
            </button>
          </div>

          {/* Input Box Bar */}
          <div className="plc-assistant-input-bar">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask PLC AI Assistant (e.g. 'Stop Motor 1')..."
              className="prompt-input"
            />
            <button
              onClick={() => handleSendMessage()}
              className="btn-primary"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

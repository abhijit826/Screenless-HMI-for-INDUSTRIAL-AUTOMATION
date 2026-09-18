import React from 'react';
import { AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { HmiWidget, ActiveAlarmItem } from '../types';

interface AlarmBannerProps {
  widget: HmiWidget;
  activeAlarms: ActiveAlarmItem[];
}

export const AlarmBanner: React.FC<AlarmBannerProps> = ({ widget, activeAlarms }) => {
  const targetAlarmId = widget.alarm;
  const alarmMatch = activeAlarms.find((a) => a.id === targetAlarmId || a.source === widget.tag);

  if (alarmMatch) {
    return (
      <div className="hmi-card bg-red-950/80 border-2 border-red-600 text-white animate-pulse">
        <div className="flex items-center justify-between font-bold text-red-200">
          <div className="flex items-center gap-2 text-base font-heading">
            <AlertTriangle className="text-red-400 animate-bounce" size={20} />
            <span>ALARM ACTIVE: {alarmMatch.name}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-red-800 text-xs font-mono">
            {alarmMatch.priority}
          </span>
        </div>
        <p className="text-sm text-red-100 font-mono mt-2">
          {alarmMatch.message}
        </p>
        <div className="flex justify-between text-xs text-red-300 font-mono mt-3 pt-2 border-t border-red-800/80">
          <span>SOURCE: {alarmMatch.source}</span>
          <span>TIME: {alarmMatch.timestamp}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hmi-card bg-gray-900/60 border-gray-800 text-gray-400">
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle size={16} />
          <span className="font-heading font-semibold text-gray-300">
            {widget.title || widget.alarm || 'Alarm Monitor'}
          </span>
        </div>
        <span className="text-emerald-500 font-mono text-[11px]">NORMAL / NO ACTIVE ALARM</span>
      </div>
    </div>
  );
};

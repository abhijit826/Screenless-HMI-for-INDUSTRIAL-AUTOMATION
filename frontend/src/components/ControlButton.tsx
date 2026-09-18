import React, { useState } from 'react';
import { Play, Square, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { HmiWidget, Tag } from '../types';
import { sendCommand } from '../api';

interface ControlButtonProps {
  widget: HmiWidget;
  tagMeta?: Tag;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ widget, tagMeta }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const isStop = widget.label?.toLowerCase().includes('stop') || widget.tag?.toLowerCase().includes('stop');

  const handleClick = async () => {
    if (widget.tag) {
      await sendCommand(widget.tag, true).catch(console.error);
    }
    setFeedback(`ACTUATED: Command pulse sent to ${widget.tag} (Role: ${tagMeta?.required_role || 'operator'})`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="hmi-card flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
        <span>{widget.title || widget.label || 'Machine Command'}</span>
        <ShieldAlert size={14} className="text-emerald-400" />
      </div>

      <div className="my-2">
        <button
          onClick={handleClick}
          className={`w-full py-3 px-4 rounded font-bold font-heading text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 ${
            isStop
              ? 'bg-red-700 hover:bg-red-600 text-white border border-red-500 shadow-lg shadow-red-900/30'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 shadow-lg shadow-emerald-900/30'
          }`}
        >
          {isStop ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          <span>{widget.label || (isStop ? 'STOP COMMAND' : 'START COMMAND')}</span>
        </button>
      </div>

      {feedback && (
        <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 rounded p-1.5 mt-2 flex items-center gap-1.5">
          <CheckCircle2 size={14} />
          <span>{feedback}</span>
        </div>
      )}

      <div className="text-[11px] text-gray-500 font-mono mt-2 pt-2 border-t border-gray-800 flex justify-between">
        <span>Tag: {widget.tag}</span>
        <span>Role: {tagMeta?.required_role || 'operator'}</span>
      </div>
    </div>
  );
};

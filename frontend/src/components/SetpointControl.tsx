import React, { useState } from 'react';
import { Sliders, Check } from 'lucide-react';
import { HmiWidget, Tag } from '../types';
import { sendCommand } from '../api';

interface SetpointControlProps {
  widget: HmiWidget;
  tagMeta?: Tag;
  liveVal: any;
}

export const SetpointControl: React.FC<SetpointControlProps> = ({ widget, tagMeta, liveVal }) => {
  const min = widget.min ?? tagMeta?.min ?? 0;
  const max = widget.max ?? tagMeta?.max ?? 50;
  const step = widget.step ?? 1.0;
  const unit = widget.unit || tagMeta?.unit || '';

  const [val, setVal] = useState<number>(typeof liveVal === 'number' ? liveVal : 25);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleApply = async () => {
    if (widget.tag) {
      await sendCommand(widget.tag, val).catch(console.error);
    }
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="hmi-card flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
        <span>{widget.title || tagMeta?.name || widget.tag}</span>
        <Sliders size={14} className="text-blue-400" />
      </div>

      <div className="my-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold font-mono text-white">
            {val} <span className="text-sm text-gray-400 font-normal">{unit}</span>
          </span>
          <button
            onClick={handleApply}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {savedMsg ? <Check size={14} /> : 'APPLY SP'}
          </button>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={(e) => setVal(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        <div className="flex justify-between text-[10px] font-mono text-gray-500">
          <span>MIN: {min} {unit}</span>
          <span>MAX: {max} {unit}</span>
        </div>
      </div>

      <div className="text-[11px] text-gray-500 font-mono pt-2 border-t border-gray-800 flex justify-between">
        <span>Target Tag: {widget.tag}</span>
        <span className="text-blue-400">WRITABLE SETPOINT</span>
      </div>
    </div>
  );
};

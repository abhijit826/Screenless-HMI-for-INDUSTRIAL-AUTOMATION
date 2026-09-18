import React, { useState } from 'react';
import { Sparkles, Mic, Search, Zap } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptBar: React.FC<PromptBarProps> = ({ onGenerate, isLoading }) => {
  const [promptText, setPromptText] = useState('Show conveyor health and motor faults');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptText.trim()) {
      onGenerate(promptText.trim());
    }
  };

  const handleScenario = (text: string) => {
    setPromptText(text);
    onGenerate(text);
  };

  return (
    <div className="prompt-container">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="prompt-input-group">
          <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Ask the machine... (e.g. Show conveyor health and motor faults)"
            className="prompt-input"
            disabled={isLoading}
          />
          <Mic size={16} className="absolute right-3 text-gray-500 hover:text-gray-300 cursor-pointer" />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          <Sparkles size={16} />
          <span>{isLoading ? 'GENERATING...' : 'GENERATE HMI'}</span>
        </button>
      </form>

      {/* Quick Demo Scenario Shortcuts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-400 font-mono text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
          <Zap size={13} className="text-amber-400" /> Demo Scenarios:
        </span>
        <button
          type="button"
          onClick={() => handleScenario('Show conveyor health and motor faults')}
          className="scenario-btn"
        >
          Conveyor Health
        </button>
        <button
          type="button"
          onClick={() => handleScenario('Show process temperature, pressure and active alarms')}
          className="scenario-btn"
        >
          Temperature & Alarms
        </button>
        <button
          type="button"
          onClick={() => handleScenario('Add a start button using temperature_pv')}
          className="scenario-btn scenario-btn-danger"
        >
          🛡 Safety Rejection
        </button>
        <button
          type="button"
          onClick={() => handleScenario('Show complete machine health overview')}
          className="scenario-btn"
        >
          Machine Overview
        </button>
      </div>
    </div>
  );
};

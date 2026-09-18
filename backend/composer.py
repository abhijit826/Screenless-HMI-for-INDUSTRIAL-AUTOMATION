import os
import json
import httpx
from typing import Dict, Any, Optional
from models import HmiDslModel, ResolutionResultModel
from context_graph import MachineContextGraph

SYSTEM_PROMPT = """
You are the SCREENLESS-HMI AI Screen Planner for Schneider Electric Industrial Automation.
Your job is to generate a dynamic HMI DSL JSON specification based on the machine context, operator prompt, and live state.

CRITICAL GUARDED PERMISSION & SAFETY RULES:
1. Only use tag IDs existing in the supplied machine context. Never invent tags.
2. Only use alarm IDs existing in the supplied machine context. Never invent alarms.
3. Only use asset IDs existing in the supplied machine context. Never invent assets.
4. Never generate executable JavaScript, HTML, or code scripts.
5. If the operator prompt requests a VIEW / MONITORING query (e.g., "show temperature", "check door switch", "what is tank level"), generate ONLY read-only widgets:
   - "status" (for boolean status tags like Motor_1_RunStatus, Emergency_Stop, Door_Switch)
   - "analog" (for process variables like Pressure_PV, Temperature_PV, Tank_Level)
   - "gauge" (for bounded analog values)
   - "trend" (for time-series data)
   - "alarm_banner" or "alarm_list"
   - "equipment_graphic"
6. If the operator prompt requests a CONTROL action (e.g., "start motor", "set speed"):
   - If the target tag is writable (writable == true, safety_type == "command" or "setpoint"): generate "command_button" or "setpoint".
   - If the target tag is read-only (writable == false, safety_type == "monitor"): propose a "command_button" bound to that read-only tag so that the Safety Validation Gate intercepts and blocks it.
7. Output ONLY valid JSON matching the HMI DSL structure without markdown formatting or code blocks.
"""

class ScreenComposer:
    def __init__(self, context_graph: MachineContextGraph):
        self.context = context_graph
        self.api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("LLM_API_KEY")

    def compose(self, prompt: str, live_state: Dict[str, Any], resolved: ResolutionResultModel) -> Dict[str, Any]:
        p_lower = prompt.lower()

        # Use Gemini API if self.api_key is provided and DEMO_AI_MODE is not explicitly set to "true"
        if self.api_key and os.environ.get("DEMO_AI_MODE", "").lower() != "true":
            try:
                print(f"[Composer] Calling Gemini API for prompt: '{prompt}'...")
                return self._call_gemini_api(prompt, live_state, resolved)
            except Exception as e:
                print(f"[Composer] Gemini API call failed ({e}). Using dynamic machine fallback composer.")
                return self._deterministic_fallback_composer(prompt, live_state, resolved)

        return self._deterministic_fallback_composer(prompt, live_state, resolved)

    def _call_gemini_api(self, prompt: str, live_state: Dict[str, Any], resolved: ResolutionResultModel) -> Dict[str, Any]:
        # Try primary model endpoint, with fallback model endpoints if needed
        model_endpoints = [
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ]
        
        context_summary = {
            "all_assets": list(self.context.assets.keys()),
            "all_tags": [{
                "id": t.id,
                "name": t.name,
                "asset": t.asset,
                "safety_type": t.safety_type,
                "writable": t.writable,
                "unit": getattr(t, "unit", "")
            } for t in self.context.tags.values()],
            "all_alarms": list(self.context.alarms.keys()),
            "resolved_tags": resolved.resolved_tags,
            "resolved_assets": resolved.resolved_assets
        }

        user_content = f"""
Operator Prompt: "{prompt}"
Machine Context Graph: {json.dumps(context_summary)}
Live Telemetry State: {json.dumps(live_state)}

Generate the HMI DSL JSON object matching the requested view or control action.
        """

        payload = {
            "contents": [{
                "parts": [
                    {"text": SYSTEM_PROMPT},
                    {"text": user_content}
                ]
            }],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        last_err = None
        for model in model_endpoints:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
                response = httpx.post(url, json=payload, timeout=15.0)
                response.raise_for_request()
                res_json = response.json()
                raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(raw_text)
            except Exception as err:
                last_err = err
                print(f"[Composer] Gemini model {model} failed: {err}")

        raise last_err or Exception("All Gemini models failed")

    def _deterministic_fallback_composer(self, prompt: str, live_state: Dict[str, Any], resolved: ResolutionResultModel) -> Dict[str, Any]:
        p_lower = prompt.lower()

        # SCENARIO 3 Intentional Safety Violation Trigger (for any monitor tag bound to a start/command control)
        has_action_intent = ("start" in p_lower or "command" in p_lower or "button" in p_lower or "run" in p_lower or "override" in p_lower or "trigger" in p_lower)
        
        monitor_tag_map = {
            "temperature": ("Temperature_PV", "Process Temperature", "°C", "Motor 1"),
            "temp": ("Temperature_PV", "Process Temperature", "°C", "Motor 1"),
            "pressure": ("Pressure_PV", "Pneumatic Line Pressure", "bar", "Sensors"),
            "press": ("Pressure_PV", "Pneumatic Line Pressure", "bar", "Sensors"),
            "current": ("Motor_1_Current", "Motor 1 Amperage", "A", "Motor 1"),
            "amp": ("Motor_1_Current", "Motor 1 Amperage", "A", "Motor 1"),
            "tank": ("Tank_Level", "Raw Material Tank Level", "%", "Feed Pump 101"),
            "level": ("Tank_Level", "Raw Material Tank Level", "%", "Feed Pump 101"),
        }

        if has_action_intent:
            for kw, (t_id, t_title, t_unit, t_asset) in monitor_tag_map.items():
                if kw in p_lower:
                    return {
                        "screen": "Unsafe_Binding_Test",
                        "title": f"Unsafe {t_title} Command Button",
                        "layout": "responsive",
                        "widgets": [
                            {
                                "type": "status",
                                "tag": "Motor_1_RunStatus",
                                "title": f"{t_asset} Status"
                            },
                            {
                                "type": "analog",
                                "tag": t_id,
                                "title": t_title,
                                "unit": t_unit
                            },
                            {
                                "type": "command_button",
                                "tag": t_id,
                                "label": f"START VIA {t_id} (UNSAFE BINDING)"
                            }
                        ],
                        "navigation": ["Packaging_Line_1", "Sensors"]
                    }

        # SCENARIO 1: Conveyor health & motor faults
        if "conveyor" in p_lower or "motor" in p_lower or "fault" in p_lower:
            widgets = [
                {
                    "type": "equipment_graphic",
                    "asset": "Conveyor_A",
                    "stateTag": "Motor_1_RunStatus",
                    "title": "Conveyor Packaging Line Visualizer"
                },
                {
                    "type": "status",
                    "tag": "Motor_1_RunStatus",
                    "title": "Motor 1 Running State"
                },
                {
                    "type": "analog",
                    "tag": "Motor_1_Current",
                    "title": "Motor 1 Current",
                    "unit": "A"
                },
                {
                    "type": "trend",
                    "tag": "Conveyor_Speed_PV",
                    "title": "Conveyor Speed Trend (m/s)",
                    "window": "5m"
                },
                {
                    "type": "alarm_banner",
                    "alarm": "Motor_Trip",
                    "title": "Motor Thermal Overload Status"
                }
            ]

            # If Motor 2 exists in context, automatically include Motor 2 widgets!
            if "Motor_2" in self.context.assets:
                widgets.append({
                    "type": "status",
                    "tag": "Motor_2_RunStatus",
                    "title": "Motor 2 Running State"
                })
                widgets.append({
                    "type": "analog",
                    "tag": "Motor_2_Current",
                    "title": "Motor 2 Current",
                    "unit": "A"
                })

            return {
                "screen": "Conveyor_Health_Overview",
                "title": "Conveyor A & Motor Health Status",
                "layout": "responsive",
                "widgets": widgets,
                "navigation": ["Packaging_Line_1", "Conveyor_A", "Sensors"]
            }

        # SCENARIO: Packaging Unit & Safety Interlocks
        if "packaging unit" in p_lower or "sealer" in p_lower or "guard" in p_lower or "door" in p_lower:
            return {
                "screen": "Packaging_Unit_Screen",
                "title": "Packaging Unit & Safety Interlocks Overview",
                "layout": "responsive",
                "widgets": [
                    {
                        "type": "equipment_graphic",
                        "asset": "Packaging_Unit",
                        "stateTag": "Door_Switch",
                        "title": "Packaging Unit & Safety Guard Visualizer"
                    },
                    {
                        "type": "status",
                        "tag": "Door_Switch",
                        "title": "Enclosure Safety Guard Door Switch"
                    },
                    {
                        "type": "status",
                        "tag": "Emergency_Stop",
                        "title": "Safety Interlock E-Stop Circuit"
                    },
                    {
                        "type": "analog",
                        "tag": "Temperature_PV",
                        "title": "Sealer Heating Element Temperature",
                        "unit": "°C"
                    },
                    {
                        "type": "alarm_banner",
                        "alarm": "Safety_Door_Open",
                        "title": "Enclosure Guard Door Status Alert"
                    }
                ],
                "navigation": ["Packaging_Unit", "Packaging_Line_1", "Sensors"]
            }

        # SCENARIO: Sensor Suite (Temperature, Pressure & Alarms)
        if "sensor" in p_lower or "temperature" in p_lower or "pressure" in p_lower or "active alarm" in p_lower:
            return {
                "screen": "Process_Environment_Screen",
                "title": "Process Temperature & Pressure Monitoring (Sensor Suite)",
                "layout": "responsive",
                "widgets": [
                    {
                        "type": "gauge",
                        "tag": "Temperature_PV",
                        "title": "Line Ambient Temperature",
                        "unit": "°C",
                        "min": 0,
                        "max": 120
                    },
                    {
                        "type": "analog",
                        "tag": "Pressure_PV",
                        "title": "Pneumatic Line Pressure",
                        "unit": "bar"
                    },
                    {
                        "type": "trend",
                        "tag": "Temperature_PV",
                        "title": "Temperature Live Trend",
                        "window": "5m"
                    },
                    {
                        "type": "alarm_banner",
                        "alarm": "High_Temperature",
                        "title": "Critical High Temperature Alert"
                    },
                    {
                        "type": "alarm_list",
                        "title": "Active Alarms Panel"
                    }
                ],
                "navigation": ["Sensors", "Packaging_Unit"]
            }

        # Control prompt
        if "control" in p_lower or "start" in p_lower or "stop" in p_lower or "setpoint" in p_lower:
            return {
                "screen": "Motor_Control_Screen",
                "title": "Motor 1 Command & Speed Control",
                "layout": "responsive",
                "widgets": [
                    {
                        "type": "status",
                        "tag": "Motor_1_RunStatus",
                        "title": "Motor 1 Run Status"
                    },
                    {
                        "type": "command_button",
                        "tag": "Motor_1_Start",
                        "label": "START MOTOR 1"
                    },
                    {
                        "type": "command_button",
                        "tag": "Motor_1_Stop",
                        "label": "STOP MOTOR 1"
                    },
                    {
                        "type": "setpoint",
                        "tag": "Conveyor_Speed_SP",
                        "title": "Conveyor Speed Target",
                        "unit": "m/s",
                        "min": 0,
                        "max": 50,
                        "step": 1.0
                    },
                    {
                        "type": "trend",
                        "tag": "Conveyor_Speed_PV",
                        "title": "Measured Speed Feedback",
                        "window": "5m"
                    }
                ],
                "navigation": ["Conveyor_A", "Packaging_Line_1"]
            }

        # DYNAMIC MACHINE CONTEXT RESOLUTION (For any free-form operator prompt)
        if resolved.resolved_tags:
            dynamic_widgets = []
            for tag_id in resolved.resolved_tags:
                if tag_id in self.context.tags:
                    t_meta = self.context.tags[tag_id]
                    if t_meta.type == "boolean":
                        if t_meta.writable and t_meta.safety_type == "command":
                            dynamic_widgets.append({
                                "type": "command_button",
                                "tag": tag_id,
                                "label": f"COMMAND {t_meta.name.upper()}"
                            })
                        else:
                            dynamic_widgets.append({
                                "type": "status",
                                "tag": tag_id,
                                "title": t_meta.name
                            })
                    else:
                        if t_meta.writable and t_meta.safety_type == "setpoint":
                            dynamic_widgets.append({
                                "type": "setpoint",
                                "tag": tag_id,
                                "title": t_meta.name,
                                "unit": getattr(t_meta, "unit", ""),
                                "min": getattr(t_meta, "min", 0),
                                "max": getattr(t_meta, "max", 100)
                            })
                        elif getattr(t_meta, "min", None) is not None and getattr(t_meta, "max", None) is not None:
                            dynamic_widgets.append({
                                "type": "gauge",
                                "tag": tag_id,
                                "title": t_meta.name,
                                "unit": getattr(t_meta, "unit", ""),
                                "min": t_meta.min,
                                "max": t_meta.max
                            })
                        else:
                            dynamic_widgets.append({
                                "type": "analog",
                                "tag": tag_id,
                                "title": t_meta.name,
                                "unit": getattr(t_meta, "unit", "")
                            })

            if dynamic_widgets:
                return {
                    "screen": "Dynamic_Context_View",
                    "title": f"Dynamic Machine View ({prompt.strip()[:40]})",
                    "layout": "responsive",
                    "widgets": dynamic_widgets,
                    "navigation": resolved.resolved_assets or ["Packaging_Line_1"]
                }

        # Default / Full Machine Health Overview
        widgets = [
            {
                "type": "kpi",
                "title": "Machine Overall Health",
                "tag": "Motor_1_RunStatus"
            },
            {
                "type": "equipment_graphic",
                "asset": "Conveyor_A",
                "stateTag": "Motor_1_RunStatus",
                "title": "Packaging Line 1 Live Diagram"
            },
            {
                "type": "analog",
                "tag": "Temperature_PV",
                "title": "Process Temp",
                "unit": "°C"
            },
            {
                "type": "analog",
                "tag": "Pressure_PV",
                "title": "Line Pressure",
                "unit": "bar"
            },
            {
                "type": "status",
                "tag": "Motor_1_RunStatus",
                "title": "Motor 1 Status"
            },
            {
                "type": "trend",
                "tag": "Conveyor_Speed_PV",
                "title": "Conveyor Speed Trend",
                "window": "5m"
            },
            {
                "type": "alarm_list",
                "title": "Active Alarms"
            }
        ]

        if "Motor_2" in self.context.assets:
            widgets.insert(5, {
                "type": "status",
                "tag": "Motor_2_RunStatus",
                "title": "Motor 2 Secondary Status"
            })
            widgets.insert(6, {
                "type": "analog",
                "tag": "Motor_2_Current",
                "title": "Motor 2 Current",
                "unit": "A"
            })

        return {
            "screen": "Complete_Machine_Overview",
            "title": "Packaging Line 1 Full Status",
            "layout": "responsive",
            "widgets": widgets,
            "navigation": ["Packaging_Line_1", "Conveyor_A", "Feed_Pump_101", "Packaging_Unit", "Sensors"]
        }

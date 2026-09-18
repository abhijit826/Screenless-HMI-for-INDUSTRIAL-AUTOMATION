import re
from typing import Dict, Any, List, Set
from models import ResolutionResultModel
from context_graph import MachineContextGraph

class EntityResolver:
    def __init__(self, context_graph: MachineContextGraph):
        self.context = context_graph

    def resolve(self, prompt: str) -> ResolutionResultModel:
        p_lower = prompt.lower()
        
        resolved_assets: Set[str] = set()
        resolved_tags: Set[str] = set()
        resolved_alarms: Set[str] = set()
        resolved_io: Set[str] = set()

        # 1. Keywords mapping for Assets
        if any(w in p_lower for w in ["conveyor", "belt", "line 1"]):
            resolved_assets.add("Conveyor_A")
        if any(w in p_lower for w in ["motor 1", "motor1"]):
            resolved_assets.add("Motor_1")
        if any(w in p_lower for w in ["motor 2", "motor2"]):
            resolved_assets.add("Motor_2")
        if "motor" in p_lower and not ("motor 1" in p_lower or "motor 2" in p_lower):
            resolved_assets.add("Motor_1")
            if "Motor_2" in self.context.assets:
                resolved_assets.add("Motor_2")
        if any(w in p_lower for w in ["pump", "feed", "tank", "level"]):
            resolved_assets.add("Feed_Pump_101")
        if any(w in p_lower for w in ["unit", "sealing", "packaging unit", "door", "valve"]):
            resolved_assets.add("Packaging_Unit")
        if any(w in p_lower for w in ["sensor", "temperature", "pressure"]):
            resolved_assets.add("Sensors")
        if any(w in p_lower for w in ["all", "overall", "health", "overview", "complete", "line"]):
            resolved_assets.update(self.context.assets.keys())

        # 2. Tag mapping based on keywords & assets
        for tag_id, tag in self.context.tags.items():
            t_name = tag.name.lower()
            t_id = tag_id.lower()
            
            # Direct keyword hits
            if "temperature" in p_lower and ("temp" in t_id or "temperature" in t_name):
                resolved_tags.add(tag_id)
            if "pressure" in p_lower and ("press" in t_id or "pressure" in t_name):
                resolved_tags.add(tag_id)
            if "speed" in p_lower and ("speed" in t_id or "speed" in t_name):
                resolved_tags.add(tag_id)
            if "fault" in p_lower or "trip" in p_lower:
                if "trip" in t_id or "fault" in t_name:
                    resolved_tags.add(tag_id)
            if "start" in p_lower and "start" in t_id:
                resolved_tags.add(tag_id)
            if "stop" in p_lower and "stop" in t_id:
                resolved_tags.add(tag_id)
            if "status" in p_lower or "run" in p_lower or "health" in p_lower:
                if "status" in t_id or "run" in t_id or "status" in t_name:
                    resolved_tags.add(tag_id)

            # Asset-connected tags
            if tag.asset in resolved_assets:
                resolved_tags.add(tag_id)

        # 3. Alarm resolution
        for alarm_id, alarm in self.context.alarms.items():
            a_name = alarm.name.lower()
            a_id = alarm_id.lower()
            if any(w in p_lower for w in ["alarm", "fault", "trip", "warning", "critical", "health"]):
                resolved_alarms.add(alarm_id)
            elif alarm.source in resolved_tags or alarm.asset in resolved_assets:
                resolved_alarms.add(alarm_id)
            elif "temp" in p_lower and "temp" in a_id:
                resolved_alarms.add(alarm_id)
            elif "press" in p_lower and "press" in a_id:
                resolved_alarms.add(alarm_id)

        # 4. IO resolution
        for io_id, io_item in self.context.io.items():
            if io_item.bound_tag in resolved_tags:
                resolved_io.add(io_id)

        # Fallback default if nothing matched
        if not resolved_tags:
            resolved_tags.update(["Motor_1_RunStatus", "Motor_1_Current", "Conveyor_Speed_PV"])
            resolved_assets.add("Conveyor_A")

        return ResolutionResultModel(
            resolved_assets=sorted(list(resolved_assets)),
            resolved_tags=sorted(list(resolved_tags)),
            resolved_alarms=sorted(list(resolved_alarms)),
            resolved_io=sorted(list(resolved_io))
        )

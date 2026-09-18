import asyncio
import random
import time
from typing import Dict, Any, List

class MachineSimulator:
    def __init__(self):
        self.state: Dict[str, Any] = {
            "Motor_1_RunStatus": True,
            "Motor_1_Current": 14.2,
            "Motor_1_Speed": 1485.0,
            "Motor_1_Trip": False,
            "Conveyor_Speed_PV": 24.5,
            "Conveyor_Speed_SP": 25.0,
            "Temperature_PV": 72.0,
            "Pressure_PV": 6.2,
            "Tank_Level": 78.5,
            "Emergency_Stop": False,
            "Door_Switch": True,
            "Pump_101_RunStatus": True,
            "Valve_102_Status": True,
            "Motor_2_RunStatus": True,
            "Motor_2_Current": 13.8,
            "Motor_2_Trip": False
        }
        self.active_alarms: List[Dict[str, Any]] = []
        self.cycle_count = 0
        self.is_running = False
        self.force_temp_spike = False

    def trigger_temp_spike(self):
        self.force_temp_spike = True

    def apply_command(self, tag: str, val: Any = True):
        if tag in ["Motor_1_Start", "Start_Motor_1"] or (tag == "Motor_1_RunStatus" and val):
            self.state["Motor_1_RunStatus"] = True
            self.state["Motor_1_Trip"] = False
        elif tag in ["Motor_1_Stop", "Stop_Motor_1"] or (tag == "Motor_1_RunStatus" and not val):
            self.state["Motor_1_RunStatus"] = False
        elif tag in ["Motor_2_Start", "Start_Motor_2"] or (tag == "Motor_2_RunStatus" and val):
            self.state["Motor_2_RunStatus"] = True
            self.state["Motor_2_Trip"] = False
        elif tag in ["Motor_2_Stop", "Stop_Motor_2"] or (tag == "Motor_2_RunStatus" and not val):
            self.state["Motor_2_RunStatus"] = False
        elif tag in ["Pump_101_Start", "Feed_Pump_101_Start", "Start_Pump_101"] or (tag == "Pump_101_RunStatus" and val):
            self.state["Pump_101_RunStatus"] = True
        elif tag in ["Pump_101_Stop", "Feed_Pump_101_Stop", "Stop_Pump_101"] or (tag == "Pump_101_RunStatus" and not val):
            self.state["Pump_101_RunStatus"] = False
        elif tag in ["Conveyor_Speed_SP", "Motor_1_Speed", "Speed_SP"]:
            try:
                num_val = float(val)
                self.state["Conveyor_Speed_SP"] = num_val
                self.state["Conveyor_Speed_PV"] = num_val
                if num_val > 0:
                    self.state["Motor_1_RunStatus"] = True
                else:
                    self.state["Motor_1_RunStatus"] = False
            except Exception:
                pass
        elif tag in self.state:
            self.state[tag] = val

    def update_cycle(self):
        self.cycle_count += 1
        
        # 1. Update Conveyor & Motor 1 values based on Motor_1_RunStatus
        m1_running = bool(self.state.get("Motor_1_RunStatus", True))
        if m1_running:
            self.state["Motor_1_Current"] = round(14.0 + random.uniform(-1.5, 2.5), 2)
            self.state["Motor_1_Speed"] = round(1480.0 + random.uniform(-15.0, 15.0), 1)
            self.state["Conveyor_Speed_PV"] = round(24.5 + random.uniform(-1.2, 1.2), 2)
        else:
            self.state["Motor_1_Current"] = 0.0
            self.state["Motor_1_Speed"] = 0.0
            self.state["Conveyor_Speed_PV"] = 0.0

        # 2. Temperature fluctuations with periodic high-temperature spike
        if m1_running:
            if self.force_temp_spike or (self.cycle_count % 12 == 0 and random.random() > 0.3):
                # Push temperature over 90 °C
                self.state["Temperature_PV"] = round(92.5 + random.uniform(0.5, 4.0), 1)
                self.force_temp_spike = False
            else:
                # Normal temp range 68 - 82 °C
                prev_temp = self.state.get("Temperature_PV", 72.0)
                if prev_temp > 85.0:
                    self.state["Temperature_PV"] = round(prev_temp - 3.0, 1)
                else:
                    self.state["Temperature_PV"] = round(68.0 + random.uniform(0.0, 14.0), 1)
        else:
            # Temperature cools down when motor is stopped
            prev_temp = self.state.get("Temperature_PV", 70.0)
            if prev_temp > 25.0:
                self.state["Temperature_PV"] = round(max(25.0, prev_temp - 2.0), 1)

        # 3. Feed Pump 101 status and Pressure & Tank Level fluctuations
        pump_running = bool(self.state.get("Pump_101_RunStatus", True))
        if pump_running:
            self.state["Pressure_PV"] = round(6.2 + random.uniform(-0.4, 0.4), 2)
            self.state["Tank_Level"] = round(78.5 + random.uniform(-1.0, 1.0), 1)
        else:
            self.state["Pressure_PV"] = round(0.5 + random.uniform(-0.1, 0.1), 2)

        # 4. Motor 2 values based on Motor_2_RunStatus
        m2_running = bool(self.state.get("Motor_2_RunStatus", True))
        if m2_running:
            self.state["Motor_2_Current"] = round(13.5 + random.uniform(-1.2, 2.0), 2)
        else:
            self.state["Motor_2_Current"] = 0.0

        # 5. Evaluate Active Alarms
        new_alarms = []
        now_str = time.strftime("%H:%M:%S")

        if self.state["Temperature_PV"] > 90.0:
            new_alarms.append({
                "id": "High_Temperature",
                "name": "Line High Temperature Alarm",
                "priority": "Critical",
                "severity": "High",
                "val": self.state["Temperature_PV"],
                "unit": "°C",
                "source": "Temperature_PV",
                "asset": "Sensors",
                "timestamp": now_str,
                "message": f"Packaging line temperature exceeded limit! ({self.state['Temperature_PV']} °C > 90.0 °C)"
            })

        if self.state["Motor_1_Trip"]:
            new_alarms.append({
                "id": "Motor_Trip",
                "name": "Motor 1 Thermal Trip",
                "priority": "High",
                "severity": "High",
                "val": True,
                "source": "Motor_1_Trip",
                "asset": "Motor_1",
                "timestamp": now_str,
                "message": "Conveyor Motor 1 overload protection trip!"
            })

        if self.state["Pressure_PV"] < 1.0:
            new_alarms.append({
                "id": "Low_Pressure",
                "name": "Pneumatic Low Pressure",
                "priority": "Warning",
                "severity": "Medium",
                "val": self.state["Pressure_PV"],
                "unit": "bar",
                "source": "Pressure_PV",
                "asset": "Sensors",
                "timestamp": now_str,
                "message": f"Supply pressure low ({self.state['Pressure_PV']} bar < 1.0 bar)"
            })

        self.active_alarms = new_alarms

    def get_snapshot(self) -> Dict[str, Any]:
        return {
            "timestamp": time.time(),
            "time_formatted": time.strftime("%H:%M:%S"),
            "values": self.state,
            "active_alarms": self.active_alarms,
            "alarm_count": len(self.active_alarms)
        }

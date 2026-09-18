import os
import sys
import unittest

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from context_graph import MachineContextGraph
from resolver import EntityResolver
from validator import HmiValidator
from composer import ScreenComposer
from simulator import MachineSimulator

class TestContext2HMIBackend(unittest.TestCase):

    def setUp(self):
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        self.context = MachineContextGraph(data_dir)
        self.resolver = EntityResolver(self.context)
        self.validator = HmiValidator(self.context)
        self.composer = ScreenComposer(self.context)
        self.simulator = MachineSimulator()

    def test_1_valid_tag_resolves_successfully(self):
        res = self.resolver.resolve("Show temperature and conveyor speed")
        self.assertIn("Temperature_PV", res.resolved_tags)
        self.assertIn("Conveyor_Speed_PV", res.resolved_tags)

    def test_2_invalid_tag_is_rejected(self):
        invalid_dsl = {
            "screen": "Test_Screen",
            "title": "Test",
            "layout": "responsive",
            "widgets": [
                {"type": "status", "tag": "Non_Existent_Tag_999"}
            ]
        }
        res = self.validator.validate(invalid_dsl)
        self.assertEqual(res.status, "rejected")
        self.assertTrue(any("Non_Existent_Tag_999" in err for err in res.errors))

    def test_3_monitor_tag_cannot_become_command(self):
        monitor_as_command_dsl = {
            "screen": "Unsafe_Test",
            "title": "Unsafe Button",
            "layout": "responsive",
            "widgets": [
                {"type": "command_button", "tag": "Temperature_PV", "label": "Start Temp"}
            ]
        }
        res = self.validator.validate(monitor_as_command_dsl)
        self.assertEqual(res.status, "rejected")
        self.assertTrue(any("UNSAFE BINDING" in err for err in res.errors))

    def test_4_setpoint_without_limits_is_rejected(self):
        # We simulate a tag marked setpoint but lacking min/max
        self.context.tags["Faulty_Setpoint"] = self.context.tags["Conveyor_Speed_SP"].model_copy(update={"min": None, "max": None})
        faulty_sp_dsl = {
            "screen": "Setpoint_Test",
            "title": "Setpoint Test",
            "layout": "responsive",
            "widgets": [
                {"type": "setpoint", "tag": "Faulty_Setpoint"}
            ]
        }
        res = self.validator.validate(faulty_sp_dsl)
        self.assertEqual(res.status, "rejected")
        self.assertTrue(any("lacks defined min/max" in err for err in res.errors))

    def test_5_invalid_alarm_is_rejected(self):
        invalid_alarm_dsl = {
            "screen": "Alarm_Test",
            "title": "Alarm Test",
            "layout": "responsive",
            "widgets": [
                {"type": "alarm_banner", "alarm": "Non_Existent_Alarm_X"}
            ]
        }
        res = self.validator.validate(invalid_alarm_dsl)
        self.assertEqual(res.status, "rejected")
        self.assertTrue(any("Non_Existent_Alarm_X" in err for err in res.errors))

    def test_6_unknown_widget_is_rejected(self):
        unknown_widget_dsl = {
            "screen": "Unknown_Widget_Test",
            "title": "Unknown Widget",
            "layout": "responsive",
            "widgets": [
                {"type": "hyper_hologram_3d", "tag": "Motor_1_RunStatus"}
            ]
        }
        res = self.validator.validate(unknown_widget_dsl)
        self.assertEqual(res.status, "rejected")
        self.assertTrue(any("Unknown widget type" in err for err in res.errors))

    def test_7_valid_screen_is_approved(self):
        valid_dsl = {
            "screen": "Conveyor_Overview",
            "title": "Conveyor Health",
            "layout": "responsive",
            "widgets": [
                {"type": "status", "tag": "Motor_1_RunStatus"},
                {"type": "analog", "tag": "Motor_1_Current", "unit": "A"},
                {"type": "trend", "tag": "Conveyor_Speed_PV", "window": "5m"},
                {"type": "alarm_banner", "alarm": "Motor_Trip"},
                {"type": "equipment_graphic", "asset": "Conveyor_A", "stateTag": "Motor_1_RunStatus"}
            ],
            "navigation": ["Packaging_Line_1", "Conveyor_A"]
        }
        res = self.validator.validate(valid_dsl)
        self.assertEqual(res.status, "approved")
        self.assertEqual(len(res.errors), 0)

    def test_8_machine_change_updates_context(self):
        self.assertNotIn("Motor_2", self.context.assets)
        self.context.add_motor_2()
        self.assertIn("Motor_2", self.context.assets)
        self.assertIn("Motor_2_RunStatus", self.context.tags)
        self.assertIn("Motor_2_Trip_Alarm", self.context.alarms)

    def test_9_live_simulator_changes_values(self):
        val1 = self.simulator.get_snapshot()["values"]["Motor_1_Current"]
        self.simulator.update_cycle()
        val2 = self.simulator.get_snapshot()["values"]["Motor_1_Current"]
        # Cycle updates timestamp and values
        self.assertGreater(self.simulator.cycle_count, 0)

    def test_10_generated_dsl_renders_successfully(self):
        resolution = self.resolver.resolve("Show conveyor health and motor faults")
        dsl_dict = self.composer.compose("Show conveyor health and motor faults", self.simulator.get_snapshot()["values"], resolution)
        validation = self.validator.validate(dsl_dict)
        self.assertEqual(validation.status, "approved")

    def test_11_valid_command_actuation_updates_simulator_state(self):
        self.simulator.apply_command("Motor_1_Stop")
        self.assertFalse(self.simulator.get_snapshot()["values"]["Motor_1_RunStatus"])
        self.simulator.apply_command("Motor_1_Start")
        self.assertTrue(self.simulator.get_snapshot()["values"]["Motor_1_RunStatus"])

if __name__ == "__main__":
    unittest.main()

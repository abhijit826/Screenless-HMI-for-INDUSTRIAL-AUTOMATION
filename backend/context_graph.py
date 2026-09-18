import json
import os
from typing import Dict, Any, List, Optional
import networkx as nx
from models import TagModel, IOModel, AlarmModel, AssetModel, CommsModel, DocModel

class MachineContextGraph:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.graph = nx.DiGraph()
        self.tags: Dict[str, TagModel] = {}
        self.io: Dict[str, IOModel] = {}
        self.alarms: Dict[str, AlarmModel] = {}
        self.assets: Dict[str, Dict[str, Any]] = {}
        self.comms: Dict[str, CommsModel] = {}
        self.docs: Dict[str, DocModel] = {}
        self.load_and_build()

    def load_and_build(self):
        self.graph.clear()
        
        # 1. Load Assets
        asset_file = os.path.join(self.data_dir, "asset_hierarchy.json")
        if os.path.exists(asset_file):
            with open(asset_file, "r") as f:
                root_asset = json.load(f)
                self._process_asset_tree(root_asset)

        # 2. Load Tags
        tags_file = os.path.join(self.data_dir, "tags.json")
        if os.path.exists(tags_file):
            with open(tags_file, "r") as f:
                raw_tags = json.load(f)
                for item in raw_tags:
                    tag = TagModel(**item)
                    self.tags[tag.id] = tag
                    self.graph.add_node(tag.id, type="tag", data=tag.model_dump())
                    if tag.asset and tag.asset in self.graph:
                        self.graph.add_edge(tag.asset, tag.id, relation="has_tag")

        # 3. Load IO
        io_file = os.path.join(self.data_dir, "io.json")
        if os.path.exists(io_file):
            with open(io_file, "r") as f:
                raw_io = json.load(f)
                for item in raw_io:
                    io_item = IOModel(**item)
                    self.io[io_item.id] = io_item
                    self.graph.add_node(io_item.id, type="io", data=io_item.model_dump())
                    if io_item.bound_tag and io_item.bound_tag in self.graph:
                        self.graph.add_edge(io_item.bound_tag, io_item.id, relation="bound_to_io")

        # 4. Load Alarms
        alarms_file = os.path.join(self.data_dir, "alarms.json")
        if os.path.exists(alarms_file):
            with open(alarms_file, "r") as f:
                raw_alarms = json.load(f)
                for item in raw_alarms:
                    alarm = AlarmModel(**item)
                    self.alarms[alarm.id] = alarm
                    self.graph.add_node(alarm.id, type="alarm", data=alarm.model_dump())
                    if alarm.asset and alarm.asset in self.graph:
                        self.graph.add_edge(alarm.asset, alarm.id, relation="has_alarm")
                    if alarm.source and alarm.source in self.graph:
                        self.graph.add_edge(alarm.source, alarm.id, relation="triggers_alarm")

        # 5. Load Comms
        comms_file = os.path.join(self.data_dir, "comms.json")
        if os.path.exists(comms_file):
            with open(comms_file, "r") as f:
                raw_comms = json.load(f)
                for item in raw_comms:
                    comm = CommsModel(**item)
                    self.comms[comm.id] = comm
                    self.graph.add_node(comm.id, type="comms", data=comm.model_dump())
                    for linked_asset in comm.linked_assets:
                        if linked_asset in self.graph:
                            self.graph.add_edge(linked_asset, comm.id, relation="uses_comms")

        # 6. Load Docs
        docs_file = os.path.join(self.data_dir, "docs.json")
        if os.path.exists(docs_file):
            with open(docs_file, "r") as f:
                raw_docs = json.load(f)
                for item in raw_docs:
                    doc = DocModel(**item)
                    self.docs[doc.id] = doc
                    self.graph.add_node(doc.id, type="doc", data=doc.model_dump())
                    if doc.asset and doc.asset in self.graph:
                        self.graph.add_edge(doc.asset, doc.id, relation="has_doc")

    def _process_asset_tree(self, node: Dict[str, Any], parent_id: Optional[str] = None):
        asset_id = node["id"]
        self.assets[asset_id] = {
            "id": node["id"],
            "name": node["name"],
            "type": node["type"]
        }
        self.graph.add_node(asset_id, type="asset", data=self.assets[asset_id])
        if parent_id:
            self.graph.add_edge(parent_id, asset_id, relation="has_child")
        
        for child in node.get("children", []):
            self._process_asset_tree(child, asset_id)

    def add_motor_2(self):
        """Dynamically add Motor 2 tags, alarm, and asset to the graph."""
        motor2_id = "Motor_2"
        if motor2_id not in self.assets:
            self.assets[motor2_id] = {
                "id": motor2_id,
                "name": "Drive Motor 2 (Secondary)",
                "type": "ControlModule"
            }
            self.graph.add_node(motor2_id, type="asset", data=self.assets[motor2_id])
            if "Conveyor_A" in self.graph:
                self.graph.add_edge("Conveyor_A", motor2_id, relation="has_child")

        new_tags = [
            TagModel(
                id="Motor_2_RunStatus",
                name="Motor 2 Run Status",
                type="boolean",
                unit="",
                description="Running feedback for Secondary Motor 2",
                asset="Motor_2",
                safety_type="monitor",
                writable=False
            ),
            TagModel(
                id="Motor_2_Current",
                name="Motor 2 Current",
                type="float",
                unit="A",
                description="Amperage draw of Motor 2",
                asset="Motor_2",
                safety_type="monitor",
                writable=False,
                min=0.0,
                max=25.0
            ),
            TagModel(
                id="Motor_2_Trip",
                name="Motor 2 Thermal Trip",
                type="boolean",
                unit="",
                description="Overload relay status for Motor 2",
                asset="Motor_2",
                safety_type="monitor",
                writable=False
            ),
            TagModel(
                id="Motor_2_Start",
                name="Motor 2 Start Command",
                type="boolean",
                unit="",
                description="Start command for Motor 2",
                asset="Motor_2",
                safety_type="command",
                writable=True,
                requires_interlock=True,
                required_role="operator"
            ),
            TagModel(
                id="Motor_2_Stop",
                name="Motor 2 Stop Command",
                type="boolean",
                unit="",
                description="Stop command for Motor 2",
                asset="Motor_2",
                safety_type="command",
                writable=True,
                requires_interlock=True,
                required_role="operator"
            )
        ]

        for tag in new_tags:
            self.tags[tag.id] = tag
            self.graph.add_node(tag.id, type="tag", data=tag.model_dump())
            self.graph.add_edge(motor2_id, tag.id, relation="has_tag")

        new_alarm = AlarmModel(
            id="Motor_2_Trip_Alarm",
            name="Motor 2 Overload Trip",
            priority="High",
            severity="High",
            condition="trigger == true",
            trigger_val=True,
            source="Motor_2_Trip",
            asset="Motor_2",
            message="Secondary Conveyor Motor 2 tripped!"
        )
        self.alarms[new_alarm.id] = new_alarm
        self.graph.add_node(new_alarm.id, type="alarm", data=new_alarm.model_dump())
        self.graph.add_edge(motor2_id, new_alarm.id, relation="has_alarm")
        self.graph.add_edge("Motor_2_Trip", new_alarm.id, relation="triggers_alarm")

    def get_context_export(self) -> Dict[str, Any]:
        return {
            "node_count": self.graph.number_of_nodes(),
            "edge_count": self.graph.number_of_edges(),
            "assets": self.assets,
            "tags": {k: v.model_dump() for k, v in self.tags.items()},
            "io": {k: v.model_dump() for k, v in self.io.items()},
            "alarms": {k: v.model_dump() for k, v in self.alarms.items()},
            "comms": {k: v.model_dump() for k, v in self.comms.items()},
            "docs": {k: v.model_dump() for k, v in self.docs.items()}
        }

    def get_context_summary(self) -> Dict[str, Any]:
        return {
            "system_name": "Packaging Line 1 Machine Context",
            "total_assets": len(self.assets),
            "total_tags": len(self.tags),
            "total_alarms": len(self.alarms),
            "total_io": len(self.io),
            "asset_list": [a["name"] for a in self.assets.values()],
            "tag_list": list(self.tags.keys()),
            "alarm_list": list(self.alarms.keys())
        }

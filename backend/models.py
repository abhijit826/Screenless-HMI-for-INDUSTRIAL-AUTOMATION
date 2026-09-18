from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field

class TagModel(BaseModel):
    id: str
    name: str
    type: str  # "float", "boolean", "integer"
    unit: Optional[str] = ""
    description: Optional[str] = ""
    asset: str
    safety_type: str  # "monitor", "setpoint", "command"
    writable: bool = False
    min: Optional[float] = None
    max: Optional[float] = None
    requires_interlock: Optional[bool] = False
    required_role: Optional[str] = None

class IOModel(BaseModel):
    id: str
    name: str
    type: str  # "Digital Input", "Digital Output", "Analog Input", "Analog Output"
    channel: str
    module: str
    bound_tag: str

class AlarmModel(BaseModel):
    id: str
    name: str
    priority: str  # "Critical", "High", "Warning", "Info"
    severity: str  # "High", "Medium", "Low"
    condition: Optional[str] = ""
    trigger_val: Optional[Union[float, bool]] = None
    source: str  # tag id
    asset: str
    message: str

class AssetModel(BaseModel):
    id: str
    name: str
    type: str
    children: List["AssetModel"] = []

AssetModel.model_rebuild()

class CommsModel(BaseModel):
    id: str
    name: str
    protocol: str
    address: str
    port: Optional[int] = None
    status: str
    linked_assets: List[str] = []

class DocModel(BaseModel):
    id: str
    asset: str
    title: str
    content: str

class HmiWidgetModel(BaseModel):
    id: Optional[str] = None
    type: str  # "status", "analog", "gauge", "trend", "alarm_banner", "alarm_list", "equipment_graphic", "command_button", "setpoint", "navigation", "diagnostic", "kpi"
    tag: Optional[str] = None
    alarm: Optional[str] = None
    asset: Optional[str] = None
    stateTag: Optional[str] = None
    title: Optional[str] = None
    unit: Optional[str] = None
    window: Optional[str] = None
    label: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None

class HmiDslModel(BaseModel):
    screen: str
    title: str
    layout: str = "responsive"
    widgets: List[HmiWidgetModel] = []
    navigation: List[str] = []

class ValidationCheckModel(BaseModel):
    rule: str
    status: str  # "PASS", "FAIL", "WARN"
    details: str

class ValidationResultModel(BaseModel):
    status: str  # "approved" | "rejected"
    reason: Optional[str] = None
    errors: List[str] = []
    warnings: List[str] = []
    checks: List[ValidationCheckModel] = []
    validated_dsl: Optional[HmiDslModel] = None

class ResolutionResultModel(BaseModel):
    resolved_assets: List[str] = []
    resolved_tags: List[str] = []
    resolved_alarms: List[str] = []
    resolved_io: List[str] = []

class PromptRequestModel(BaseModel):
    prompt: str

class MachineChangeModel(BaseModel):
    action: str  # e.g., "add_motor_2"

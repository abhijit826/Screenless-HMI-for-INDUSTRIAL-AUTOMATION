export interface Tag {
  id: string;
  name: string;
  type: string;
  unit?: string;
  description?: string;
  asset: string;
  safety_type: 'monitor' | 'setpoint' | 'command';
  writable: boolean;
  min?: number;
  max?: number;
  requires_interlock?: boolean;
  required_role?: string;
}

export interface Alarm {
  id: string;
  name: string;
  priority: 'Critical' | 'High' | 'Warning' | 'Info';
  severity: 'High' | 'Medium' | 'Low';
  condition?: string;
  trigger_val?: number | boolean;
  source: string;
  asset: string;
  message: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  children?: Asset[];
}

export interface IOItem {
  id: string;
  name: string;
  type: string;
  channel: string;
  module: string;
  bound_tag: string;
}

export interface CommsConfig {
  id: string;
  name: string;
  protocol: str;
  address: str;
  port?: number;
  status: string;
  linked_assets: string[];
}

export interface HmiWidget {
  id?: string;
  type: 'status' | 'analog' | 'gauge' | 'trend' | 'alarm_banner' | 'alarm_list' | 'equipment_graphic' | 'command_button' | 'setpoint' | 'navigation' | 'diagnostic' | 'kpi';
  tag?: string;
  alarm?: string;
  asset?: string;
  stateTag?: string;
  title?: string;
  unit?: string;
  window?: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface HmiDsl {
  screen: string;
  title: string;
  layout: 'responsive' | 'grid' | 'single_column';
  widgets: HmiWidget[];
  navigation?: string[];
}

export interface ValidationCheck {
  rule: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

export interface ValidationResult {
  status: 'approved' | 'rejected';
  reason?: string;
  errors: string[];
  warnings: string[];
  checks: ValidationCheck[];
  validated_dsl?: HmiDsl;
}

export interface ResolutionResult {
  resolved_assets: string[];
  resolved_tags: string[];
  resolved_alarms: string[];
  resolved_io: string[];
  assets?: string[];
  tags?: string[];
  alarms?: string[];
  io?: string[];
  assets_meta?: Asset[];
  tags_meta?: Tag[];
  alarms_meta?: Alarm[];
  io_meta?: IOItem[];
  comms_meta?: CommsConfig[];
  source_counts?: {
    tags: number;
    io: number;
    alarms: number;
    assets: number;
    comms: number;
    docs: number;
  };
}

export interface PromptResponse {
  prompt: string;
  resolved_context: ResolutionResult;
  proposed_dsl: HmiDsl;
  validation: ValidationResult;
  status: 'approved' | 'rejected';
  ai_provider: string;
}

export interface ActiveAlarmItem {
  id: string;
  name: string;
  priority: string;
  severity: string;
  val: any;
  unit?: string;
  source: string;
  asset: string;
  timestamp: string;
  message: string;
}

export interface LiveStateSnapshot {
  timestamp: number;
  time_formatted: string;
  values: Record<string, any>;
  active_alarms: ActiveAlarmItem[];
  alarm_count: number;
}

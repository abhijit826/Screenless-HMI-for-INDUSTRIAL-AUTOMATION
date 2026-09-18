import React from 'react';
import { StatusCard } from '../components/StatusCard';
import { AnalogGauge } from '../components/AnalogGauge';
import { TrendChart } from '../components/TrendChart';
import { AlarmBanner } from '../components/AlarmBanner';
import { AlarmPanel } from '../components/AlarmPanel';
import { EquipmentGraphic } from '../components/EquipmentGraphic';
import { ControlButton } from '../components/ControlButton';
import { SetpointControl } from '../components/SetpointControl';

export const WIDGET_REGISTRY: Record<string, React.FC<any>> = {
  status: StatusCard,
  analog: AnalogGauge,
  gauge: AnalogGauge,
  trend: TrendChart,
  alarm_banner: AlarmBanner,
  alarm_list: AlarmPanel,
  equipment_graphic: EquipmentGraphic,
  command_button: ControlButton,
  setpoint: SetpointControl,
  kpi: StatusCard,
  diagnostic: StatusCard
};

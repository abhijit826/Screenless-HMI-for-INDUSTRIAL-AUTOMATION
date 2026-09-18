export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: 'OPERATOR_COMMAND' | 'AI_AGENT_ACTION' | 'ALARM_TRIGGERED' | 'ALARM_ACKNOWLEDGED' | 'SAFETY_GATE';
  tagOrAction: string;
  value?: string | number | boolean;
  operatorId: string;
  status: 'SUCCESS' | 'REJECTED' | 'WARNING';
  details: string;
}

const auditLogs: AuditLogEntry[] = [
  {
    id: 'LOG-1001',
    timestamp: new Date(Date.now() - 3600000).toLocaleString(),
    eventType: 'OPERATOR_COMMAND',
    tagOrAction: 'System_Init',
    operatorId: 'AKM (Lead SRE)',
    status: 'SUCCESS',
    details: 'Packaging Line 1 System Initialized & WebSocket Telemetry Synchronized'
  },
  {
    id: 'LOG-1002',
    timestamp: new Date(Date.now() - 1800000).toLocaleString(),
    eventType: 'SAFETY_GATE',
    tagOrAction: 'Door_Switch_Guard',
    operatorId: 'Safety Engine v2.4',
    status: 'SUCCESS',
    details: 'Safety Enclosure Interlock Verified: PASSED'
  }
];

export const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const newLog: AuditLogEntry = {
    id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toLocaleString(),
    ...entry
  };
  auditLogs.unshift(newLog);
  return newLog;
};

export const getAuditLogs = (): AuditLogEntry[] => {
  return auditLogs;
};

export const exportAuditLogsCSV = () => {
  const headers = ['Log ID', 'Timestamp', 'Event Type', 'Tag / Action', 'Value', 'Operator', 'Status', 'Details'];
  const rows = auditLogs.map(log => [
    `"${log.id}"`,
    `"${log.timestamp}"`,
    `"${log.eventType}"`,
    `"${log.tagOrAction}"`,
    `"${log.value !== undefined ? log.value : ''}"`,
    `"${log.operatorId}"`,
    `"${log.status}"`,
    `"${log.details.replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Schneider_SCADA_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

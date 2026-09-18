import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  X,
  Network,
  Database,
  Tag as TagIcon,
  Bell,
  Cpu,
  Radio,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Code
} from 'lucide-react';
import { fetchContext } from '../api';

interface ContextViewerProps {
  isOpen: boolean;
  onClose: () => void;
  liveState?: Record<string, any>;
}

// ----------------------------------------------------
// Custom Node Renderers for ReactFlow
// ----------------------------------------------------

const EnterpriseNode = ({ data, selected }: any) => (
  <div style={{
    backgroundColor: '#0f172a',
    border: `2px solid ${selected ? '#a855f7' : '#64748b'}`,
    boxShadow: selected ? '0 0 16px rgba(168, 85, 247, 0.4)' : '0 4px 6px rgba(0,0,0,0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
    minWidth: '180px'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#a855f7' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Database size={16} style={{ color: '#a855f7' }} />
      <div>
        <div style={{ fontSize: '9px', color: '#a855f7', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>ENTERPRISE / LEVEL 4</div>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{data.label}</div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#a855f7' }} />
  </div>
);

const AssetNode = ({ data, selected }: any) => (
  <div style={{
    backgroundColor: '#0c162d',
    border: `2px solid ${selected ? '#60a5fa' : '#1e3a8a'}`,
    boxShadow: selected ? '0 0 16px rgba(96, 165, 250, 0.5)' : '0 4px 6px rgba(0,0,0,0.3)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#ffffff',
    fontFamily: 'var(--font-heading)',
    minWidth: '170px'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#3b82f6' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Layers size={16} style={{ color: '#60a5fa' }} />
      <div>
        <div style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{data.assetType || 'ASSET NODE'}</div>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{data.label}</div>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6' }} />
  </div>
);

const TagNode = ({ data, selected }: any) => {
  const safetyType = data.safety_type || 'monitor';
  const borderColor = safetyType === 'command' ? '#ef4444' : safetyType === 'setpoint' ? '#f59e0b' : '#00e676';
  const badgeBg = safetyType === 'command' ? '#7f1d1d' : safetyType === 'setpoint' ? '#78350f' : '#064e3b';
  const badgeColor = safetyType === 'command' ? '#fecaca' : safetyType === 'setpoint' ? '#fef3c7' : '#a7f3d0';

  return (
    <div style={{
      backgroundColor: '#06090e',
      border: `2px solid ${selected ? '#ffffff' : borderColor}`,
      boxShadow: selected ? `0 0 16px ${borderColor}` : '0 2px 4px rgba(0,0,0,0.3)',
      borderRadius: '6px',
      padding: '8px 12px',
      color: '#ffffff',
      fontFamily: 'var(--font-mono)',
      minWidth: '160px'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: borderColor }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TagIcon size={12} style={{ color: borderColor }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>{data.label}</span>
        </div>
        <span style={{ fontSize: '8px', padding: '1px 5px', borderRadius: '3px', backgroundColor: badgeBg, color: badgeColor, fontWeight: 'bold' }}>
          {safetyType.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
        <span>Type: {data.dataType || 'float'}</span>
        {data.liveVal !== undefined && (
          <span style={{ color: '#00e676', fontWeight: 'bold' }}>{String(data.liveVal)} {data.unit || ''}</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor }} />
    </div>
  );
};

const AlarmNode = ({ data, selected }: any) => (
  <div style={{
    backgroundColor: '#1a0c0c',
    border: `2px solid ${selected ? '#ffffff' : '#ef4444'}`,
    boxShadow: selected ? '0 0 16px rgba(239, 68, 68, 0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#ffffff',
    fontFamily: 'var(--font-mono)',
    minWidth: '160px'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#ef4444' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
      <Bell size={13} style={{ color: '#ef4444' }} />
      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fca5a5' }}>{data.label}</span>
    </div>
    <div style={{ fontSize: '9px', color: '#94a3b8' }}>
      Priority: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{data.priority || 'High'}</span>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#ef4444' }} />
  </div>
);

const IoNode = ({ data, selected }: any) => (
  <div style={{
    backgroundColor: '#1c1507',
    border: `2px solid ${selected ? '#ffffff' : '#f59e0b'}`,
    boxShadow: selected ? '0 0 16px rgba(245, 158, 11, 0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#ffffff',
    fontFamily: 'var(--font-mono)',
    minWidth: '150px'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#f59e0b' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
      <Activity size={13} style={{ color: '#f59e0b' }} />
      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fef3c7' }}>{data.label}</span>
    </div>
    <div style={{ fontSize: '9px', color: '#d97706' }}>
      {data.ioType || 'Digital Input'} ({data.channel || 'Ch 0'})
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#f59e0b' }} />
  </div>
);

const CommsNode = ({ data, selected }: any) => (
  <div style={{
    backgroundColor: '#150d2a',
    border: `2px solid ${selected ? '#ffffff' : '#a855f7'}`,
    boxShadow: selected ? '0 0 16px rgba(168, 85, 247, 0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#ffffff',
    fontFamily: 'var(--font-mono)',
    minWidth: '160px'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#a855f7' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
      <Radio size={13} style={{ color: '#a855f7' }} />
      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#e9d5ff' }}>{data.label}</span>
    </div>
    <div style={{ fontSize: '9px', color: '#c084fc' }}>
      Protocol: {data.protocol || 'Modbus TCP'} • {data.status || 'Online'}
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#a855f7' }} />
  </div>
);

const nodeTypes = {
  enterprise: EnterpriseNode,
  asset: AssetNode,
  tag: TagNode,
  alarm: AlarmNode,
  io: IoNode,
  comms: CommsNode
};

export const ContextViewer: React.FC<ContextViewerProps> = ({ isOpen, onClose, liveState = {} }) => {
  const [rawContext, setRawContext] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('Conveyor_A');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showJsonRaw, setShowJsonRaw] = useState<boolean>(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (isOpen) {
      fetchContext()
        .then((res) => {
          setRawContext(res);
          buildGraphData(res);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const buildGraphData = (data: any) => {
    if (!data) return;

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // 1. Enterprise Level
    initialNodes.push({
      id: 'Plant',
      type: 'enterprise',
      position: { x: 500, y: 30 },
      data: { label: 'Plant Facility', assetType: 'Enterprise' }
    });

    initialNodes.push({
      id: 'Packaging_Line_1',
      type: 'enterprise',
      position: { x: 500, y: 140 },
      data: { label: 'Packaging Line 1', assetType: 'Production Line' }
    });

    initialEdges.push({
      id: 'e-plant-line',
      source: 'Plant',
      target: 'Packaging_Line_1',
      animated: true,
      style: { stroke: '#a855f7', strokeWidth: 2 }
    });

    // 2. Asset Level
    const assets = data.assets || {};
    const assetKeys = Object.keys(assets);
    
    // Position Sub-System Assets
    const subAssets = ['Conveyor_A', 'Feed_Pump_101', 'Packaging_Unit', 'Sensors'];
    subAssets.forEach((assetId, idx) => {
      if (assets[assetId]) {
        const xPos = 120 + idx * 260;
        initialNodes.push({
          id: assetId,
          type: 'asset',
          position: { x: xPos, y: 260 },
          data: { label: assets[assetId].name, assetType: assets[assetId].type, raw: assets[assetId] }
        });

        initialEdges.push({
          id: `e-line-${assetId}`,
          source: 'Packaging_Line_1',
          target: assetId,
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        });
      }
    });

    // Equipment Modules (Motors)
    if (assets['Motor_1']) {
      initialNodes.push({
        id: 'Motor_1',
        type: 'asset',
        position: { x: 100, y: 400 },
        data: { label: assets['Motor_1'].name, assetType: 'Control Module', raw: assets['Motor_1'] }
      });
      initialEdges.push({
        id: 'e-conveyor-m1',
        source: 'Conveyor_A',
        target: 'Motor_1',
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      });
    }

    if (assets['Motor_2']) {
      initialNodes.push({
        id: 'Motor_2',
        type: 'asset',
        position: { x: 280, y: 400 },
        data: { label: assets['Motor_2'].name, assetType: 'Secondary Drive', raw: assets['Motor_2'] }
      });
      initialEdges.push({
        id: 'e-conveyor-m2',
        source: 'Conveyor_A',
        target: 'Motor_2',
        animated: true,
        style: { stroke: '#f59e0b', strokeWidth: 2 }
      });
    }

    // 3. Tag Level
    const tags = data.tags || {};
    let tagIdx = 0;
    Object.keys(tags).forEach((tagId) => {
      const tag = tags[tagId];
      const parentAsset = tag.asset || 'Conveyor_A';
      const xPos = 40 + (tagIdx % 6) * 190;
      const yPos = 540 + Math.floor(tagIdx / 6) * 110;
      tagIdx++;

      initialNodes.push({
        id: tagId,
        type: 'tag',
        position: { x: xPos, y: yPos },
        data: {
          label: tagId,
          name: tag.name,
          safety_type: tag.safety_type,
          dataType: tag.type,
          unit: tag.unit,
          writable: tag.writable,
          liveVal: liveState[tagId],
          raw: tag
        }
      });

      if (initialNodes.some(n => n.id === parentAsset)) {
        const edgeColor = tag.safety_type === 'command' ? '#ef4444' : tag.safety_type === 'setpoint' ? '#f59e0b' : '#00e676';
        initialEdges.push({
          id: `e-${parentAsset}-${tagId}`,
          source: parentAsset,
          target: tagId,
          style: { stroke: edgeColor, strokeWidth: 1.5 }
        });
      }
    });

    // 4. Alarm Level
    const alarms = data.alarms || {};
    let alarmIdx = 0;
    Object.keys(alarms).forEach((alarmId) => {
      const alarm = alarms[alarmId];
      const sourceTag = alarm.source;
      const xPos = 80 + alarmIdx * 230;
      alarmIdx++;

      initialNodes.push({
        id: alarmId,
        type: 'alarm',
        position: { x: xPos, y: 780 },
        data: {
          label: alarm.name || alarmId,
          priority: alarm.priority,
          severity: alarm.severity,
          source: alarm.source,
          message: alarm.message,
          raw: alarm
        }
      });

      if (sourceTag && initialNodes.some(n => n.id === sourceTag)) {
        initialEdges.push({
          id: `e-${sourceTag}-${alarmId}`,
          source: sourceTag,
          target: alarmId,
          animated: true,
          style: { stroke: '#ef4444', strokeWidth: 2 }
        });
      }
    });

    // 5. IO & Comms
    const io = data.io || {};
    let ioIdx = 0;
    Object.keys(io).forEach((ioId) => {
      const ioItem = io[ioId];
      initialNodes.push({
        id: ioId,
        type: 'io',
        position: { x: 720 + ioIdx * 170, y: 780 },
        data: {
          label: ioItem.name,
          ioType: ioItem.type,
          channel: ioItem.channel,
          module: ioItem.module,
          bound_tag: ioItem.bound_tag,
          raw: ioItem
        }
      });

      if (ioItem.bound_tag && initialNodes.some(n => n.id === ioItem.bound_tag)) {
        initialEdges.push({
          id: `e-${ioItem.bound_tag}-${ioId}`,
          source: ioItem.bound_tag,
          target: ioId,
          style: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '4 4' }
        });
      }
      ioIdx++;
    });

    // Comms Controller
    const comms = data.comms || {};
    Object.keys(comms).forEach((cId) => {
      const comm = comms[cId];
      initialNodes.push({
        id: cId,
        type: 'comms',
        position: { x: 500, y: 920 },
        data: {
          label: comm.name,
          protocol: comm.protocol,
          address: comm.address,
          status: comm.status,
          raw: comm
        }
      });

      initialEdges.push({
        id: `e-line-${cId}`,
        source: 'Packaging_Line_1',
        target: cId,
        style: { stroke: '#a855f7', strokeWidth: 2, strokeDasharray: '5 5' }
      });
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Filter nodes based on category & search query
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesCategory =
        filterCategory === 'all' ||
        (filterCategory === 'assets' && (node.type === 'asset' || node.type === 'enterprise')) ||
        (filterCategory === 'tags' && node.type === 'tag') ||
        (filterCategory === 'alarms' && node.type === 'alarm') ||
        (filterCategory === 'io' && node.type === 'io') ||
        (filterCategory === 'comms' && node.type === 'comms');

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        node.id.toLowerCase().includes(q) ||
        (node.data.label && String(node.data.label).toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [nodes, filterCategory, searchQuery]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  if (!isOpen) return null;

  const totalAssets = rawContext?.assets ? Object.keys(rawContext.assets).length : 0;
  const totalTags = rawContext?.tags ? Object.keys(rawContext.tags).length : 0;
  const totalAlarms = rawContext?.alarms ? Object.keys(rawContext.alarms).length : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '12px', width: '100%', maxWidth: '1440px', height: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', backgroundColor: '#121721', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Network size={20} style={{ color: '#3b82f6' }} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                MACHINE CONTEXT GRAPH INSPECTOR
              </h2>
              <span style={{ backgroundColor: '#1e3a8a', border: '1px solid #2563eb', color: '#60a5fa', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                ISA-95 UNIFIED MACHINE ONTOLOGY
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'var(--font-mono)', margin: '4px 0 0 0' }}>
              "Interactive graph visualization of physical assets, PLC telemetry tags, alarm conditions & I/O channels"
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Quick Summary Counts */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#cbd5e1', backgroundColor: '#06090e', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '6px' }}>
              <span>Assets: <strong style={{ color: '#60a5fa' }}>{totalAssets}</strong></span>
              <span>Tags: <strong style={{ color: '#00e676' }}>{totalTags}</strong></span>
              <span>Alarms: <strong style={{ color: '#ef4444' }}>{totalAlarms}</strong></span>
              <span>Graph Edges: <strong style={{ color: '#a78bfa' }}>{edges.length}</strong></span>
            </div>

            <button
              onClick={onClose}
              style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div style={{ padding: '10px 24px', borderBottom: '1px solid #1e293b', backgroundColor: '#06090e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[
              { id: 'all', label: `ALL NODES (${nodes.length})` },
              { id: 'assets', label: `ASSETS (${totalAssets})` },
              { id: 'tags', label: `TAGS (${totalTags})` },
              { id: 'alarms', label: `ALARMS (${totalAlarms})` },
              { id: 'io', label: 'I/O CHANNELS' },
              { id: 'comms', label: 'COMMS' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: filterCategory === cat.id ? 700 : 500,
                  backgroundColor: filterCategory === cat.id ? '#1d4ed8' : '#1e293b',
                  color: filterCategory === cat.id ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search graph node by ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                backgroundColor: '#121721',
                border: '1px solid #1e293b',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        </div>

        {/* Main Body: Graph Canvas (70%) + Node Inspector Panel (30%) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Canvas Area */}
          <div style={{ flex: 1, height: '100%', position: 'relative', backgroundColor: '#06090e' }}>
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#1e293b" gap={20} size={1} />
              <Controls style={{ backgroundColor: '#121721', border: '1px solid #1e293b', color: '#ffffff' }} />
              <MiniMap
                style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b' }}
                nodeColor={(n) => {
                  if (n.type === 'asset') return '#3b82f6';
                  if (n.type === 'tag') return '#00e676';
                  if (n.type === 'alarm') return '#ef4444';
                  return '#a855f7';
                }}
              />
            </ReactFlow>
          </div>

          {/* Right Inspector Panel */}
          <div style={{ width: '380px', borderLeft: '1px solid #1e293b', backgroundColor: '#121721', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Node Inspector Header */}
                <div style={{ padding: '16px', borderBottom: '1px solid #1e293b', backgroundColor: '#06090e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      SELECTED GRAPH NODE
                    </span>
                    <span style={{ fontSize: '9px', backgroundColor: '#1e3a8a', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                      {selectedNode.type?.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)', margin: '6px 0 2px 0' }}>
                    {selectedNode.data.label || selectedNode.id}
                  </h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    Node ID: <span style={{ color: '#00e676' }}>{selectedNode.id}</span>
                  </div>
                </div>

                {/* Node Inspector Details Body */}
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Property Key-Values */}
                  <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
                      NODE PROPERTIES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {selectedNode.data.safety_type && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Safety Type:</span>
                          <span style={{ color: selectedNode.data.safety_type === 'command' ? '#ef4444' : '#00e676', fontWeight: 'bold' }}>
                            {selectedNode.data.safety_type.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {selectedNode.data.writable !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Writable:</span>
                          <span style={{ color: selectedNode.data.writable ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                            {selectedNode.data.writable ? 'YES (Command)' : 'NO (Read-Only)'}
                          </span>
                        </div>
                      )}
                      {selectedNode.data.dataType && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Data Type:</span>
                          <span style={{ color: '#60a5fa' }}>{selectedNode.data.dataType}</span>
                        </div>
                      )}
                      {selectedNode.data.unit && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Engineering Unit:</span>
                          <span style={{ color: '#f59e0b' }}>{selectedNode.data.unit}</span>
                        </div>
                      )}
                      {selectedNode.data.liveVal !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>
                          <span style={{ color: '#94a3b8' }}>Live Value:</span>
                          <span style={{ color: '#00e676', fontWeight: 'bold' }}>{String(selectedNode.data.liveVal)}</span>
                        </div>
                      )}
                      {selectedNode.data.priority && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>Priority:</span>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{selectedNode.data.priority}</span>
                        </div>
                      )}
                      {selectedNode.data.message && (
                        <div>
                          <span style={{ color: '#94a3b8' }}>Alarm Message:</span>
                          <div style={{ color: '#fca5a5', marginTop: '2px', backgroundColor: '#7f1d1d22', padding: '6px', borderRadius: '4px' }}>
                            {selectedNode.data.message}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connected Edges & Relationships */}
                  <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
                      CONNECTED RELATIONS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {edges
                        .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                        .map((edge) => (
                          <div key={edge.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#cbd5e1', backgroundColor: '#121721', padding: '4px 8px', borderRadius: '4px' }}>
                            <span>{edge.source === selectedNode.id ? `→ ${edge.target}` : `← ${edge.source}`}</span>
                            <span style={{ fontSize: '9px', color: '#64748b' }}>Link</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Raw JSON Snippet Toggle */}
                  <div style={{ backgroundColor: '#06090e', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                    <button
                      onClick={() => setShowJsonRaw(!showJsonRaw)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent', border: 'none', color: '#60a5fa', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Code size={13} /> RAW PAYLOAD JSON
                      </span>
                      <ChevronRight size={14} style={{ transform: showJsonRaw ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {showJsonRaw && (
                      <pre style={{ marginTop: '8px', backgroundColor: '#020617', border: '1px solid #1e293b', padding: '8px', borderRadius: '4px', color: '#34d399', fontSize: '10px', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                        {JSON.stringify(selectedNode.data.raw || selectedNode.data, null, 2)}
                      </pre>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                Click any graph node on the canvas to inspect its parameters, relationships & live telemetry.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

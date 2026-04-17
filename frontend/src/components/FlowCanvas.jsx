import { useCallback, useState } from 'react';
import ReactFlow, { Controls, MiniMap, Background, BackgroundVariant, MarkerType } from 'reactflow';
import CustomNode from './nodes/CustomNode';

const nodeTypes = { customNode: CustomNode };

const NODE_COLORS = {
  webhook: '#10b981', http: '#3b82f6', code: '#8b5cf6',
  if: '#f59e0b', switch: '#f97316', wait: '#64748b',
  claude: '#a855f7', transform: '#06b6d4', merge: '#14b8a6',
  loop: '#6366f1', 'set-variable': '#ec4899', log: '#84cc16',
};

const EDGE_DEFAULTS = {
  animated: true,
  style: { stroke: '#334155', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 16, height: 16 },
  labelStyle: { fill: '#a78bfa', fontWeight: 600, fontSize: 10 },
  labelBgStyle: { fill: '#1e293b', fillOpacity: 0.95 },
  labelBgPadding: [4, 2],
};

function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
      <div className="text-center">
        <div className="text-5xl mb-4" style={{ opacity: 0.08 }}>⚡</div>
        <p className="text-sm font-semibold" style={{ color: '#334155' }}>Canvas vazio</p>
        <p className="text-xs mt-1" style={{ color: '#1e293b' }}>
          Arraste um nó da barra lateral para começar
        </p>
      </div>
    </div>
  );
}

export default function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick, onAddNode }) {
  const [rfInstance, setRfInstance] = useState(null);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('application/reactflow');
    if (!nodeType || !rfInstance) return;
    const position = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    onAddNode(nodeType, position);
  }, [rfInstance, onAddNode]);

  return (
    <div className="flex-1 h-full relative">
      {nodes.length === 0 && <EmptyState />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        deleteKeyCode="Delete"
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={EDGE_DEFAULTS}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.data?.nodeType] || '#6366f1'}
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
      </ReactFlow>
    </div>
  );
}

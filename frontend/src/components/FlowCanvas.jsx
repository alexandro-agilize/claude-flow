import { useCallback, useState } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
} from 'reactflow';
import CustomNode from './nodes/CustomNode';

const nodeTypes = { customNode: CustomNode };

const NODE_COLORS = {
  webhook: '#10b981',
  http:    '#3b82f6',
  code:    '#8b5cf6',
  if:      '#f59e0b',
  switch:  '#eab308',
  wait:    '#94a3b8',
};

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onAddNode,
}) {
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
    <div className="flex-1 h-full">
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
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          labelStyle: { fill: '#6366f1', fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: '#ede9fe', fillOpacity: 0.9 },
          labelBgPadding: [4, 2],
        }}
      >
        <Controls className="!rounded-lg !shadow-sm !border !border-gray-200 !bg-white" />
        <MiniMap
          nodeColor={(n) => NODE_COLORS[n.data?.nodeType] || '#6366f1'}
          className="!rounded-lg !shadow-sm !border !border-gray-200 !bg-white"
          maskColor="rgba(0,0,0,0.05)"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
      </ReactFlow>
    </div>
  );
}

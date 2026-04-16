import { useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import Toolbar from './components/Toolbar';
import NodeSidebar from './components/NodeSidebar';
import FlowCanvas from './components/FlowCanvas';
import ConfigPanel from './components/ConfigPanel';
import RunModal from './components/RunModal';
import { listFlows, getFlow, createFlow, updateFlow, runFlow } from './api';
import { toReactFlow, fromReactFlow, slugify } from './utils/flowConverter';

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [flows, setFlows] = useState([]);
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [flowName, setFlowName] = useState('Novo Flow');
  const [selectedNode, setSelectedNode] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    listFlows().then((r) => setFlows(r.data)).catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            labelStyle: { fill: '#6366f1', fontWeight: 600, fontSize: 11 },
            labelBgStyle: { fill: '#ede9fe', fillOpacity: 0.9 },
            labelBgPadding: [4, 2],
          },
          eds
        )
      ),
    [setEdges]
  );

  const handleSelectFlow = async (flowId) => {
    try {
      const { data: flow } = await getFlow(flowId);
      const { nodes: rfNodes, edges: rfEdges } = toReactFlow(flow);
      setNodes(rfNodes);
      setEdges(rfEdges);
      setCurrentFlowId(flowId);
      setFlowName(flow.name || flowId);
      setSelectedNode(null);
    } catch {
      showToast('Erro ao carregar flow', 'error');
    }
  };

  const handleNewFlow = () => {
    setNodes([]);
    setEdges([]);
    setCurrentFlowId(null);
    setFlowName('Novo Flow');
    setSelectedNode(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const id = currentFlowId || slugify(flowName) || `flow-${Date.now()}`;
      const flow = fromReactFlow(id, flowName, nodes, edges);

      if (currentFlowId) {
        await updateFlow(currentFlowId, flow);
      } else {
        await createFlow(flow);
        setCurrentFlowId(id);
      }

      const { data } = await listFlows();
      setFlows(data);
      showToast('Flow salvo!');
    } catch {
      showToast('Erro ao salvar flow', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = () => {
    setRunResult(null);
    setRunModalOpen(true);
  };

  const executeRun = async (input) => {
    if (!currentFlowId) return;
    setIsRunning(true);
    try {
      const { data } = await runFlow(currentFlowId, input);
      setRunResult({ success: true, result: data.result });
    } catch (err) {
      setRunResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const handlePaneClick = useCallback(() => setSelectedNode(null), []);

  const handleNodeDataChange = useCallback(
    (nodeId, newData) =>
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))),
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleAddNode = useCallback(
    (nodeType, position) => {
      const id = `${nodeType}-${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: 'customNode',
          position,
          data: { label: `Novo ${nodeType}`, nodeType, config: {} },
        },
      ]);
    },
    [setNodes]
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar
        flows={flows}
        currentFlowId={currentFlowId}
        flowName={flowName}
        onFlowNameChange={setFlowName}
        onSelectFlow={handleSelectFlow}
        onNewFlow={handleNewFlow}
        onSave={handleSave}
        onRun={handleRun}
        isSaving={isSaving}
        isRunning={isRunning}
      />

      <div className="flex flex-1 overflow-hidden">
        <NodeSidebar />
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onAddNode={handleAddNode}
        />
        <ConfigPanel
          node={selectedNode}
          onDataChange={handleNodeDataChange}
          onDelete={handleDeleteNode}
        />
      </div>

      <RunModal
        isOpen={runModalOpen}
        onClose={() => { setRunModalOpen(false); setRunResult(null); }}
        onRun={executeRun}
        isRunning={isRunning}
        result={runResult}
      />

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white z-50 transition-all ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

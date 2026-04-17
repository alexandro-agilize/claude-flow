import { useState, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge, MarkerType } from 'reactflow';
import Toolbar from '../components/Toolbar';
import NodeSidebar from '../components/NodeSidebar';
import FlowCanvas from '../components/FlowCanvas';
import ConfigPanel from '../components/ConfigPanel';
import RunModal from '../components/RunModal';
import ExecutionPanel from '../components/ExecutionPanel';
import { FlowContext } from '../context/FlowContext';
import { listFlows, getFlow, createFlow, updateFlow, runFlow, getExecution } from '../api';
import { toReactFlow, fromReactFlow, slugify } from '../utils/flowConverter';

const EDGE_STYLE = {
  animated: true,
  style: { stroke: '#334155', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#475569', width: 16, height: 16 },
  labelStyle: { fill: '#a78bfa', fontWeight: 600, fontSize: 10 },
  labelBgStyle: { fill: '#1e293b', fillOpacity: 0.95 },
  labelBgPadding: [4, 2],
};

export default function EditorPage({ initialFlowId }) {
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
  const [nodeExecutions, setNodeExecutions] = useState({});
  const [executionLogs, setExecutionLogs] = useState([]);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);

  useEffect(() => {
    listFlows().then((r) => setFlows(r.data)).catch(() => showToast('Erro ao conectar com o servidor', 'error'));
  }, []);

  useEffect(() => {
    if (initialFlowId) {
      handleSelectFlow(initialFlowId);
    }
  }, [initialFlowId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...EDGE_STYLE }, eds)),
    [setEdges]
  );

  const handleSelectFlow = async (flowId) => {
    try {
      const { data: flow } = await getFlow(flowId);
      const { nodes: rfNodes, edges: rfEdges } = toReactFlow(flow);
      setNodes(rfNodes); setEdges(rfEdges);
      setCurrentFlowId(flowId); setFlowName(flow.name || flowId);
      setSelectedNode(null); setNodeExecutions({}); setExecutionLogs([]); setShowExecutionPanel(false);
    } catch { showToast('Erro ao carregar flow', 'error'); }
  };

  const handleNewFlow = () => {
    setNodes([]); setEdges([]); setCurrentFlowId(null); setFlowName('Novo Flow');
    setSelectedNode(null); setNodeExecutions({}); setExecutionLogs([]); setShowExecutionPanel(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const id = currentFlowId || slugify(flowName) || `flow-${Date.now()}`;
      const flow = fromReactFlow(id, flowName, nodes, edges);
      if (currentFlowId) { await updateFlow(currentFlowId, flow); }
      else { await createFlow(flow); setCurrentFlowId(id); }
      const { data } = await listFlows();
      setFlows(data); showToast('Flow salvo!');
    } catch { showToast('Erro ao salvar flow', 'error'); }
    finally { setIsSaving(false); }
  };

  const handleRun = () => { setRunResult(null); setRunModalOpen(true); };

  const executeRun = async (input) => {
    if (!currentFlowId) return;
    setIsRunning(true); setNodeExecutions({}); setExecutionLogs([]); setShowExecutionPanel(false);
    try {
      const { data } = await runFlow(currentFlowId, input);
      setRunResult({ success: true, result: data.result });
      if (data.executionId) {
        try {
          const { data: exec } = await getExecution(data.executionId);
          const logs = exec.logs || [];
          setExecutionLogs(logs); setShowExecutionPanel(true);
          const execMap = {};
          logs.forEach((log) => {
            execMap[log.nodeId] = {
              status: log.status === 'success' ? 'success' : 'error',
              output: log.output ? JSON.parse(log.output) : null,
              error: log.error, durationMs: log.durationMs,
            };
          });
          setNodeExecutions(execMap);
        } catch { /* logs not critical */ }
      }
    } catch (err) {
      setRunResult({ success: false, error: err.response?.data?.error || err.message });
      showToast('Erro na execução', 'error');
    } finally { setIsRunning(false); }
  };

  const handleNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const handlePaneClick = useCallback(() => setSelectedNode(null), []);

  const handleNodeDataChange = useCallback(
    (nodeId, newData) => setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: newData } : n)),
    [setNodes]
  );

  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode((sel) => sel?.id === nodeId ? null : sel);
  }, [setNodes, setEdges]);

  const handleDuplicateNode = useCallback((nodeId) => {
    setNodes((nds) => {
      const orig = nds.find((n) => n.id === nodeId);
      if (!orig) return nds;
      return [...nds, {
        ...orig, id: `${orig.data.nodeType}-${Date.now()}`, selected: false,
        position: { x: orig.position.x + 40, y: orig.position.y + 40 },
        data: { ...orig.data, label: `${orig.data.label} (cópia)` },
      }];
    });
  }, [setNodes]);

  const handleAddNode = useCallback((nodeType, position) => {
    setNodes((nds) => [...nds, {
      id: `${nodeType}-${Date.now()}`, type: 'customNode', position,
      data: { label: `Novo ${nodeType}`, nodeType, config: {} },
    }]);
  }, [setNodes]);

  return (
    <FlowContext.Provider value={{ onDeleteNode: handleDeleteNode, onDuplicateNode: handleDuplicateNode, nodeExecutions }}>
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0f172a' }}>
        <Toolbar
          flows={flows} currentFlowId={currentFlowId} flowName={flowName}
          onFlowNameChange={setFlowName} onSelectFlow={handleSelectFlow} onNewFlow={handleNewFlow}
          onSave={handleSave} onRun={handleRun} isSaving={isSaving} isRunning={isRunning}
        />
        <div className="flex flex-1 overflow-hidden">
          <NodeSidebar />
          <FlowCanvas
            nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onNodeClick={handleNodeClick} onPaneClick={handlePaneClick} onAddNode={handleAddNode}
          />
          <ConfigPanel node={selectedNode} onDataChange={handleNodeDataChange} onDelete={handleDeleteNode} />
        </div>
        {showExecutionPanel && (
          <ExecutionPanel executions={executionLogs} onClose={() => setShowExecutionPanel(false)} />
        )}
        <RunModal
          isOpen={runModalOpen} onClose={() => { setRunModalOpen(false); setRunResult(null); }}
          onRun={executeRun} isRunning={isRunning} result={runResult}
        />
        {toast && (
          <div className="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-xl text-xs font-semibold text-white z-50"
            style={{ background: toast.type === 'error' ? '#dc2626' : '#059669' }}>
            {toast.msg}
          </div>
        )}
      </div>
    </FlowContext.Provider>
  );
}

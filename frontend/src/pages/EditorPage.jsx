import { useState, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, MarkerType } from 'reactflow';
import Toolbar from '../components/Toolbar';
import NodeSidebar from '../components/NodeSidebar';
import FlowCanvas from '../components/FlowCanvas';
import RunModal from '../components/RunModal';
import NodeEditorModal from '../components/NodeEditorModal';
import { FlowContext } from '../context/FlowContext';
import { listFlows, getFlow, createFlow, updateFlow, getExecution, runStep } from '../api';
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
  const abortRef = useRef(null);

  useEffect(() => {
    listFlows().then(r => setFlows(r.data)).catch(() => showToast('Erro ao conectar com o servidor', 'error'));
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
      setSelectedNode(null); setNodeExecutions({});
    } catch { showToast('Erro ao carregar flow', 'error'); }
  };

  const handleNewFlow = () => {
    setNodes([]); setEdges([]); setCurrentFlowId(null); setFlowName('Novo Flow');
    setSelectedNode(null); setNodeExecutions({});
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

  const executeRun = useCallback(async (input) => {
    if (!currentFlowId) return;
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setNodeExecutions({});
    setRunResult(null);

    try {
      const response = await fetch(`/run/${currentFlowId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input || {}),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setRunResult({ success: false, error: err.error || 'Erro desconhecido' });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'node:start') {
              setNodeExecutions(prev => ({
                ...prev,
                [ev.nodeId]: { status: 'running', input: ev.input, output: null, error: null, durationMs: null },
              }));
            } else if (ev.type === 'node:complete') {
              setNodeExecutions(prev => ({
                ...prev,
                [ev.nodeId]: { status: ev.status, input: ev.input, output: ev.output, error: ev.error, durationMs: ev.durationMs },
              }));
            } else if (ev.type === 'flow:done') {
              setRunResult({ success: true, result: ev.result });
            } else if (ev.type === 'flow:error') {
              setRunResult({ success: false, error: ev.error });
              showToast('Erro na execução', 'error');
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setRunResult({ success: false, error: err.message });
        showToast('Erro na execução', 'error');
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [currentFlowId]);

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

  const handleStepRun = useCallback(async (nodeId, updatedNodeData) => {
    // Apply the updated node data first so the canvas stays in sync
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: updatedNodeData } : n));

    // Build the flow with the latest (possibly unsaved) node config
    const latestNodes = nodes.map((n) => n.id === nodeId ? { ...n, data: updatedNodeData } : n);
    const flow = fromReactFlow(currentFlowId || `step-${Date.now()}`, flowName, latestNodes, edges);

    try {
      const { data } = await runStep(flow, nodeId, {});
      if (data.nodeData) {
        setNodeExecutions((prev) => ({ ...prev, ...data.nodeData }));
      }
      return data;
    } catch (err) {
      showToast('Erro ao executar step', 'error');
      return { success: false, error: err.message };
    }
  }, [nodes, edges, currentFlowId, flowName, setNodes]);

  return (
    <FlowContext.Provider value={{ onDeleteNode: handleDeleteNode, onDuplicateNode: handleDuplicateNode, nodeExecutions, currentFlowId }}>
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
        </div>
        {selectedNode && (
          <NodeEditorModal
            node={selectedNode}
            flowId={currentFlowId}
            execData={nodeExecutions[selectedNode.id]}
            onClose={() => setSelectedNode(null)}
            onDataChange={handleNodeDataChange}
            onDelete={handleDeleteNode}
            onStepRun={handleStepRun}
          />
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

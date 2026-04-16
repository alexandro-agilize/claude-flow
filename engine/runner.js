const nodes = {
  http:           require('./nodes/http'),
  webhook:        require('./nodes/webhook'),
  code:           require('./nodes/code'),
  if:             require('./nodes/if'),
  switch:         require('./nodes/switch'),
  wait:           require('./nodes/wait'),
  claude:         require('./nodes/claude'),
  transform:      require('./nodes/transform'),
  merge:          require('./nodes/merge'),
  loop:           require('./nodes/loop'),
  'set-variable': require('./nodes/set-variable'),
  log:            require('./nodes/log'),
};

async function runFlow(flow, input = {}, startId = null) {
  const nodeMap = {};
  for (const node of flow.nodes) nodeMap[node.id] = node;

  const edgeMap = {};
  const incomingCount = {};
  for (const edge of (flow.edges || [])) {
    if (!edgeMap[edge.from]) edgeMap[edge.from] = [];
    edgeMap[edge.from].push({ to: edge.to, branch: edge.branch });
    incomingCount[edge.to] = (incomingCount[edge.to] || 0) + 1;
  }

  const context = { variables: {}, logs: [], nodeOutputs: {}, incomingCount };

  const currentId = startId || flow.nodes[0]?.id;
  if (!currentId) throw new Error('Flow sem nós definidos');

  return await executeNode(currentId, input, nodeMap, edgeMap, context, 0);
}

async function executeNode(nodeId, input, nodeMap, edgeMap, context, depth) {
  if (depth > 50) throw new Error('Limite de execução atingido (loop infinito?)');

  const node = nodeMap[nodeId];
  if (!node) throw new Error(`Nó "${nodeId}" não encontrado no flow`);

  const handler = nodes[node.type];
  if (!handler) throw new Error(`Tipo de nó desconhecido: "${node.type}"`);

  console.log(`[${depth}] Executando nó: ${node.id} (${node.type})`);

  let output;
  try {
    output = await handler.run(node.config || {}, input, context, node.id);
  } catch (err) {
    console.error(`[ERRO] Nó "${node.id}": ${err.message}`);
    throw err;
  }

  context.nodeOutputs[nodeId] = output;

  // Branch pending — this parallel path is waiting for other branches to arrive at merge
  if (output && output._mergePending) return output;

  const edges = edgeMap[nodeId] || [];
  if (edges.length === 0) {
    console.log(`[FIM] Fluxo concluído no nó: ${nodeId}`);
    return output;
  }

  let nextEdges = edges;
  if (output._branch !== undefined) {
    nextEdges = edges.filter(e => e.branch === output._branch);
    if (nextEdges.length === 0) {
      console.log(`[FIM] Nenhuma edge para branch "${output._branch}"`);
      return output;
    }
  }

  // Execução paralela quando há múltiplas edges sem branch
  if (nextEdges.length > 1) {
    const results = await Promise.all(
      nextEdges.map(edge => executeNode(edge.to, output, nodeMap, edgeMap, context, depth + 1))
    );
    // Filter out pending branches, return the meaningful result
    const resolved = results.filter(r => !r?._mergePending);
    return resolved.length === 1 ? resolved[0] : resolved.length > 1 ? resolved : results[0];
  }

  return await executeNode(nextEdges[0].to, output, nodeMap, edgeMap, context, depth + 1);
}

module.exports = { runFlow };

/**
 * RUNNER — Motor de execução de fluxos
 * Carrega um flow.json e executa nó por nó seguindo as edges.
 */

const path = require('path');
const fs = require('fs');

const nodes = {
  http:    require('./nodes/http'),
  webhook: require('./nodes/webhook'),
  code:    require('./nodes/code'),
  if:      require('./nodes/if'),
  switch:  require('./nodes/switch'),
  wait:    require('./nodes/wait'),
};

/**
 * Executa um fluxo completo.
 * @param {object} flow      - Objeto do flow (nodes + edges)
 * @param {object} input     - Dados iniciais (ex: body do webhook)
 * @param {string} startId   - ID do nó inicial (padrão: primeiro nó do array)
 * @param {object} options   - { onNodeComplete(nodeId, nodeType, { input, output, error, startedAt, durationMs }) }
 * @returns {object}         - Resultado do último nó executado
 */
async function runFlow(flow, input = {}, startId = null, options = {}) {
  const nodeMap = {};
  for (const node of flow.nodes) {
    nodeMap[node.id] = node;
  }

  const edgeMap = {};
  for (const edge of (flow.edges || [])) {
    if (!edgeMap[edge.from]) edgeMap[edge.from] = [];
    edgeMap[edge.from].push({ to: edge.to, branch: edge.branch });
  }

  const currentId = startId || flow.nodes[0]?.id;
  if (!currentId) throw new Error('Flow sem nós definidos');

  return await executeNode(currentId, input, nodeMap, edgeMap, 0, options);
}

async function executeNode(nodeId, input, nodeMap, edgeMap, depth, hooks = {}) {
  if (depth > 50) throw new Error('Limite de execução atingido (loop infinito?)');

  const node = nodeMap[nodeId];
  if (!node) throw new Error(`Nó "${nodeId}" não encontrado no flow`);

  const handler = nodes[node.type];
  if (!handler) throw new Error(`Tipo de nó desconhecido: "${node.type}"`);

  console.log(`[${depth}] Executando nó: ${node.id} (${node.type})`);

  const startedAt = new Date();
  const startTime = Date.now();

  let output;
  try {
    output = await handler.run(node.config || {}, input);
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[ERRO] Nó "${node.id}": ${err.message}`);
    if (hooks.onNodeComplete) {
      await hooks.onNodeComplete(node.id, node.type, { input, output: null, error: err, startedAt, durationMs }).catch(() => {});
    }
    throw err;
  }

  const durationMs = Date.now() - startTime;
  if (hooks.onNodeComplete) {
    await hooks.onNodeComplete(node.id, node.type, { input, output, error: null, startedAt, durationMs }).catch(() => {});
  }

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

  const nextEdge = nextEdges[0];
  return await executeNode(nextEdge.to, output, nodeMap, edgeMap, depth + 1, hooks);
}

module.exports = { runFlow };

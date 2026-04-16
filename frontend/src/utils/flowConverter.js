export function toReactFlow(flow) {
  const positions = flow.positions || {};

  const nodes = flow.nodes.map((node, i) => ({
    id: node.id,
    type: 'customNode',
    position: positions[node.id] || { x: 300, y: 80 + i * 180 },
    data: {
      label: node.name || node.id,
      nodeType: node.type,
      config: node.config || {},
    },
  }));

  const edges = flow.edges.map((edge, i) => ({
    id: `e-${i}-${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    sourceHandle: edge.branch || null,
    label: edge.branch || undefined,
    animated: true,
    style: { stroke: '#6366f1', strokeWidth: 2 },
    labelStyle: { fill: '#6366f1', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#ede9fe', fillOpacity: 0.9 },
    labelBgPadding: [4, 2],
  }));

  return { nodes, edges };
}

export function fromReactFlow(id, name, nodes, edges) {
  const positions = {};
  nodes.forEach((n) => { positions[n.id] = n.position; });

  return {
    id,
    name,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      name: n.data.label,
      config: n.data.config || {},
    })),
    edges: edges.map((e) => {
      const edge = { from: e.source, to: e.target };
      if (e.sourceHandle) edge.branch = e.sourceHandle;
      return edge;
    }),
    positions,
  };
}

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

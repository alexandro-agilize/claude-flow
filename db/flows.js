const prisma = require('./client');
const fs = require('fs');
const path = require('path');

const FLOWS_DIR = path.join(__dirname, '..', 'flows');

async function listFlows() {
  const dbFlows = await prisma.flow.findMany({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
  });

  const dbIds = new Set(dbFlows.map(f => f.id));
  const fileFlows = _readFlowFiles().filter(f => !dbIds.has(f.id));

  return [...dbFlows, ...fileFlows];
}

async function getFlow(id) {
  const dbFlow = await prisma.flow.findUnique({ where: { id } });
  if (dbFlow) return JSON.parse(dbFlow.definition);
  return _readFlowFile(id);
}

async function createFlow(data) {
  return prisma.flow.create({
    data: {
      id: data.id,
      name: data.name || data.id,
      description: data.description || null,
      definition: JSON.stringify(data),
    },
  });
}

async function updateFlow(id, data) {
  return prisma.flow.update({
    where: { id },
    data: {
      name: data.name || id,
      description: data.description || null,
      definition: JSON.stringify({ ...data, id }),
    },
  });
}

async function deleteFlow(id) {
  return prisma.flow.delete({ where: { id } });
}

function _readFlowFiles() {
  if (!fs.existsSync(FLOWS_DIR)) return [];
  return fs.readdirSync(FLOWS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ id: f.replace('.json', ''), name: f.replace('.json', ''), source: 'file' }));
}

function _readFlowFile(id) {
  const flowFile = path.join(FLOWS_DIR, `${id}.json`);
  if (!fs.existsSync(flowFile)) return null;
  return JSON.parse(fs.readFileSync(flowFile, 'utf8'));
}

module.exports = { listFlows, getFlow, createFlow, updateFlow, deleteFlow };

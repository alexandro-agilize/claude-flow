const prisma = require('./client');

async function createExecution(flowId, input, status = 'running') {
  return prisma.execution.create({
    data: {
      flowId,
      status,
      input: JSON.stringify(input),
    },
  });
}

async function finishExecution(id, output) {
  return prisma.execution.update({
    where: { id },
    data: {
      status: 'success',
      output: JSON.stringify(output),
      finishedAt: new Date(),
    },
  });
}

async function failExecution(id, error) {
  return prisma.execution.update({
    where: { id },
    data: {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      finishedAt: new Date(),
    },
  });
}

async function logNode(executionId, nodeId, nodeType, { input, output, error, startedAt, durationMs }) {
  return prisma.executionLog.create({
    data: {
      executionId,
      nodeId,
      nodeType,
      status: error ? 'error' : 'success',
      input: input != null ? JSON.stringify(input) : null,
      output: output != null ? JSON.stringify(output) : null,
      error: error ? (error instanceof Error ? error.message : String(error)) : null,
      startedAt,
      finishedAt: new Date(),
      durationMs,
    },
  });
}

async function listExecutions(flowId) {
  return prisma.execution.findMany({
    where: flowId ? { flowId } : undefined,
    orderBy: { startedAt: 'desc' },
    take: 50,
    select: { id: true, flowId: true, status: true, startedAt: true, finishedAt: true },
  });
}

async function getExecution(id) {
  return prisma.execution.findUnique({
    where: { id },
    include: { logs: { orderBy: { startedAt: 'asc' } } },
  });
}

module.exports = { createExecution, finishExecution, failExecution, logNode, listExecutions, getExecution };

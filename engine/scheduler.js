const cron = require('node-cron');
const prisma = require('../db/client');
const { getFlow } = require('../db/flows');
const { runFlow } = require('./runner');
const { createExecution, finishExecution, failExecution, logNode } = require('../db/executions');

const activeTasks = {};

async function triggerFlow(scheduleId, flowId) {
  const flow = await getFlow(flowId).catch(() => null);
  if (!flow) {
    console.warn(`[scheduler] Flow "${flowId}" não encontrado para schedule ${scheduleId}`);
    return;
  }

  let execution;
  try {
    execution = await createExecution(flowId, { trigger: 'cron', scheduleId });
  } catch (_) {}

  const hooks = execution ? {
    onNodeComplete: (nodeId, nodeType, info) => logNode(execution.id, nodeId, nodeType, info),
  } : {};

  try {
    const result = await runFlow(flow, { trigger: 'cron', scheduleId }, null, hooks);
    if (execution) await finishExecution(execution.id, result).catch(() => {});
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { lastRunAt: new Date() },
    }).catch(() => {});
    console.log(`[scheduler] Schedule ${scheduleId} executado com sucesso`);
  } catch (err) {
    if (execution) await failExecution(execution.id, err).catch(() => {});
    console.error(`[scheduler] Schedule ${scheduleId} falhou: ${err.message}`);
  }
}

function registerSchedule(schedule) {
  if (!cron.validate(schedule.cron)) {
    console.warn(`[scheduler] Expressão cron inválida para schedule ${schedule.id}: "${schedule.cron}"`);
    return;
  }

  if (activeTasks[schedule.id]) {
    activeTasks[schedule.id].stop();
    delete activeTasks[schedule.id];
  }

  if (!schedule.enabled) return;

  const task = cron.schedule(schedule.cron, () => triggerFlow(schedule.id, schedule.flowId));
  activeTasks[schedule.id] = task;
  console.log(`[scheduler] Schedule "${schedule.id}" registrado (${schedule.cron}) → flow "${schedule.flowId}"`);
}

function unregisterSchedule(scheduleId) {
  if (activeTasks[scheduleId]) {
    activeTasks[scheduleId].stop();
    delete activeTasks[scheduleId];
    console.log(`[scheduler] Schedule "${scheduleId}" removido`);
  }
}

async function loadAll() {
  try {
    const schedules = await prisma.schedule.findMany({ where: { enabled: true } });
    for (const s of schedules) registerSchedule(s);
    console.log(`[scheduler] ${schedules.length} schedule(s) carregado(s)`);
  } catch (err) {
    console.error('[scheduler] Erro ao carregar schedules:', err.message);
  }
}

module.exports = { loadAll, registerSchedule, unregisterSchedule };

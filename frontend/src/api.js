import axios from 'axios';

const api = axios.create({ baseURL: '' });

export const listFlows           = ()          => api.get('/flows');
export const getFlow             = (id)        => api.get(`/flows/${id}`);
export const createFlow          = (flow)      => api.post('/flows', flow);
export const updateFlow          = (id, flow)  => api.put(`/flows/${id}`, flow);
export const deleteFlow          = (id)        => api.delete(`/flows/${id}`);
export const runFlow             = (id, input) => api.post(`/run/${id}`, input);
export const getExecution        = (id)        => api.get(`/executions/${id}`);
export const listExecutions      = (flowId)    => api.get('/executions', { params: flowId ? { flowId } : {} });
export const runStep             = (flow, nodeId, input) => api.post('/run/step', { flow, nodeId, input: input || {} });
export const listCredentials     = ()          => api.get('/credentials');
export const getCredentialById   = (id)        => api.get(`/credentials/${id}`);
export const createCredential    = (data)      => api.post('/credentials', data);
export const updateCredential    = (id, data)  => api.put(`/credentials/${id}`, data);
export const deleteCredential    = (id)        => api.delete(`/credentials/${id}`);

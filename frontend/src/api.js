import axios from 'axios';

const api = axios.create({ baseURL: '' });

export const listFlows    = ()          => api.get('/flows');
export const getFlow      = (id)        => api.get(`/flows/${id}`);
export const createFlow   = (flow)      => api.post('/flows', flow);
export const updateFlow   = (id, flow)  => api.put(`/flows/${id}`, flow);
export const runFlow      = (id, input) => api.post(`/run/${id}`, input);
export const getExecution = (id)        => api.get(`/executions/${id}`);

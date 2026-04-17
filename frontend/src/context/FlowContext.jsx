import { createContext, useContext } from 'react';

export const FlowContext = createContext({
  onDeleteNode: () => {},
  onDuplicateNode: () => {},
  nodeExecutions: {},   // { [nodeId]: { status, output, error, durationMs } }
});

export const useFlowContext = () => useContext(FlowContext);

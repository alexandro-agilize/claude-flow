import { createContext, useContext } from 'react';

export const FlowContext = createContext({
  onDeleteNode: () => {},
  onDuplicateNode: () => {},
  nodeExecutions: {},
  currentFlowId: null,
});

export const useFlowContext = () => useContext(FlowContext);

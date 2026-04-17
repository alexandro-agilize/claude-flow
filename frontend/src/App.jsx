import { useState } from 'react';
import AppSidebar from './components/AppSidebar';
import EditorPage from './pages/EditorPage';
import ExecutionsPage from './pages/ExecutionsPage';
import CredentialsPage from './pages/CredentialsPage';
import FlowsPage from './pages/FlowsPage';
import VariablesPage from './pages/VariablesPage';

export default function App() {
  const [page, setPage] = useState('editor');
  const [editorFlowId, setEditorFlowId] = useState(null);

  const openFlowInEditor = (flowId) => {
    setEditorFlowId(flowId);
    setPage('editor');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#101014' }}>
      <AppSidebar page={page} onNavigate={setPage} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {page === 'editor'      && <EditorPage key={editorFlowId} initialFlowId={editorFlowId} />}
        {page === 'executions'  && <ExecutionsPage />}
        {page === 'credentials' && <CredentialsPage />}
        {page === 'flows'       && <FlowsPage onOpenFlow={openFlowInEditor} />}
        {page === 'variables'   && <VariablesPage />}
      </div>
    </div>
  );
}

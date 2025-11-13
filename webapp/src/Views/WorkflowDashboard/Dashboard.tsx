import React, { useState, useEffect } from 'react';
import { Layout, Header, WorkflowCard, CreateWorkflowCard } from '../../Components';
import { showPopup, removePopup } from '../../Components/WorkflowPopup';
import { useNavigate } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import { Button } from '../../Components';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const WorkflowDashboard: React.FC = () => {

  const navigate = useNavigate();

  const sidebarItems = [
    { icon: 'add_road', label: 'My Workflows', href: '/workflows', active: true },
    { icon: 'key', label: 'Credentials', href: '/credentials', active: false },
    { icon: 'account_circle', label: 'Account', href: '/account', active: false },
  ];

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [localWorkflows, setLocalWorkflows] = useState<number>(0);

  const fetchWorkflows = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/workflow/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Erreur récupération workflows');
      const data = await res.json();
      setWorkflows(data || []);
    } catch (err) {
      console.error('Erreur récupération workflows:', err);
    }
  };
  useEffect(() => {
    fetchWorkflows();
  }, [localWorkflows]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateWorkflow = () => {
    setIsModalOpen(true);
  };

  const confirmCreateWorkflow = async () => {
    const token = localStorage.getItem('token');
    if (!newWorkflowName) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/workflow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newWorkflowName }),
      });
      if (!res.ok) 
        throw new Error('Erreur création workflow');
      const data = await res.json();
      const createdId = data.id || data?.workflow?.id;
      if (!createdId) 
        throw new Error('ID manquant dans la réponse');
      setIsModalOpen(false);
      navigate(`/workflow/${createdId}`);
    } catch (err) {
      console.error('Erreur création workflow:', err);
      alert('Impossible de créer le workflow');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkflow = (id: string) => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/workflow/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(`Deleting workflow: ${id}`);
    setLocalWorkflows((v) => v + 1);
  };

  const fetchNodes = async (workflowId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/workflow/${workflowId}/node`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Erreur récupération nodes');
      const data = await res.json();
      return data || [];
    } catch (err) {
      console.error('Erreur récupération nodes:', err);
      return [];
    }
  };

  const handlePlayWorkflow = async (id: string) => {
    const nodes = await fetchNodes(id);
    if (!id) return alert('Workflow id invalide');
    if (!nodes || nodes.length === 0) return alert('No nodes in workflow');
    const token = localStorage.getItem('token');
    const executingId = 'wf-executing-popup';
    try {
      showPopup('Executing workflow...', { type: 'executing', id: executingId, persistent: true });
      const res = await fetch(`${API_URL}/workflow/${id}/node/${nodes[0].id}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      removePopup(executingId);
      if (res.ok) {
        let data: any = null;
        try { data = await res.json(); } catch {}
        const msg = (data && (data.message || data.status)) || "Workflow executed";
        showPopup(msg, { type: 'success', id: 'wf-executed-popup' });
      } else {
        let text = 'Erreur lors de l\'execution du workflow';
        try { text = (await res.json()).message || (await res.text()) || text; } catch {}
        console.error('Execution failed:', res.status, text);
        showPopup(text, { type: 'executing', id: 'wf-executed-popup' });
      }
    } catch (err) {
      removePopup(executingId);
      console.error('Erreur execution workflow:', err);
      showPopup("Erreur lors de l'execution du workflow", { type: 'executing', id: 'wf-executed-popup' });
    }
  };

  const toggleWorkflow = async (id: string | number) => {
    const token = localStorage.getItem('token');
    const popupId = `wf-toggle-${id}`;
    try {
      showPopup('Toggling workflow...', { type: 'executing', id: popupId, persistent: true });
      const res = await fetch(`http://localhost:3000/workflow/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      removePopup(popupId);
      if (!res.ok) {
        let text = `Failed to toggle workflow (${res.status})`;
        try { text = (await res.json()).message || text; } catch { text = (await res.text()).toString() || text; }
        showPopup(text, { type: 'error' });
      } else {
        showPopup('Workflow toggled', { type: 'success' });
        setLocalWorkflows((v) => v + 1);
      }
    } catch (err) {
      removePopup(popupId);
      console.error('Erreur toggle workflow:', err);
      showPopup('Error toggling workflow', { type: 'error' });
    }
  };

  return (
    <Layout sidebarItems={sidebarItems}>
      <Header
        title="My Workflows"
        description="View and manage your automated workflows"
        action={{
          label: 'Create New Workflow',
          icon: 'add',
          onClick: handleCreateWorkflow,
        }}
      />
      
      <div className="flex-1 p-6 overflow-auto">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-7xl">
          {workflows.map((workflow, index) => (
            <WorkflowCard
              key={workflow.id ?? index}
              title={workflow.name}
              lastModified={workflow.updatedAt ? `Updated: ${new Date(workflow.updatedAt).toLocaleString()}` : ''}
              createdAt={workflow.createdAt ? `Created: ${new Date(workflow.createdAt).toLocaleString()}` : ''}
              status={workflow.isActive ? 'active' : 'inactive'}
              icon={'autorenew'}
              onEdit={() => navigate(`/workflow/${workflow.id}`)}
              onDelete={() => handleDeleteWorkflow(workflow.id)}
              onPlay={!workflow.isActive ? () => handlePlayWorkflow(workflow.id) : undefined}
              onToggle={() => toggleWorkflow(workflow.id)}
              className="h-56"
            />
          ))}
          
          <CreateWorkflowCard
            onCreateWorkflow={handleCreateWorkflow}
            className="h-56"
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsModalOpen(false); }}
            onClick={() => setIsModalOpen(false)}
          />
          <div role="dialog" aria-modal={isModalOpen} aria-hidden={!isModalOpen} className="relative bg-white rounded-lg shadow-xl w-[420px] p-6 z-10">
            <h3 className="text-lg font-semibold mb-2">Create new workflow</h3>
            <p className="text-sm text-gray-600 mb-4">Choose a name for your workflow</p>
            <input
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 border-gray-300"
              placeholder="Workflow name"
              aria-label="Workflow name"
            />
            <div className="flex justify-end gap-2">
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={confirmCreateWorkflow}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

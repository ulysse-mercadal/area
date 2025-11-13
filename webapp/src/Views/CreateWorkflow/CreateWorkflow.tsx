import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Header, NodeEditor, Button } from '../../Components';
import { showPopup, removePopup } from '../../Components/WorkflowPopup';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, type Node, type Edge } from '@xyflow/react';
import { nodeTypes } from '../../utils/nodeTypes';
import '@xyflow/react/dist/style.css';
import { useNavigate } from 'react-router-dom';

const CreateWorkflow: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isEditorOpen, setisEditorOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const params = useParams();
  const workflowIdParam = params.id;
  const workflowId = workflowIdParam ? Number(workflowIdParam) : null;
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState<any | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showLogicModal, setShowLogicModal] = useState(false);
  const [logicForm, setLogicForm] = useState<any>({ label: '', logicType: 'IF', conditions: [{ left: '${x}', operator: '===', right: '' }] });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNodesAndConnections = async () => {
      if (!workflowId) {
        console.error('Workflow id invalide');
        setLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      try {
        const [nodesRes, connsRes] = await Promise.all([
          fetch(`${API_URL}/workflow/${workflowId}/node`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch(`${API_URL}/workflow/${workflowId}/connection`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
        ]);
        if (!nodesRes.ok || !connsRes.ok) throw new Error('Erreur récupération nodes/connections');
        const nodesData = await nodesRes.json();
        const connsData = await connsRes.json();
        const rfNodes: Node[] = nodesData.map((n: any) => ({
          id: String(n.id),
          type: n.actionId ? 'actionNode' : n.reactionId ? 'reactionNode' : 'logicNode',
          position: { x: n.positionX ?? Math.random() * 400 + 100, y: n.positionY ?? Math.random() * 300 + 100 },
          data: {
            label: n.name || (n.actionId ? 'Action' : 'Reaction'),
            service: n.action?.service?.name || n.reaction?.service?.name || 'Service',
            action: n.action?.name,
            reaction: n.reaction?.name,
            icon: n.action?.icon || n.reaction?.icon || 'settings',
            configured: !!(n.conf || n.actionId || n.reactionId),
            conf: n.conf || {},
          },
        }));
              const rfEdges: Edge[] = (connsData || []).map((c: any) => ({
          id: String(c.id),
          source: String(c.sourceNodeId ?? c.source ?? ''),
          target: String(c.targetNodeId ?? c.target ?? ''),
          sourceHandle: (() => {
            const srcId = String(c.sourceNodeId ?? c.source ?? '');
            const srcNode = rfNodes.find(rn => String(rn.id) === srcId);
            if (!srcNode || srcNode.type !== 'logicNode') return c.sourceHandle ?? c.source_handle ?? undefined;
            return c.sourceHandle ?? (c.channel === 'success' ? 'true' : c.channel === 'failed' ? 'false' : (c.source_handle ?? undefined));
          })(),
          targetHandle: c.targetHandle ?? c.target_handle ?? undefined,
          type: 'default',
        }));
        setNodes(rfNodes);
        setEdges(rfEdges);
      } catch (err) {
        console.error('Erreur récupération nodes/connections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNodesAndConnections();
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/area`, { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) {
          const data = await res.json();
          setArea(data);
        } else {
          console.warn('Failed to fetch area data:', res.status);
        }
      } catch (err) {
        console.error('Error fetching area:', err);
      }
    })();
  }, [workflowId]);

  const createNodeApi = async (payload: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/workflow/${workflowId}/node`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erreur création node');
    return res.json();
  };

  const updateNodeApi = async (nodeId: number, payload: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/workflow/${workflowId}/node/${nodeId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erreur update node');
    return res.json();
  };
  const sidebarItems = [
    { icon: 'add_road', label: 'My Workflows', href: '/workflows', active: true },
    { icon: 'key', label: 'Credentials', href: '/credentials', active: false },
    { icon: 'account_circle', label: 'Account', href: '/account', active: false },
  ];
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    setSelectedNode(node);
    setisEditorOpen(true);
  }, [setEdges, workflowId]);

  const handleNodeUpdate = useCallback((updatedData: any) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: updatedData }
            : node
        )
      );
      (async () => {
        try {
          const nodeId = Number(selectedNode.id);
          if (!Number.isNaN(nodeId)) {
            const payload: any = {};
            if (updatedData.label) payload.name = updatedData.label;
            if (updatedData.conf) payload.conf = updatedData.conf;
            else payload.conf = updatedData;
            await updateNodeApi(nodeId, payload);
          }
        } catch (err) {
          console.error('Erreur update node API:', err);
        }
      })();
    }
  }, [selectedNode, setNodes]);

  const handleAddActionNode = async () => {
    setShowActionMenu(true);
  };

  const handleAddReactionNode = async () => {
    setShowReactionMenu(true);
  };

  const createActionNodeFromArea = async (action: any) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
    try {
      const created = await createNodeApi({ name: action.name, actionId: action.id, positionX: position.x, positionY: position.y });
      const rfNode: Node = {
        id: String(created.id),
        type: 'actionNode',
        position,
        data: {
          label: created.name || action.name,
          service: action.serviceType || action.service || 'Service',
          action: action.name,
          icon: created.action?.icon || action.icon || 'settings',
          configured: !!(created.conf || created.actionId),
          conf: created.conf || {},
        },
      };
      setNodes((nds) => [...nds, rfNode]);
    } catch (err) {
      console.error('Erreur création node:', err);
    } finally {
      setShowActionMenu(false);
    }
  };

  const createReactionNodeFromArea = async (reaction: any) => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
    try {
      const created = await createNodeApi({ name: reaction.name, reactionId: reaction.id, positionX: position.x, positionY: position.y });
      const rfNode: Node = {
        id: String(created.id),
        type: 'reactionNode',
        position,
        data: {
          label: created.name || reaction.name,
          service: reaction.serviceType || reaction.service || 'Service',
          reaction: reaction.name,
          icon: created.reaction?.icon || reaction.icon || 'settings',
          configured: !!(created.conf || created.reactionId),
          conf: created.conf || {},
        },
      };
      setNodes((nds) => [...nds, rfNode]);
    } catch (err) {
      console.error('Erreur création node:', err);
    } finally {
      setShowReactionMenu(false);
    }
  };

  const handleAddLogicNode = async () => {
    setLogicForm({ label: '', logicType: 'IF', conditions: [{ left: '${x}', operator: '===', right: '' }] });
    setShowLogicModal(true);
  };

  const createLogicNodeFromForm = async () => {
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
    const logicType = logicForm.logicType || 'IF';
    const c = (logicForm.conditions && logicForm.conditions[0]) || { left: '', operator: '===', right: '' };
    const condStr = `${c.left} ${c.operator} ${c.right}`;
    try {
      const payload: any = {
        name: logicForm.label || `Logic ${logicType}`,
        logicType: logicType,
        positionX: position.x,
        positionY: position.y,
        conf: logicType === 'IF' ? { condition: condStr, conditions: [c] } : {},
      };
      const created = await createNodeApi(payload);
      const rfNode: Node = {
        id: String(created.id),
        type: 'logicNode',
        position,
        data: {
          label: created.name || (logicForm.label || `Logic ${logicType}`),
          icon: 'device_hub',
          configured: !!(created.conf || (logicType === 'IF' && condStr)),
          conf: created.conf || (logicType === 'IF' ? { condition: condStr, conditions: [c] } : {}),
        },
      };
      setNodes((nds) => [...nds, rfNode]);
      setShowLogicModal(false);
    } catch (err) {
      console.error('Erreur création logic node:', err);
    }
  };

  const onNodeDragStop = useCallback(async (_event: any, node: Node) => {
    const nodeId = Number(node.id);
    if (Number.isNaN(nodeId)) return;
    try {
      await updateNodeApi(nodeId, { positionX: node.position.x, positionY: node.position.y });
    } catch (err) {
      console.error('Erreur sauvegarde position node:', err);
    }
  }, []);

  const createConnectionApi = async (payload: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/workflow/${workflowId}/connection`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Erreur création connection');
    return res.json();
  };

  const onConnect = useCallback(
    async (params: any) => {
      try {
        const sourceId = Number(params.source);
        const targetId = Number(params.target);
        const srcNode = nodes.find(n => String(n.id) === String(params.source));
        const isLogicSource = !!(srcNode && srcNode.type === 'logicNode');
        let channel: 'success' | 'failed' = 'success';
        if (isLogicSource) {
          channel = params.sourceHandle === 'false' ? 'failed' : 'success';
        }
        const created = await createConnectionApi({ sourceNodeId: sourceId, targetNodeId: targetId, channel: channel });
        const newEdge: Edge = { id: String(created.id), source: String(sourceId), target: String(targetId), type: 'default' };

        if (isLogicSource && params.sourceHandle) {
          newEdge.sourceHandle = params.sourceHandle;
        } else if (isLogicSource && created.channel) {
          newEdge.sourceHandle = created.channel === 'success' ? 'true' : created.channel === 'failed' ? 'false' : undefined;
        }
        if (params.targetHandle) newEdge.targetHandle = params.targetHandle;

        setEdges((eds) => addEdge(newEdge, eds));
      } catch (err) {
        console.error('Erreur création connection (fallback to local):', err);
        try {
          const fallback: any = {
            id: `tmp-${Date.now()}`,
            source: String(params.source),
            target: String(params.target),
            type: 'default',
          };
          if (params.sourceHandle) fallback.sourceHandle = params.sourceHandle;
          if (params.targetHandle) fallback.targetHandle = params.targetHandle;
          setEdges((eds) => addEdge(fallback, eds));
        } catch (e) {
        }
      }
    },
    [nodes, workflowId, API_URL, setEdges]
  );


  const executeWorkflow = async () => {
    if (!workflowId) return alert('Workflow id invalide');
    if (!nodes || nodes.length === 0) return alert('No nodes in workflow');
    const token = localStorage.getItem('token');
    const executingId = 'wf-executing-popup';
    try {
      showPopup('Executing workflow...', { type: 'executing', id: executingId, persistent: true });
      const res = await fetch(`${API_URL}/workflow/${workflowId}/node/${nodes[0].id}/execute`, {
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

  const deleteNode = useCallback(async ({ nodes }: { nodes: Node[]; edges: Edge[] }) => {
    const token = localStorage.getItem('token');
    try {
      for (const node of nodes) {
        const idNum = Number(node.id);
        if (!Number.isNaN(idNum)) {
          const res = await fetch(`${API_URL}/workflow/${workflowId}/node/${idNum}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
          if (!res.ok) throw new Error('Erreur suppression node');
        }
      }
    } catch (err) {
      console.error('Erreur suppression node:', err);
    }
    setNodes((nds) => nds.filter(n => !nodes.some(d => d.id === n.id)));
    setEdges((eds) => eds.filter(e => !nodes.some(d => d.id === e.source || d.id === e.target)));
  }, [setNodes, setEdges]);

  const onEdgesDelete = useCallback(async (edges: Edge[]) => {
    const token = localStorage.getItem('token');
    try {
      for (const edge of edges) {
        const idNum = Number(edge.id);
        if (!Number.isNaN(idNum)) {
          const res = await fetch(`${API_URL}/workflow/${workflowId}/connection/${idNum}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
          if (!res.ok) throw new Error('Erreur suppression edge');
        }
      }
    } catch (err) {
      console.error('Erreur suppression edge:', err);
    }
    setEdges((eds) => eds.filter(e => !edges.some(de => de.id === e.id)));
  }, []);

  const prevOutputs = React.useMemo(() => {
    if (!selectedNode) return [];
    if (!area) return [];
    const incoming = edges.filter(e => String(e.target) === String(selectedNode.id));
    const outputs: any[] = [];
    for (const edge of incoming) {
      const srcNode = nodes.find(n => String(n.id) === String(edge.source));
      if (!srcNode) continue;
      const fromNodeLabel = srcNode.data?.label || `Node ${srcNode.id}`;
      const actionName = srcNode.data?.action;
      const reactionName = srcNode.data?.reaction;
      const list = actionName ? (area.actions || []) : reactionName ? (area.reactions || []) : [];
      const schema = list.find((s: any) => s.name === (actionName || reactionName) || String(s.id) === String(srcNode.data?.actionId || srcNode.data?.reactionId));
      if (!schema || !schema.output) continue;
      schema.output.forEach((out: any) => outputs.push({ ...out, fromNodeLabel }));
    }
    return outputs;
  }, [selectedNode, edges, nodes, area]);


  return (
    <>
      {loading ? (
        <div className="p-6">Loading workflow...</div>
      ) : !workflowId ? (
        <div className="p-6 text-red-600">Workflow id invalide</div>
      ) : (
    <Layout sidebarItems={sidebarItems} theme="light">
      <Header
        title="My New Workflow"
        description="Create and connect your services"
        actions={[
          {
            label: 'Cancel',
            icon: 'close',
            onClick: () => navigate('/workflows'),
          }]
        }
        theme="light"
      />

      <div className="flex-1 relative">
  <div style={{ width: '100%', height: '100%' }} className="w-full flex-1 min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeDoubleClick={onNodeClick}
            onEdgesDelete={onEdgesDelete}
            onDelete={deleteNode}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50 h-full"
            style={{ width: '100%' }}
          >
            <Background variant={'dots' as any} gap={12} size={1} />
            <Controls />
          </ReactFlow>
          <div className="absolute left-0 right-0 bottom-6 flex items-end justify-center pointer-events-none">
            <div id="execute-workflow-container" className="pointer-events-auto">
              <Button variant="primary" size="lg" onClick={executeWorkflow}>
                Execute Workflow
              </Button>
            </div>
          </div>
        </div>
        
        <div className="fixed bottom-6 right-6 flex flex-col gap-2">
          <button
            onClick={handleAddActionNode}
            aria-label="Add action node"
            className="w-12 h-12 bg-green-600 text-white rounded-full shadow-xl hover:bg-green-500 transition-colors flex items-center justify-center"
            title="Add Action Node"
          >
            <span className="material-icons text-xl">play_arrow</span>
          </button>
          <button
            onClick={handleAddReactionNode}
            aria-label="Add reaction node"
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-500 transition-colors flex items-center justify-center"
            title="Add Reaction Node"
          >
            <span className="material-icons text-xl">electric_bolt</span>
          </button>
          <button
            onClick={handleAddLogicNode}
            aria-label="Add logic node"
            className="w-12 h-12 bg-yellow-600 text-white rounded-full shadow-xl hover:bg-yellow-500 transition-colors flex items-center justify-center"
            title="Add Logic Node"
          >
            <span className="material-icons text-xl">device_hub</span>
          </button>
        </div>
      </div>

        {showActionMenu && area && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              role="button"
              tabIndex={0}
              aria-label="Close dialog"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowActionMenu(false); }}
              onClick={() => setShowActionMenu(false)}
            />
            <div className={"relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-200 ease-out will-change-transform"}>
              <div className="overflow-y-auto max-h-[90vh]">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Choose an Action</h3>
                  <button onClick={() => setShowActionMenu(false)} aria-label="Close dialog" className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200">
                    <span className="material-icons">close</span>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {(area.actions || []).map((a: any) => (
                    <div key={a.id} className="p-4 border rounded-md flex justify-between items-start border-gray-300">
                      <div>
                        <h4 className="font-medium">{a.name} <span className="text-xs text-gray-500">({a.serviceType})</span></h4>
                        <p className="text-sm text-gray-600">{a.description}</p>
                        {a.parameters && a.parameters.length > 0 && (
                          <div className="mt-2 text-sm">
                            <strong>Parameters:</strong>
                            <ul className="list-disc ml-5">
                              {a.parameters.map((p: any) => (
                                <li key={p.name}>{p.name} — {p.type} {p.required ? '(required)' : ''} — {p.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div>
                        <Button size="sm" onClick={() => createActionNodeFromArea(a)}>Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showReactionMenu && area && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              role="button"
              tabIndex={0}
              aria-label="Close dialog"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowReactionMenu(false); }}
              onClick={() => setShowReactionMenu(false)}
            />
            <div className={"relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-200 ease-out will-change-transform"}>
              <div className="overflow-y-auto max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Choose a Reaction</h3>
                  <button onClick={() => setShowReactionMenu(false)} aria-label="Close dialog" className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200">
                    <span className="material-icons">close</span>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {(area.reactions || []).map((r: any) => (
                    <div key={r.id} className="p-4 border rounded-md flex justify-between items-start border-gray-300">
                      <div>
                        <h4 className="font-medium">{r.name} <span className="text-xs text-gray-500">({r.serviceType})</span></h4>
                        <p className="text-sm text-gray-600">{r.description}</p>
                        {r.parameters && r.parameters.length > 0 && (
                          <div className="mt-2 text-sm">
                            <strong>Parameters:</strong>
                            <ul className="list-disc ml-5">
                              {r.parameters.map((p: any) => (
                                <li key={p.name}>{p.name} — {p.type} {p.required ? '(required)' : ''} — {p.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div>
                        <Button size="sm" onClick={() => createReactionNodeFromArea(r)}>Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showLogicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              role="button"
              tabIndex={0}
              aria-label="Close dialog"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowLogicModal(false); }}
              onClick={() => setShowLogicModal(false)}
            />
            <div className={"relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all duration-200 ease-out will-change-transform"}>
              <div className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-300 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Create {logicForm.logicType || 'IF'} Logic Node</h3>
                  <button onClick={() => setShowLogicModal(false)} aria-label="Close dialog" className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200">
                    <span className="material-icons">close</span>
                  </button>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label id="logic-node-label" className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                      <input id="logic-node-label-input" aria-labelledby="logic-node-label" value={logicForm.label} onChange={(e) => setLogicForm((s: any) => ({ ...s, label: e.target.value }))} placeholder="Node label" className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F22FE] focus:border-transparent shadow-sm" />
                    </div>

                    <div>
                      <label id="logic-type-label" className="block text-sm font-medium text-gray-700 mb-2">Logic Type</label>
                      <select
                        aria-labelledby="logic-type-label"
                        value={logicForm.logicType}
                        onChange={(e) => setLogicForm((prev: any) => ({
                          ...prev,
                          logicType: e.target.value,
                          conf: e.target.value === 'IF' ? (prev.conditions ? { conditions: prev.conditions } : { conditions: [{ left: '', operator: '===', right: '' }] }) : {}
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="IF">IF</option>
                        <option value="AND">AND</option>
                        <option value="NOT">NOT</option>
                      </select>

                      {logicForm.logicType === 'IF' ? (
                        <div className="mt-4">
                          <label id="logic-condition-label" className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <input id="logic-condition-left" aria-labelledby="logic-condition-label" className="col-span-5 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm" value={logicForm.conditions?.[0]?.left || ''} onChange={(e) => setLogicForm((s: any) => ({ ...s, conditions: [{ ...(s.conditions?.[0] || {}), left: e.target.value }] }))} />
                            <select id="logic-condition-operator" aria-labelledby="logic-condition-label" className="col-span-2 px-2 py-2 border border-gray-300 rounded-md bg-white text-sm" value={logicForm.conditions?.[0]?.operator || '==='} onChange={(e) => setLogicForm((s: any) => ({ ...s, conditions: [{ ...(s.conditions?.[0] || {}), operator: e.target.value }] }))}>
                              <option value="===">is equal</option>
                              <option value=">=">is greater or equal</option>
                              <option value="<=">is less or equal</option>
                              <option value=">">is greater than</option>
                              <option value="<">is less than</option>
                              <option value="!=">is not equal</option>
                            </select>
                            <input id="logic-condition-right" aria-labelledby="logic-condition-label" className="col-span-4 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm" value={logicForm.conditions?.[0]?.right || ''} onChange={(e) => setLogicForm((s: any) => ({ ...s, conditions: [{ ...(s.conditions?.[0] || {}), right: e.target.value }] }))} />
                            <div className="col-span-1" />
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-gray-500">No parameters required for {logicForm.logicType} nodes.</p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
                      <Button variant="secondary" onClick={() => setShowLogicModal(false)}>Cancel</Button>
                      <Button onClick={createLogicNodeFromForm}>Create</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <NodeEditor
        isOpen={isEditorOpen}
        onClose={() => setisEditorOpen(false)}
        nodeData={selectedNode?.data || null}
        nodeType={selectedNode?.type === 'actionNode' ? 'action' : selectedNode?.type === 'reactionNode' ? 'reaction' : 'logic'}
        onSave={handleNodeUpdate}
        areaData={area}
        prevOutputs={prevOutputs}
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNode?.id ?? null}
      />
    </Layout>
      )}
    </>
  );
};

export default CreateWorkflow;
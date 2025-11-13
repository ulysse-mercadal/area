import React, { useState, useEffect } from 'react';
import { Input, Button } from '.';
import type { ActionNodeData } from './ActionNode';
import type { ReactionNodeData } from './ReactionNode';
import type { LogicalNodeData } from './LogicalNode';
import { services as mockServices, type Service } from '../data/services';

interface NodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: ActionNodeData | ReactionNodeData | LogicalNodeData | null;
  nodeType: 'action' | 'reaction' | 'logic';
  onSave: (updatedData: any) => void;
  areaData?: { actions?: any[]; reactions?: any[] } | null;
  prevOutputs?: any[];
  nodes?: any[];
  edges?: any[];
  selectedNodeId?: string | null;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  isOpen,
  onClose,
  nodeData,
  nodeType,
  onSave,
  areaData,
  prevOutputs,
}) => {
  const [formData, setFormData] = useState<any>({
    label: '',
    service: '',
    action: '',
    reaction: '',
    icon: '',
    configured: false,
    credentialId: '',
    logicType: 'IF',
    conf: { conditions: [{ left: '${x}', operator: '===', right: '' }] },
  });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const derivedServices: Service[] = React.useMemo(() => {
    if (areaData && (areaData.actions || areaData.reactions)) {
      const map = new Map<string, any>();
      (areaData.actions || []).forEach((a: any) => {
        const key = a.serviceType || a.service || 'UNKNOWN';
        if (!map.has(key)) map.set(key, { id: key, name: key, actions: [], reactions: [], icon: '', color: '', description: '' });
        const entry = map.get(key);
        entry.actions.push(a);
      });
      (areaData.reactions || []).forEach((r: any) => {
        const key = r.serviceType || r.service || 'UNKNOWN';
        if (!map.has(key)) map.set(key, { id: key, name: key, actions: [], reactions: [], icon: '', color: '', description: '' });
        const entry = map.get(key);
        entry.reactions.push(r);
      });
      return Array.from(map.values()) as Service[];
    }
    return mockServices;
  }, [areaData]);

  useEffect(() => {
    if (nodeData) {
      const rawService = (nodeData as any).service;
      const serviceKey = rawService && typeof rawService === 'object' ? (rawService.name ?? rawService.id) : (rawService ?? '');
      setFormData((prev: any) => ({
        ...prev,
        label: (nodeData as any).label || '',
        service: serviceKey,
        action: (nodeData as any).action || '',
        reaction: (nodeData as any).reaction || '',
        icon: (nodeData as any).icon || '',
        configured: (nodeData as any).configured || false,
        credentialId: '',
        logicType: (nodeData as any).logicType || 'IF',
        conf: (nodeData as any).conf || {},
      }));

      const service = derivedServices.find(s => s.name === serviceKey || s.id === serviceKey);
      setSelectedService(service || null);
    }
  }, [nodeData]);

  useEffect(() => {
    if (nodeType === 'logic' && nodeData) {
      const conf = (nodeData as any).conf || {};
      const nodeLogicType = (nodeData as any).logicType || 'IF';
      setFormData((prev: any) => ({ ...prev, logicType: nodeLogicType }));
      if (nodeLogicType === 'IF') {
        if (conf.conditions && Array.isArray(conf.conditions) && conf.conditions.length > 0) {
          setFormData((prev: any) => ({ ...prev, conf: { ...(prev.conf || {}), conditions: [conf.conditions[0]] } }));
        } else if (conf.condition && typeof conf.condition === 'string') {
          const m = conf.condition.match(/(.+?)\s*(===|>=|<=|!=|>|<)\s*(.+)/);
          if (m) setFormData((prev: any) => ({ ...prev, conf: { ...(prev.conf || {}), conditions: [{ left: m[1].trim(), operator: m[2], right: m[3].trim() }] } }));
          else setFormData((prev: any) => ({ ...prev, conf: { ...(prev.conf || {}), conditions: [{ left: conf.condition, operator: '===', right: '' }] } }));
        } else {
          setFormData((prev: any) => ({ ...prev, conf: { ...(prev.conf || {}), conditions: prev.conf?.conditions || [{ left: '', operator: '===', right: '' }] } }));
        }
      } else {
        setFormData((prev: any) => ({ ...prev, conf: {} }));
      }
    }
  }, [nodeData, nodeType]);

  

  const handleSave = () => {
    const updatedData: any = {
      ...nodeData,
      ...formData,
      configured: true,
    };
    if (nodeType === 'logic') {
        const logicType = formData.logicType || 'IF';
        updatedData.logicType = logicType;
        if (logicType === 'IF') {
          const c = (formData.conf && formData.conf.conditions && formData.conf.conditions[0]) || { left: '', operator: '===', right: '' };
          const condStr = `${c.left} ${c.operator} ${c.right}`;
          updatedData.conf = { ...(formData.conf || {}), condition: condStr, conditions: [c] };
        } else {
          updatedData.conf = {};
        }
    }
    onSave(updatedData);
    onClose();
  };

  const selectedItem = React.useMemo(() => {
    if (!selectedService) return null;
    const list = nodeType === 'action' ? selectedService.actions : selectedService.reactions;
    return list?.find((it: any) => it.name === (nodeType === 'action' ? formData.action : formData.reaction)) || null;
  }, [selectedService, formData.action, formData.reaction, nodeType]);

  const handleParamChange = (paramName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      conf: {
        ...(prev.conf || {}),
        [paramName]: value,
      }
    }));
  };

  return (
      
      <div
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-label={nodeType === 'logic' ? 'Logic node editor' : `Configure ${nodeType} node`}
        className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-opacity duration-200 ease-out
        ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
      `}>
        <div 
          className={`
            absolute inset-0 bg-black/30 backdrop-blur-sm
            transition-opacity duration-200 ease-out
            ${isOpen ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={onClose}
        />
        
        <div 
          className={`
            relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden
            transform transition-all duration-200 ease-out will-change-transform
            ${isOpen 
              ? 'scale-100 translate-y-0 opacity-100' 
              : 'scale-95 translate-y-4 opacity-0'
            }
          `}
          style={{ 
            transitionProperty: 'transform, opacity',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          
          <div>
            <div className="px-6 py-4 border-b border-gray-300 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                {nodeType === 'logic' ? 'Configure Logic Node' : `Configure ${nodeType === 'action' ? 'Action' : 'Reaction'} Node`}
                </h2>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="px-6 py-6 flex flex-col sm:flex-row gap-6 items-start">
              {prevOutputs && prevOutputs.length > 0 && (
                <aside className="w-full sm:w-64 flex-shrink-0 p-3 bg-gray-50 border border-gray-300 rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Available variables</h4>
                    <span className="text-xs text-gray-500">{prevOutputs.length}</span>
                  </div>
                  <div className="max-h-[48vh] overflow-y-auto pr-1">
                    <ul className="space-y-2">
                      {prevOutputs.map((v: any, idx: number) => (
                        <li key={`${v.name}-${idx}`} className="p-2 bg-white border border-gray-300 rounded flex flex-col">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium text-sm truncate">{v.name}</div>
                            <div className="text-xs text-gray-500">{v.type}</div>
                          </div>
                          {v.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{v.description}</div>}
                          <div className="mt-2 text-xs text-gray-400">from {v.fromNodeLabel}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              )}
              <div className="w-full max-h-[72vh] overflow-y-auto">
                <div className="">
                <Input
                  label="Node Label"
                  value={formData.label}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev: any) => ({ ...prev, label: e.target.value }))}
                  placeholder="Enter a descriptive label"
                />
              </div>

              {nodeType === 'logic' && (
                <div>
                  <label id="nodeeditor-logic-type-label" className="block text-sm font-medium text-gray-700 mb-2 mt-4">Logic Type</label>
                  <select
                    aria-labelledby="nodeeditor-logic-type-label"
                    value={formData.logicType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData((prev: any) => ({
                      ...prev,
                      logicType: e.target.value,
                      conf: e.target.value === 'IF' ? (prev.conf?.conditions ? prev.conf : { conditions: [{ left: '', operator: '===', right: '' }] }) : {}
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IF">IF</option>
                    <option value="AND">AND</option>
                    <option value="NOT">NOT</option>
                  </select>

                  {formData.logicType === 'IF' ? (
                    <div className="mt-4">
                      <label id="nodeeditor-condition-label" className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <input
                          id="nodeeditor-condition-left"
                          aria-labelledby="nodeeditor-condition-label"
                          className="col-span-5 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                          value={formData.conf?.conditions?.[0]?.left || ''}
                          onChange={(e) => setFormData((s: any) => ({
                            ...s,
                            conf: { ...(s.conf || {}), conditions: [{ ...(s.conf?.conditions?.[0] || {}), left: e.target.value }] }
                          }))}
                        />
                        <select
                          id="nodeeditor-condition-operator"
                          aria-labelledby="nodeeditor-condition-label"
                          className="col-span-2 px-2 py-2 border border-gray-300 rounded-md bg-white text-sm"
                          value={formData.conf?.conditions?.[0]?.operator || '==='}
                          onChange={(e) => setFormData((s: any) => ({
                            ...s,
                            conf: { ...(s.conf || {}), conditions: [{ ...(s.conf?.conditions?.[0] || {}), operator: e.target.value }] }
                          }))}
                        >
                          <option value="===">is equal</option>
                          <option value=">=">is greater or equal</option>
                          <option value="<=">is less or equal</option>
                          <option value=">">is greater than</option>
                          <option value="<">is less than</option>
                          <option value="!=">is not equal</option>
                        </select>
                        <input
                          id="nodeeditor-condition-right"
                          aria-labelledby="nodeeditor-condition-label"
                          className="col-span-4 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                          value={formData.conf?.conditions?.[0]?.right || ''}
                          onChange={(e) => setFormData((s: any) => ({
                            ...s,
                            conf: { ...(s.conf || {}), conditions: [{ ...(s.conf?.conditions?.[0] || {}), right: e.target.value }] }
                          }))}
                        />
                        <div className="col-span-1" />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">No parameters required for {formData.logicType} nodes.</p>
                  )}
                </div>
              )}

              

              {selectedService && (
                <div>
                  <label id="nodeeditor-actionreaction-label" className="block text-sm font-medium text-gray-700 mb-2">
                    {nodeType === 'action' ? 'Action' : 'Reaction'}
                  </label>
                  <select
                    aria-labelledby="nodeeditor-actionreaction-label"
                    value={nodeType === 'action' ? formData.action : formData.reaction}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData((prev: any) => ({
                      ...prev,
                      [nodeType === 'action' ? 'action' : 'reaction']: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {nodeType === 'action' ? 'an action' : 'a reaction'}</option>
                    {(nodeType === 'action' ? selectedService.actions : selectedService.reactions)?.map(item => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {(nodeType === 'action' ? formData.action : formData.reaction) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {(nodeType === 'action' ? selectedService.actions : selectedService.reactions)
                        ?.find(item => item.name === (nodeType === 'action' ? formData.action : formData.reaction))?.description}
                    </p>
                  )}
                  
                  {selectedItem && (selectedItem as any).parameters && (selectedItem as any).parameters.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Parameters</h4>
                      <div className="space-y-4">
                        {(selectedItem as any).parameters.map((p: any) => (
                          <div key={p.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{p.name} {p.required ? '*' : ''}</label>
                            {p.type === 'string' && (
                              <Input value={formData.conf?.[p.name] ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParamChange(p.name, e.target.value)} placeholder={p.description} />
                            )}
                            {p.type === 'number' && (
                              <Input type="number" value={formData.conf?.[p.name] ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParamChange(p.name, Number(e.target.value))} placeholder={p.description} />
                            )}
                            {p.type === 'boolean' && (
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={!!formData.conf?.[p.name]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParamChange(p.name, e.target.checked)} />
                                <span className="text-sm text-gray-600">{p.description}</span>
                              </div>
                            )}
                            {p.type === 'text' && (
                              <textarea value={formData.conf?.[p.name] ?? ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleParamChange(p.name, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              
            </div>

              </div>
              <div className="px-6 py-4 border-t border-gray-300 flex justify-end space-x-3 bg-gray-50">
                <Button
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    nodeType === 'logic'
                      ? !formData.label
                      : (!formData.label || !formData.service || !(formData.action || formData.reaction))
                  }
                >
                  Save Configuration
                </Button>
              </div>
            </div>
        </div>
      </div>
  );
};
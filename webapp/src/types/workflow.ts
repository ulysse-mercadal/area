import type { Node, Edge } from '@xyflow/react';
import type { ActionNodeData } from '../Components/ActionNode';
import type { ReactionNodeData } from '../Components/ReactionNode';

export type WorkflowNodeData = (ActionNodeData | ReactionNodeData) & Record<string, unknown>;

export type WorkflowNode = Node<WorkflowNodeData>;

export type WorkflowEdge = Edge;

export interface ServiceConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  actions?: ActionConfig[];
  reactions?: ReactionConfig[];
}

export interface ActionConfig {
  id: string;
  name: string;
  description: string;
  inputs?: InputField[];
}

export interface ReactionConfig {
  id: string;
  name: string;
  description: string;
  inputs?: InputField[];
}

export interface InputField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'number' | 'select' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}
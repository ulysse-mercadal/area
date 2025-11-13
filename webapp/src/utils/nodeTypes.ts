import { ActionNode } from '../Components/ActionNode';
import { ReactionNode } from '../Components/ReactionNode';
import { LogicalNode } from '../Components/LogicalNode';

export const nodeTypes = {
  actionNode: ActionNode,
  reactionNode: ReactionNode,
  logicNode: LogicalNode,
};

export const createInitialNodes = () => [
  {
    id: 'action-1',
    type: 'actionNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'When Email Received',
      service: 'Gmail',
      action: 'New Email',
      icon: 'email',
      configured: true,
    },
  },
  {
    id: 'reaction-1',
    type: 'reactionNode',
    position: { x: 400, y: 100 },
    data: {
      label: 'Send Notification',
      service: 'Slack',
      reaction: 'Send Message',
      icon: 'notifications',
      configured: false,
    },
  },
];

export const createInitialEdges = () => [
  {
    id: 'e1-2',
    source: 'action-1',
    target: 'reaction-1',
    type: 'smoothstep',
  },
];

export const createActionNode = (id: string, position: { x: number; y: number }) => ({
  id,
  type: 'actionNode',
  position,
  data: {
    label: 'New Action',
    service: 'Select Service',
    action: 'Choose an action',
    icon: 'settings',
    configured: false,
  },
});

export const createReactionNode = (id: string, position: { x: number; y: number }) => ({
  id,
  type: 'reactionNode',
  position,
  data: {
    label: 'New Reaction',
    service: 'Select Service',
    reaction: 'Choose a reaction',
    icon: 'settings',
    configured: false,
  },
});

export const createLogicNode = (id: string, position: { x: number; y: number }) => ({
  id,
  type: 'logicNode',
  position,
  data: {
    label: 'New Logic',
    logicType: 'IF',
    condition: '',
    icon: 'device_hub',
    configured: false,
  },
});
import React from 'react';
import { Button } from './Button';

interface CreateWorkflowCardProps {
  onCreateWorkflow: () => void;
  className?: string;
}

export const CreateWorkflowCard: React.FC<CreateWorkflowCardProps> = ({
  onCreateWorkflow,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border-2 border-dashed border-gray-300 shadow-lg p-8 flex flex-col items-center justify-center text-center ${className}`}>
      <Button
        onClick={onCreateWorkflow}
        icon={<span className="material-icons text-2xl">add</span>}
        className="mb-4"
      >
        Create New Workflow
      </Button>
      <p className="text-sm text-gray-600 font-sora">
        Automate your tasks with a new workflow.
      </p>
    </div>
  );
};

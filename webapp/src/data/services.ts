export interface ServiceAction {
  id: string;
  name: string;
  description: string;
  inputs?: ServiceInput[];
}

export interface ServiceReaction {
  id: string;
  name: string;
  description: string;
  inputs?: ServiceInput[];
}

export interface ServiceInput {
  id: string;
  name: string;
  type: 'text' | 'email' | 'number' | 'select' | 'boolean' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string;
}

export interface Service {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  actions?: ServiceAction[];
  reactions?: ServiceReaction[];
}

export interface Credential {
  id: string;
  name: string;
  service: string;
  type: string;
  status: 'connected' | 'expired' | 'error';
  createdAt: string;
}

// Mock Services Configuration
export const services: Service[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'email',
    color: '#EA4335',
    description: 'Google Gmail email service integration',
    actions: [
      {
        id: 'new_email',
        name: 'New Email Received',
        description: 'Triggers when a new email is received in your inbox',
        inputs: [
          {
            id: 'from_filter',
            name: 'From Email Filter',
            type: 'email',
            required: false,
            placeholder: 'optional@example.com',
          },
          {
            id: 'subject_filter',
            name: 'Subject Contains',
            type: 'text',
            required: false,
            placeholder: 'Enter keywords to filter by subject',
          },
        ],
      },
      {
        id: 'sent_email',
        name: 'Email Sent',
        description: 'Triggers when you send an email',
      },
    ],
    reactions: [
      {
        id: 'send_email',
        name: 'Send Email',
        description: 'Send an email to specified recipients',
        inputs: [
          {
            id: 'to_email',
            name: 'To Email',
            type: 'email',
            required: true,
            placeholder: 'recipient@example.com',
          },
          {
            id: 'subject',
            name: 'Subject',
            type: 'text',
            required: true,
            placeholder: 'Email subject',
          },
          {
            id: 'body',
            name: 'Email Body',
            type: 'textarea',
            required: true,
            placeholder: 'Email content',
          },
        ],
      },
      {
        id: 'reply_email',
        name: 'Reply to Email',
        description: 'Reply to the incoming email',
        inputs: [
          {
            id: 'reply_body',
            name: 'Reply Message',
            type: 'textarea',
            required: true,
            placeholder: 'Your reply message',
          },
        ],
      },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'chat',
    color: '#4A154B',
    description: 'Slack team communication platform',
    actions: [
      {
        id: 'new_message',
        name: 'New Message',
        description: 'Triggers when a new message is posted in a channel',
        inputs: [
          {
            id: 'channel',
            name: 'Channel',
            type: 'select',
            required: true,
            options: [
              { label: '#general', value: 'general' },
              { label: '#random', value: 'random' },
              { label: '#dev-team', value: 'dev-team' },
            ],
          },
        ],
      },
      {
        id: 'user_joined',
        name: 'User Joined Channel',
        description: 'Triggers when a user joins a channel',
      },
    ],
    reactions: [
      {
        id: 'send_message',
        name: 'Send Message',
        description: 'Send a message to a channel or user',
        inputs: [
          {
            id: 'channel',
            name: 'Channel',
            type: 'select',
            required: true,
            options: [
              { label: '#general', value: 'general' },
              { label: '#random', value: 'random' },
              { label: '#dev-team', value: 'dev-team' },
            ],
          },
          {
            id: 'message',
            name: 'Message',
            type: 'textarea',
            required: true,
            placeholder: 'Type your message here',
          },
        ],
      },
      {
        id: 'create_channel',
        name: 'Create Channel',
        description: 'Create a new Slack channel',
        inputs: [
          {
            id: 'channel_name',
            name: 'Channel Name',
            type: 'text',
            required: true,
            placeholder: 'new-channel-name',
          },
          {
            id: 'is_private',
            name: 'Private Channel',
            type: 'boolean',
            required: false,
            defaultValue: 'false',
          },
        ],
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'code',
    color: '#24292e',
    description: 'GitHub code repository platform',
    actions: [
      {
        id: 'new_issue',
        name: 'New Issue',
        description: 'Triggers when a new issue is created in a repository',
        inputs: [
          {
            id: 'repository',
            name: 'Repository',
            type: 'text',
            required: true,
            placeholder: 'owner/repository-name',
          },
        ],
      },
      {
        id: 'new_pr',
        name: 'New Pull Request',
        description: 'Triggers when a new pull request is created',
        inputs: [
          {
            id: 'repository',
            name: 'Repository',
            type: 'text',
            required: true,
            placeholder: 'owner/repository-name',
          },
        ],
      },
    ],
    reactions: [
      {
        id: 'create_issue',
        name: 'Create Issue',
        description: 'Create a new GitHub issue',
        inputs: [
          {
            id: 'repository',
            name: 'Repository',
            type: 'text',
            required: true,
            placeholder: 'owner/repository-name',
          },
          {
            id: 'title',
            name: 'Issue Title',
            type: 'text',
            required: true,
            placeholder: 'Issue title',
          },
          {
            id: 'body',
            name: 'Issue Description',
            type: 'textarea',
            required: false,
            placeholder: 'Describe the issue',
          },
        ],
      },
      {
        id: 'add_comment',
        name: 'Add Comment',
        description: 'Add a comment to an issue or pull request',
        inputs: [
          {
            id: 'issue_number',
            name: 'Issue/PR Number',
            type: 'number',
            required: true,
            placeholder: '123',
          },
          {
            id: 'comment',
            name: 'Comment',
            type: 'textarea',
            required: true,
            placeholder: 'Your comment',
          },
        ],
      },
    ],
  },
];

// Mock Credentials
export const mockCredentials: Credential[] = [
  {
    id: 'gmail_cred_1',
    name: 'My Gmail Account (john@example.com)',
    service: 'gmail',
    type: 'OAuth2',
    status: 'connected',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'slack_cred_1',
    name: 'Company Slack Workspace',
    service: 'slack',
    type: 'Bot Token',
    status: 'connected',
    createdAt: '2024-01-10T14:30:00Z',
  },
  {
    id: 'github_cred_1',
    name: 'Personal GitHub Account',
    service: 'github',
    type: 'Personal Access Token',
    status: 'connected',
    createdAt: '2024-01-08T09:15:00Z',
  },
  {
    id: 'gmail_cred_2',
    name: 'Work Gmail (expired)',
    service: 'gmail',
    type: 'OAuth2',
    status: 'expired',
    createdAt: '2023-12-01T12:00:00Z',
  },
];
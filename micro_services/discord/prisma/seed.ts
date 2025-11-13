import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.action.upsert({
    where: { name: 'message_received' },
    update: {
      description: 'Triggered when a message is received in a channel',
      configSchema: {
        parameters: [
          { name: 'channelId', type: 'string', required: false, description: 'Specific channel ID to monitor' },
          { name: 'containsText', type: 'string', required: false, description: 'Filter messages containing specific text' }
        ],
        output: [
          { name: 'messageId', type: 'string', required: true, description: 'Message ID' },
          { name: 'content', type: 'string', required: true, description: 'Message content' },
          { name: 'authorId', type: 'string', required: true, description: 'Author user ID' },
          { name: 'authorName', type: 'string', required: true, description: 'Author username' },
          { name: 'channelId', type: 'string', required: true, description: 'Channel ID' },
          { name: 'guildId', type: 'string', required: false, description: 'Guild/Server ID' },
          { name: 'timestamp', type: 'string', required: true, description: 'Message timestamp' }
        ]
      }
    },
    create: {
      name: 'message_received',
      description: 'Triggered when a message is received in a channel',
      configSchema: {
        parameters: [
          { name: 'channelId', type: 'string', required: false, description: 'Specific channel ID to monitor' },
          { name: 'containsText', type: 'string', required: false, description: 'Filter messages containing specific text' }
        ],
        output: [
          { name: 'messageId', type: 'string', required: true, description: 'Message ID' },
          { name: 'content', type: 'string', required: true, description: 'Message content' },
          { name: 'authorId', type: 'string', required: true, description: 'Author user ID' },
          { name: 'authorName', type: 'string', required: true, description: 'Author username' },
          { name: 'channelId', type: 'string', required: true, description: 'Channel ID' },
          { name: 'guildId', type: 'string', required: false, description: 'Guild/Server ID' },
          { name: 'timestamp', type: 'string', required: true, description: 'Message timestamp' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'member_joined' },
    update: {
      description: 'Triggered when a new member joins a server',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID to monitor' }
        ],
        output: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'username', type: 'string', required: true, description: 'Username' },
          { name: 'discriminator', type: 'string', required: false, description: 'User discriminator' },
          { name: 'guildId', type: 'string', required: true, description: 'Guild ID' },
          { name: 'joinedAt', type: 'string', required: true, description: 'Join timestamp' }
        ]
      }
    },
    create: {
      name: 'member_joined',
      description: 'Triggered when a new member joins a server',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID to monitor' }
        ],
        output: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'username', type: 'string', required: true, description: 'Username' },
          { name: 'discriminator', type: 'string', required: false, description: 'User discriminator' },
          { name: 'guildId', type: 'string', required: true, description: 'Guild ID' },
          { name: 'joinedAt', type: 'string', required: true, description: 'Join timestamp' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'member_left' },
    update: {
      description: 'Triggered when a member leaves a server',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID to monitor' }
        ],
        output: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'username', type: 'string', required: true, description: 'Username' },
          { name: 'guildId', type: 'string', required: true, description: 'Guild ID' },
          { name: 'leftAt', type: 'string', required: true, description: 'Leave timestamp' }
        ]
      }
    },
    create: {
      name: 'member_left',
      description: 'Triggered when a member leaves a server',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID to monitor' }
        ],
        output: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'username', type: 'string', required: true, description: 'Username' },
          { name: 'guildId', type: 'string', required: true, description: 'Guild ID' },
          { name: 'leftAt', type: 'string', required: true, description: 'Leave timestamp' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'role_assigned' },
    update: {
      description: 'Triggered when a role is assigned to a member',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'roleId', type: 'string', required: false, description: 'Specific role ID to monitor' }
        ],
        output: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'username', type: 'string', required: true, description: 'Username' },
          { name: 'roleId', type: 'string', required: true, description: 'Role ID' },
          { name: 'roleName', type: 'string', required: true, description: 'Role name' },
          { name: 'guildId', type: 'string', required: true, description: 'Guild ID' }
        ]
      }
    },
    create: {
      name: 'role_assigned',
      description: 'Triggered when a role is assigned to a member',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'roleId', type: 'string', required: false, description: 'Specific role ID to monitor' }
        ],
        output: [
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'username', type: 'string', required: true, description: 'Username' },
          { name: 'roleId', type: 'string', required: true, description: 'Role ID' },
          { name: 'roleName', type: 'string', required: true, description: 'Role name' },
          { name: 'guildId', type: 'string', required: true, description: 'Guild ID' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'reaction_added' },
    update: {
      description: 'Triggered when a reaction is added to a message',
      configSchema: {
        parameters: [
          { name: 'channelId', type: 'string', required: false, description: 'Specific channel ID' },
          { name: 'emoji', type: 'string', required: false, description: 'Specific emoji to monitor' }
        ],
        output: [
          { name: 'messageId', type: 'string', required: true, description: 'Message ID' },
          { name: 'userId', type: 'string', required: true, description: 'User who reacted' },
          { name: 'emoji', type: 'string', required: true, description: 'Emoji used' },
          { name: 'channelId', type: 'string', required: true, description: 'Channel ID' },
          { name: 'guildId', type: 'string', required: false, description: 'Guild ID' }
        ]
      }
    },
    create: {
      name: 'reaction_added',
      description: 'Triggered when a reaction is added to a message',
      configSchema: {
        parameters: [
          { name: 'channelId', type: 'string', required: false, description: 'Specific channel ID' },
          { name: 'emoji', type: 'string', required: false, description: 'Specific emoji to monitor' }
        ],
        output: [
          { name: 'messageId', type: 'string', required: true, description: 'Message ID' },
          { name: 'userId', type: 'string', required: true, description: 'User who reacted' },
          { name: 'emoji', type: 'string', required: true, description: 'Emoji used' },
          { name: 'channelId', type: 'string', required: true, description: 'Channel ID' },
          { name: 'guildId', type: 'string', required: false, description: 'Guild ID' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'send_message' },
    update: {
      description: 'Send a message to a Discord channel (bot)',
      configSchema: {
        parameters: [
          { name: 'channelId', type: 'string', required: true, description: 'Channel ID' },
          { name: 'content', type: 'string', required: true, description: 'Message content' },
          { name: 'embed', type: 'object', required: false, description: 'Embed object (optional)' }
        ]
      }
    },
    create: {
      name: 'send_message',
      description: 'Send a message to a Discord channel (bot)',
      configSchema: {
        parameters: [
          { name: 'channelId', type: 'string', required: true, description: 'Channel ID' },
          { name: 'content', type: 'string', required: true, description: 'Message content' },
          { name: 'embed', type: 'object', required: false, description: 'Embed object (optional)' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'send_dm' },
    update: {
      description: 'Send a direct message to a user (bot)',
      configSchema: {
        parameters: [
          { name: 'userId', type: 'string', required: false, description: 'User ID (defaults to authenticated user)' },
          { name: 'content', type: 'string', required: true, description: 'Message content' }
        ]
      }
    },
    create: {
      name: 'send_dm',
      description: 'Send a direct message to a user (bot)',
      configSchema: {
        parameters: [
          { name: 'userId', type: 'string', required: false, description: 'User ID (defaults to authenticated user)' },
          { name: 'content', type: 'string', required: true, description: 'Message content' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'add_role' },
    update: {
      description: 'Add a role to a member',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'roleId', type: 'string', required: true, description: 'Role ID to add' }
        ]
      }
    },
    create: {
      name: 'add_role',
      description: 'Add a role to a member',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'roleId', type: 'string', required: true, description: 'Role ID to add' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'remove_role' },
    update: {
      description: 'Remove a role from a member',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'roleId', type: 'string', required: true, description: 'Role ID to remove' }
        ]
      }
    },
    create: {
      name: 'remove_role',
      description: 'Remove a role from a member',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'userId', type: 'string', required: true, description: 'User ID' },
          { name: 'roleId', type: 'string', required: true, description: 'Role ID to remove' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'create_role' },
    update: {
      description: 'Create a new role in a server (bot)',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'name', type: 'string', required: true, description: 'Role name' },
          { name: 'color', type: 'number', required: false, description: 'Role color (decimal)' }
        ]
      }
    },
    create: {
      name: 'create_role',
      description: 'Create a new role in a server (bot)',
      configSchema: {
        parameters: [
          { name: 'guildId', type: 'string', required: true, description: 'Guild/Server ID' },
          { name: 'name', type: 'string', required: true, description: 'Role name' },
          { name: 'color', type: 'number', required: false, description: 'Role color (decimal)' }
        ]
      }
    }
  });

  console.log('Discord seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

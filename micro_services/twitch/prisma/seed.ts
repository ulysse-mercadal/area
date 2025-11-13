import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.action.upsert({
    where: { name: 'stream_started' },
    update: {
      description: 'Triggered when a stream goes live',
      configSchema: {
        parameters: [],
        output: [
          { name: 'streamId', type: 'string', required: true, description: 'Stream ID' },
          { name: 'streamTitle', type: 'string', required: true, description: 'Stream title' },
          { name: 'gameName', type: 'string', required: false, description: 'Game being played' },
          { name: 'viewerCount', type: 'number', required: false, description: 'Current viewer count' }
        ]
      }
    },
    create: {
      name: 'stream_started',
      description: 'Triggered when a stream goes live',
      configSchema: {
        parameters: [],
        output: [
          { name: 'streamId', type: 'string', required: true, description: 'Stream ID' },
          { name: 'streamTitle', type: 'string', required: true, description: 'Stream title' },
          { name: 'gameName', type: 'string', required: false, description: 'Game being played' },
          { name: 'viewerCount', type: 'number', required: false, description: 'Current viewer count' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'stream_ended' },
    update: {
      description: 'Triggered when a stream goes offline',
      configSchema: {
        parameters: [],
        output: [
          { name: 'streamId', type: 'string', required: true, description: 'Stream ID' },
          { name: 'duration', type: 'number', required: false, description: 'Stream duration in seconds' }
        ]
      }
    },
    create: {
      name: 'stream_ended',
      description: 'Triggered when a stream goes offline',
      configSchema: {
        parameters: [],
        output: [
          { name: 'streamId', type: 'string', required: true, description: 'Stream ID' },
          { name: 'duration', type: 'number', required: false, description: 'Stream duration in seconds' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'new_follower' },
    update: {
      description: 'Triggered when someone follows the channel',
      configSchema: {
        parameters: [],
        output: [
          { name: 'followerName', type: 'string', required: true, description: 'Name of the new follower' },
          { name: 'followerId', type: 'string', required: true, description: 'ID of the new follower' },
          { name: 'followedAt', type: 'string', required: true, description: 'Timestamp of follow' }
        ]
      }
    },
    create: {
      name: 'new_follower',
      description: 'Triggered when someone follows the channel',
      configSchema: {
        parameters: [],
        output: [
          { name: 'followerName', type: 'string', required: true, description: 'Name of the new follower' },
          { name: 'followerId', type: 'string', required: true, description: 'ID of the new follower' },
          { name: 'followedAt', type: 'string', required: true, description: 'Timestamp of follow' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'viewer_count_threshold' },
    update: {
      description: 'Triggered when viewer count reaches a threshold',
      configSchema: {
        parameters: [
          { name: 'threshold', type: 'number', required: true, description: 'Viewer count threshold' }
        ],
        output: [
          { name: 'viewerCount', type: 'number', required: true, description: 'Current viewer count' },
          { name: 'streamTitle', type: 'string', required: false, description: 'Stream title' }
        ]
      }
    },
    create: {
      name: 'viewer_count_threshold',
      description: 'Triggered when viewer count reaches a threshold',
      configSchema: {
        parameters: [
          { name: 'threshold', type: 'number', required: true, description: 'Viewer count threshold' }
        ],
        output: [
          { name: 'viewerCount', type: 'number', required: true, description: 'Current viewer count' },
          { name: 'streamTitle', type: 'string', required: false, description: 'Stream title' }
        ]
      }
    }
  });

  // Reactions
  await prisma.reaction.upsert({
    where: { name: 'update_stream_title' },
    update: {
      description: 'Update the stream title',
      configSchema: {
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'New stream title' }
        ]
      }
    },
    create: {
      name: 'update_stream_title',
      description: 'Update the stream title',
      configSchema: {
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'New stream title' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'update_stream_game' },
    update: {
      description: 'Update the game/category being played',
      configSchema: {
        parameters: [
          { name: 'gameName', type: 'string', required: true, description: 'Name of the game' }
        ]
      }
    },
    create: {
      name: 'update_stream_game',
      description: 'Update the game/category being played',
      configSchema: {
        parameters: [
          { name: 'gameName', type: 'string', required: true, description: 'Name of the game' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'send_chat_message' },
    update: {
      description: 'Send a message in chat',
      configSchema: {
        parameters: [
          { name: 'message', type: 'string', required: true, description: 'Message to send' }
        ]
      }
    },
    create: {
      name: 'send_chat_message',
      description: 'Send a message in chat',
      configSchema: {
        parameters: [
          { name: 'message', type: 'string', required: true, description: 'Message to send' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'create_clip' },
    update: {
      description: 'Create a clip of the current stream',
      configSchema: {
        parameters: [
          { name: 'hasDelay', type: 'boolean', required: false, description: 'Include broadcast delay' }
        ]
      }
    },
    create: {
      name: 'create_clip',
      description: 'Create a clip of the current stream',
      configSchema: {
        parameters: [
          { name: 'hasDelay', type: 'boolean', required: false, description: 'Include broadcast delay' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'start_commercial' },
    update: {
      description: 'Start a commercial break',
      configSchema: {
        parameters: [
          { name: 'length', type: 'number', required: true, description: 'Commercial length in seconds (30, 60, 90, 120, 150, 180)' }
        ]
      }
    },
    create: {
      name: 'start_commercial',
      description: 'Start a commercial break',
      configSchema: {
        parameters: [
          { name: 'length', type: 'number', required: true, description: 'Commercial length in seconds (30, 60, 90, 120, 150, 180)' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'create_stream_marker' },
    update: {
      description: 'Create a marker in the stream',
      configSchema: {
        parameters: [
          { name: 'description', type: 'string', required: false, description: 'Marker description' }
        ]
      }
    },
    create: {
      name: 'create_stream_marker',
      description: 'Create a marker in the stream',
      configSchema: {
        parameters: [
          { name: 'description', type: 'string', required: false, description: 'Marker description' }
        ]
      }
    }
  });

  console.log('Twitch seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

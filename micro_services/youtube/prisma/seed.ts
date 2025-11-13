import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main () {
  await prisma.reaction.upsert({
    where: { name: 'get_user_channel' },
    update: {},
    create: {
      name: 'get_user_channel',
      description: 'Get your current Youtube channel',
      configSchema: {
        parameters: []
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'subscribe_channel' },
    update: {},
    create: {
      name: 'subscribe_channel',
      description: 'Subscribe to a Youtube channel with the user\'s account',
      configSchema: {
        parameters: [
          { name: 'channelName', type: 'string', required: true, description: 'Name of the channel' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'unsubscribe_channel' },
    update: {},
    create: {
      name: 'unsubscribe_channel',
      description: 'Unsubscribe_channel to a Youtube channel with the user\'s account',
      configSchema: {
        parameters: [
          { name: 'channelName', type: 'string', required: true, description: 'Name of the channel' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'create_playlist' },
    update: {},
    create: {
      name: 'create_playlist',
      description: 'Create a new playlist on the current user\'s account',
      configSchema: {
        parameters: [
          { name: 'playlistName', type: 'string', required: true, description: 'Name of the playlist' },
          { name: 'playlistDescription', type: 'string', required: true, description: 'Description of the playlist' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'get_user_playlist' },
    update: {},
    create: {
      name: 'get_user_playlist',
      description: 'Get the current user\'s playlists',
      configSchema: {
        parameters: []
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'get_liked_video_from_user_channel' },
    update: {},
    create: {
      name: 'get_liked_video_from_user_channel',
      description: 'Get the user\'s liked video',
      configSchema: {
        parameters: []
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'comment_a_video' },
    update: {},
    create: {
      name: 'comment_a_video',
      description: 'Add a video to the user\'s watch later playlist',
      configSchema: {
        parameters: [
          { name: 'videoName', type: 'string', required: true, description: 'Name of the video to be commented' },
          { name: 'commentContent', type: 'string', required: true, description: 'The content of the comment' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'get_last_video_from_channel' },
    update: {},
    create: {
      name: 'get_last_video_from_channel',
      description: 'Get the last video from a channel',
      configSchema: {
        parameters: [
          { name: 'channelName', type: 'string', required: true, description: 'Name of the channel to get the last video' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'delete_playlist' },
    update: {},
    create: {
      name: 'delete_playlist',
      description: 'Delete a playlist with the user\'s account',
      configSchema: {
        parameters: [
          { name: 'playlistName', type: 'string', required: true, description: 'Name of the playlist to be deleted' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'get_user_subscriptions' },
    update: {},
    create: {
      name: 'get_user_subscriptions',
      description: 'Get the current user\'s subscriptions',
      configSchema: {
        parameters: []
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'search_video' },
    update: {},
    create: {
      name: 'search_video',
      description: 'Search Youtube video information',
      configSchema: {
        parameters: [
          { name: 'videoName', type: 'string', required: true, description: 'Name of the video' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'like_a_video' },
    update: {},
    create: {
      name: 'like_a_video',
      description: 'Like a Youtube video with user\'s profile',
      configSchema: {
        parameters: [
          { name: 'videoName', type: 'string', required: true, description: 'Name of the video' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'unlike_a_video' },
    update: {},
    create: {
      name: 'unlike_a_video',
      description: 'Unlike a Youtube video with user\'s profile',
      configSchema: {
        parameters: [
          { name: 'videoName', type: 'string', required: true, description: 'Name of the video' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'dislike_a_video' },
    update: {},
    create: {
      name: 'dislike_a_video',
      description: 'Dislike a Youtube video with user\'s profile',
      configSchema: {
        parameters: [
          { name: 'videoName', type: 'string', required: true, description: 'Name of the video' },
        ]
      }
    }
  });

  console.log('\u2705 Seeds completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
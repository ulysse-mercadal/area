import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.action.upsert({
    where: { name: 'new_track_played' },
    update: {
      description: 'Triggered when a new track is played',
      configSchema: {
        parameters: [],
        output: [
          { name: 'trackName', type: 'string', required: true, description: 'Name of the played track' },
          { name: 'artistName', type: 'string', required: true, description: 'Name of the artist' },
          { name: 'trackId', type: 'string', required: true, description: 'Spotify track ID' }
        ]
      }
    },
    create: {
      name: 'new_track_played',
      description: 'Triggered when a new track is played',
      configSchema: {
        parameters: [],
        output: [
          { name: 'trackName', type: 'string', required: true, description: 'Name of the played track' },
          { name: 'artistName', type: 'string', required: true, description: 'Name of the artist' },
          { name: 'trackId', type: 'string', required: true, description: 'Spotify track ID' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'new_liked_song' },
    update: {
      description: 'Triggered when a song is added to liked songs',
      configSchema: {
        parameters: [],
        output: [
          { name: 'trackName', type: 'string', required: true, description: 'Name of the liked song' },
          { name: 'artistName', type: 'string', required: true, description: 'Name of the artist' },
          { name: 'trackId', type: 'string', required: true, description: 'Spotify track ID' }
        ]
      }
    },
    create: {
      name: 'new_liked_song',
      description: 'Triggered when a song is added to liked songs',
      configSchema: {
        parameters: [],
        output: [
          { name: 'trackName', type: 'string', required: true, description: 'Name of the liked song' },
          { name: 'artistName', type: 'string', required: true, description: 'Name of the artist' },
          { name: 'trackId', type: 'string', required: true, description: 'Spotify track ID' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'play_music' },
    update: {
      description: 'Play a specific track',
      configSchema: {
        parameters: [
          { name: 'trackName', type: 'string', required: true, description: 'Name of the track to play' }
        ]
      }
    },
    create: {
      name: 'play_music',
      description: 'Play a specific track',
      configSchema: {
        parameters: [
          { name: 'trackName', type: 'string', required: true, description: 'Name of the track to play' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'add_to_playlist' },
    update: {
      description: 'Add a track to a playlist',
      configSchema: {
        parameters: [
          { name: 'playlistName', type: 'string', required: true, description: 'Name of the playlist' },
          { name: 'trackName', type: 'string', required: true, description: 'Name of the track to add' }
        ]
      }
    },
    create: {
      name: 'add_to_playlist',
      description: 'Add a track to a playlist',
      configSchema: {
        parameters: [
          { name: 'playlistName', type: 'string', required: true, description: 'Name of the playlist' },
          { name: 'trackName', type: 'string', required: true, description: 'Name of the track to add' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'create_playlist' },
    update: {
      description: 'Create a new playlist',
      configSchema: {
        parameters: [
          { name: 'playlistName', type: 'string', required: true, description: 'Name of the new playlist' },
          { name: 'description', type: 'string', required: false, description: 'Playlist description' }
        ]
      }
    },
    create: {
      name: 'create_playlist',
      description: 'Create a new playlist',
      configSchema: {
        parameters: [
          { name: 'playlistName', type: 'string', required: true, description: 'Name of the new playlist' },
          { name: 'description', type: 'string', required: false, description: 'Playlist description' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'skip_track' },
    update: {
      description: 'Skip to next track',
      configSchema: {
        parameters: []
      }
    },
    create: {
      name: 'skip_track',
      description: 'Skip to next track',
      configSchema: {
        parameters: []
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'pause_playback' },
    update: {
      description: 'Pause current playback',
      configSchema: {
        parameters: []
      }
    },
    create: {
      name: 'pause_playback',
      description: 'Pause current playback',
      configSchema: {
        parameters: []
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'like_current_track' },
    update: {
      description: 'Add current playing track to liked songs',
      configSchema: {
        parameters: []
      }
    },
    create: {
      name: 'like_current_track',
      description: 'Add current playing track to liked songs',
      configSchema: {
        parameters: []
      }
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

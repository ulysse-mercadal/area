import { Injectable } from '@nestjs/common';

@Injectable()
export class AboutService {
  getAboutData(clientIp: string) {
    const currentTime = Math.floor(Date.now() / 1000);

    return {
      client: {
        host: clientIp,
      },
      server: {
        current_time: currentTime,
        services: [
          {
            name: 'Youtube',
            actions: [
                ],
            reactions: [
              {
                name: 'Get_user_channel',
                description: 'Get informations about the current user\'s channel',
              },
              {
                name: 'Unsubscribe_channel',
                description: 'Unsubscribe_channel to a Youtube channel with the user\'s account',
              },
              {
                name: 'Subscribe_channel',
                description: 'Subscribe to a Youtube channel with the user\'s account',
              },
              {
                name: 'Create_playlist',
                description: 'Create a new playlist on the current user\'s account',
              },
              {
                name: 'Get_user_playlists',
                description: 'Get the current user\'s playlists',
              },
              {
                name: 'Get_liked_video_from_user_channel',
                description: 'Get the user\'s liked video',
              },
              {
                name: 'Comment_a_video',
                description: 'Add a video to the user\'s watch later playlist',
              },
              {
                name: 'Get_last_video_from_channel',
                description: 'Get the last video from a channel',
              },
              {
                name: 'Delete_playlist',
                description: 'Delete a playlist with the user\'s account',
              },
              {
                name: 'Get_user_subscriptions',
                description: 'Get the current user\'s subscriptions',
              },
              {
                name: 'Search_video',
                description: 'Search Youtube video information',
              },
              {
                name: 'Like_a_video',
                description: 'Like a Youtube video with user\'s profile',
              },
              {
                name: 'Unlike_a_video',
                description: 'Unlike a Youtube video with user\'s profile',
              },
              {
                name: 'Dislike_a_video',
                description: 'Dislike a Youtube video with user\'s profile',
              },
            ],
          },
          {
            name: 'Discord',
            actions: [
              {
                name: 'message_received',
                description: 'Triggered when a message is received in a channel',
              },
              {
                name: 'member_joined',
                description: 'Triggered when a new member joins a server',
              },
              {
                name: 'member_left',
                description: 'Triggered when a member leaves a server',
              },
              {
                name: 'role_assigned',
                description: 'Triggered when a role is assigned to a member',
              },
              {
                name: 'reaction_added',
                description: 'Triggered when a reaction is added to a message',
              },
            ],
            reactions: [
              {
                name: 'send_message',
                description: 'Send a message to a Discord channel (bot)',
              },
              {
                name: 'send_dm',
                description: 'Send a direct message to a user (bot)',
              },
              {
                name: 'add_role',
                description: 'Add a role to a member',
              },
              {
                name: 'remove_role',
                description: 'Remove a role from a member',
              },
              {
                name: 'create_role',
                description: 'Create a new role in a server (bot)',
              },
            ],
          },
          {
            name: 'Google_sheet',
            actions: [
              {
                name: 'new_row_added',
                description: 'Triggered when a new row is added to a spreadsheet',
              },
              {
                name: 'spreadsheet_created',
                description: 'Triggered when a new spreadsheet is created',
              },
              {
                name: 'cell_updated',
                description: 'Triggered when a cell value is updated',
              },
            ],
            reactions: [
              {
                name: 'create_spreadsheet',
                description: 'Create a new Google Sheets spreadsheet',
              },              {
                name: 'add_row',
                description: 'Append a new row to a spreadsheet',
              },              {
                name: 'write_in_cell',
                description: 'Update a specific cell value',
              },              {
                name: 'read_in_range',
                description: 'Read data from a specific range',
              },              {
                name: 'create_sheet',
                description: 'Create a new sheet in an existing spreadsheet',
              },              {
                name: 'clear_in_range',
                description: 'Clear data from a specific range',
              },              {
                name: 'duplicate_sheet',
                description: 'Duplicate an entire spreadsheet',
              },              {
                name: 'find_to_replace',
                description: 'Find and replace text in a spreadsheet',
              },              {
                name: 'sort_data_in_range',
                description: 'Sort a range of data',
              },
            ],
          },
          {
            name: 'Spotify',
            actions: [
              {
                name: 'new_track_played',
                description: 'Triggered when a new track is played',
              },
              {
                name: 'new_liked_song',
                description: 'Triggered when a song is added to liked songs',
              },
            ],
            reactions: [
              {
                name: 'play_music',
                description: 'Play a specific track',
              },
              {
                name: 'add_to_playlist',
                description: 'Add a track to a playlist',
              },
              {
                name: 'create_playlist',
                description: 'Create a new playlist',
              },
              {
                name: 'skip_track',
                description: 'Skip to next track',
              },
              {
                name: 'pause_playback',
                description: 'Pause current playback',
              },
              {
                name: 'like_current_track',
                description: 'Add current playing track to liked songs',
              },

            ],
          },
          {
            name: 'Gmail',
            actions: [
              {
                name: 'email_received',
                description: 'Triggered when a new Gmail email is received',
              },
            ],
            reactions: [
              {
                name: 'send_email',
                description: 'Send an email using Gmail',
              },
              {
                name: 'create_draft',
                description: 'Create a draft email in Gmail',
              },
              {
                name: 'add_label',
                description: 'Add a label to a Gmail message',
              },
              {
                name: 'flag_email',
                description: 'Mark a Gmail message as important',
              },
              {
                name: 'reply_email',
                description: 'Reply to a Gmail message',
              },
            ],
          },
          {
            name: 'Twitch',
            actions: [
              {
                name: 'stream_started',
                description: 'Triggered when a stream goes live',
              },
              {
                name: 'stream_ended',
                description: 'Triggered when a stream goes offline',
              },
              {
                name: 'new_follower',
                description: 'Triggered when someone follows the channel',
              },
              {
                name: 'viewer_count_threshold',
                description: 'Triggered when viewer count reaches a threshold',
              },
            ],
            reactions: [
              {
                name: 'update_stream_title',
                description: 'Update the stream title',
              },
              {
                name: 'update_stream_game',
                description: 'Update the game/category being played',
              },
              {
                name: 'send_chat_message',
                description: 'Send a message in chat',
              },
              {
                name: 'create_clip',
                description: 'Create a clip of the current stream',
              },
              {
                name: 'start_commercial',
                description: 'Start a commercial break',
              },
              {
                name: 'create_stream_marker',
                description: 'Create a marker in the stream',
              },
            ],
          },
        ],
      },
    };
  }
}

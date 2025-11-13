import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class youtubeAuthService {
    private clientID: string;
    private clientSecret: string;
    private redirectUrl: string;

    constructor(
        private configService: ConfigService,
        private http: HttpService,
    ) {
        this.clientID = this.configService.get<string>('YOUTUBE_CLIENT_ID', '');
        if (this.clientID === '') throw new Error('youtube client ID undefined');
        this.clientSecret = this.configService.get<string>('YOUTUBE_CLIENT_SECRET', '');
        if (this.clientSecret === '') throw new Error('youtube clientSecret undefined');
        this.redirectUrl = this.configService.get<string>('YOUTUBE_REDIRECT_URI', '');
        if (this.redirectUrl === '') throw new Error('youtube redirectURL undefined');
    }

    getAuthUrl(userId?: string): string {
        const scope = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl';
        const params = new URLSearchParams({
          client_id: this.clientID,
          redirect_uri: this.redirectUrl,
          response_type: 'code',
          access_type: 'offline',
          include_granted_scopes: 'true',
          scope,
          state: userId ?? '',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      }

      async exchangeCodeForToken(code: string) {
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', this.clientID);
        params.append('client_secret', this.clientSecret);
        params.append('redirect_uri', this.redirectUrl);
        params.append('grant_type', 'authorization_code');

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('YouTube token exchange failed:', errText);
          throw new InternalServerErrorException('Failed to exchange code for token');
        }
        return response.json();
      }

      async refreshAccessToken(refreshToken: string) {
        const params = new URLSearchParams();
        params.append('client_id', this.clientID);
        params.append('client_secret', this.clientSecret);
        params.append('refresh_token', refreshToken);
        params.append('grant_type', 'refresh_token');

        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh YouTube token');
        }

        return response.json();
      }

      async getUserSubscriptions(accessToken: string) {
        const response = await firstValueFrom(
          this.http.get('https://www.googleapis.com/youtube/v3/subscriptions', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              part: 'snippet,contentDetails',
              mine: 'true',
              maxResults: 50,
            },
          }),
        );
        return response.data;
      }

      async GetUserSubscriptionsDetailed(token: string) {
        const data = await this.getUserSubscriptions(token);
        if (!data.items || data.items.length === 0) return [];
        const subscriptions = [];

        for (const sub of data.items) {
          const channelId = sub.snippet.resourceId?.channelId;
          const channelData = await firstValueFrom(
            this.http.get('https://www.googleapis.com/youtube/v3/channels', {
              headers: { Authorization: `Bearer ${token}` },
              params: { part: 'statistics,snippet', id: channelId },
            }),
          );
          const item = channelData.data.items[0];
          subscriptions.push({
            name: item.snippet.title,
            description : item.snippet.description,
            subscriberCount: item.statistics.subscriberCount,
          });
        }
        return subscriptions;
      }


      async getUserChannel(accessToken: string) {
        const response = await firstValueFrom(
          this.http.get('https://www.googleapis.com/youtube/v3/channels', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { mine: 'true', part: 'snippet,contentDetails,statistics' },
          })
        );
        return response.data;
      }

      async searchVideos(query: string, accessToken: string) {
        const response = await firstValueFrom(
          this.http.get('https://www.googleapis.com/youtube/v3/search', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { q: query, part: 'snippet', maxResults: 10, type: 'video' },
          })
        );
        return response.data;
      }

    async subscribeChannel(query: string, accessToken: string) {
    await fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                snippet: {
                resourceId: {
                    kind: 'youtube#channel',
                    channelId: query
                },
                },
            }),
            });
    }

    async getUserPlaylists(token: string) {
        const url = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50';

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Failed to get playlists:', errText);
          throw new InternalServerErrorException('Failed to fetch playlists');
        }

        const data = await response.json();
        return data.items.map((playlist: any) => ({
          id: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          itemCount: playlist.contentDetails.itemCount,
        }));
    }

    async getPlaylistId(token: string, playlistName: string): Promise<string | null> {
        const playlists = await this.getUserPlaylists(token); // utilise ta fonction existante
        const playlist = playlists.find(p => p.title === playlistName);
        return playlist ? playlist.id : null;
    }

    async deletePlaylist(token: string, playlistName: string) {
        const playlistId = await this.getPlaylistId(token, playlistName);

        if (!playlistId) {
          throw new Error(`Playlist "${playlistName}" introuvable.`);
        }

        const url = `https://www.googleapis.com/youtube/v3/playlists?id=${playlistId}`;

        const response = await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 204) {
          return { success: true, message: `Playlist "${playlistName}" successfuly deleted` };
        } else {
          const errText = await response.text();
          console.error('Failed to delete playlist :', errText);
          throw new Error('Failed to delete playlist');
        }
    }

    async getLikedVideos(token: string) {
        const url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=20&playlistId=LL';

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const err = await response.text();
          console.error('❌ Failed to get liked videos:', err);
          throw new Error('Failed to get liked videos');
        }

        const data = await response.json();

        return data.items.map((item: any) => ({
          title: item.snippet.title,
          videoId: item.contentDetails.videoId,
          channelTitle: item.snippet.videoOwnerChannelTitle,
          url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
        }));
      }

      async commentVideo(token: string, videoId: string, text: string) {
        const url = 'https://www.googleapis.com/youtube/v3/commentThreads?part=snippet';

        const body = {
          snippet: {
            videoId,
            topLevelComment: {
              snippet: { textOriginal: text },
            },
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const err = await response.text();
          console.error('❌ Failed to post comment:', err);
          throw new Error('Failed to post comment');
        }
        return await response.json();
    }

    async getLatestVideoFromChannel(token: string, channelId: string) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=1&type=video`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const err = await response.text();
          console.error('❌ Failed to get latest video:', err);
          throw new Error('Failed to fetch latest video');
        }

        const data = await response.json();
        const item = data.items?.[0];

        if (!item) return null;

        return {
          videoId: item.id.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        };
      }


    async createPlaylist(token: string, title: string, description: string) {
        const privacyStatus = 'private';
        if (!description)
            description = 'This is my new playlist';
        const url = 'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status';

        const body = {
          snippet: { title, description },
          status: { privacyStatus },
        };
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('Failed to create playlist:', errText);
          throw new InternalServerErrorException('Failed to create playlist');
        }
        const data = await response.json();
        return {
          id: data.id,
          title: data.snippet.title,
          description: data.snippet.description,
          privacyStatus: data.status.privacyStatus,
        };
      }

    async unsubscribeChannel (result: string, token: string) {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/subscriptions?part=id,snippet&forChannelId=${result}&mine=true`,
            {
            headers: { Authorization: `Bearer ${token}` },
            }
        );
        const information = await response.json();

        if (!information.items || information.items.length === 0) {
        console.log(`No subcription found for this channel`);
        return null;
        }
        const subscription = information.items[0].id;

        await fetch(`https://www.googleapis.com/youtube/v3/subscriptions?id=${subscription}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        return
    }


      async searchChannel(query: string, accessToken: string) {
        const response = await firstValueFrom(
          this.http.get('https://www.googleapis.com/youtube/v3/search', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { q: query, part: 'snippet', maxResults: 10, type: 'channel' },
          })
        );
        return response.data;
      }

      async likeVideo(videoId: string, accessToken: string) {
        const url = `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return { success: true, message: ` Video ${videoId} liked successfully` };
      }

      async unlikeVideo(videoId: string, accessToken: string) {
        const url = `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=none`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return { success: true, message: ` Video ${videoId} unliked successfully` };
      }

      async dislikeVideo(videoId: string, accessToken: string) {
        const url = `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=dislike`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return { success: true, message: ` Video ${videoId} disliked successfully` };
      }

}

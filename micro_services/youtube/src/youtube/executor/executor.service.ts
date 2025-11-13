import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { youtubeAuthService } from '../auth/youtube-auth.service';
import { CredentialsService } from '../../credentials/credientials.service';
import { mergeConfigAndInput, resolveValue } from './parameter-resolver';
@Injectable()
export class ExecutorService {
    private readonly logger = new Logger(ExecutorService.name);

    constructor(
        private readonly youtubeAuthService: youtubeAuthService,
        private readonly credentialsService: CredentialsService,
    ) {}

    private async getToken(userId: number): Promise<string> {
        try {
            const credentials = await this.credentialsService.getCredentials(userId);
            if (this.credentialsService.isTokenExpired(credentials)) {
                if (!credentials.refreshToken) {
                    throw new Error('Token expired and no refresh token available');
                }
                const tokenData = await this.youtubeAuthService.refreshAccessToken(
                    credentials.refreshToken
                );
                await this.credentialsService.saveCredentials(
                    userId,
                    tokenData.access_token,
                    tokenData.refresh_token || credentials.refreshToken,
                    tokenData.expires_in,
                );
                return tokenData.access_token;
            }
            return credentials.token;
        } catch (error) {
            this.logger.error(`Failed to get token for user ${userId}: ${error.message}`);
            throw new BadRequestException('User not authenticated with YouTube');
        }
    }

    async executeAction(
        actionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing action: ${actionName}`);
        const accessToken = await this.getToken(userId);
        switch (actionName) {
            case 'new_track_played':
                return input;
            case 'new_liked_song':
                return input;
            default:
                throw new BadRequestException(`Unknown action: ${actionName}`);
        }
    }

    async executeReaction(
        reactionName: string,
        userId: number,
        config: any,
        input: any,
    ): Promise<any> {
        this.logger.log(`Executing reaction: ${reactionName}`);
        this.logger.log(`Config: ${JSON.stringify(config)}`);
        this.logger.log(`Input: ${JSON.stringify(input)}`);
        const accessToken = await this.getToken(userId);
        const params = mergeConfigAndInput(config, input);
        switch (reactionName) {
            case 'get_user_channel':
                return await this.GetUserChannel(accessToken);
            case 'search_video':
                return await this.SearchVideos(accessToken, params);
            case 'get_user_subscriptions':
                return await this.GetUserSubscriptions(accessToken);
            case 'like_a_video':
                return await this.LikeVideo(accessToken, params);
            case 'unlike_a_video':
                return await this.UnlikeVideo(accessToken, params);
            case 'dislike_a_video':
                return await this.DisikeVideo(accessToken, params);
            case 'subscribe_channel':
                return await this.subscribeChannel(accessToken, params);
            case 'unsubscribe_channel':
                return await this.unsubscribeChannel(accessToken, params);
            case 'create_playlist':
                return await this.createPlaylist(accessToken, params);
            case 'get_user_playlist':
                return await this.getPlaylist(accessToken);
            case 'delete_playlist':
                return await this.deletePlaylist(accessToken, params);
            case 'get_liked_video_from_user_channel':
                return await this.getLikedVideo(accessToken);
            case 'comment_a_video':
                return await this.commentVideo(accessToken, params);
            case 'get_last_video_from_channel':
                return await this.getLastVideo(accessToken, params);
            default:
                throw new BadRequestException(`Unknown reaction: ${reactionName}`);
        }
    }

    async GetUserSubscriptions(token: string) {
        const data = await this.youtubeAuthService.GetUserSubscriptionsDetailed(token);
        this.logger.log('User subscriptions:', data);
        if (!data ) {
          return { message: 'No subscriptions found' };
        }
        return data;
      }

    async getPlaylist(token: string) {
        const data = await this.youtubeAuthService.getUserPlaylists(token);
        if (data == null || data == '') {
            console.log('No playlist found for this user');
        }
            console.log(data);
            return data;
    }

    async deletePlaylist(token: string, query:any) {
        const playlistName = query.playlistName || resolveValue('playlist.Name', query);
        const data = await this.youtubeAuthService.deletePlaylist(token, playlistName);
        return;
    }

    async createPlaylist(token: string, query:any) {
        const playlistName = query.playlistName || resolveValue('playlist.Name', query);
        const playlistDescription = query.playlistDescription || resolveValue('playlist.Description', query);
        const data = await this.youtubeAuthService.createPlaylist(token, playlistName, playlistDescription);
        console.log(data);
        return data;
    }

    async commentVideo(token: string, query: any) {
        const videoName = query.videoName || resolveValue('video.Name', query)
        const contentComment = query.commentContent || resolveValue('comment.Content', query);
        const data = await this.GetId(token, videoName);
        const response = await this.youtubeAuthService.commentVideo(token, data, contentComment);
        console.log(response);
    }

    async getLikedVideo(token: string) {
        const response = this.youtubeAuthService.getLikedVideos(token);
        console.log(response);
        return response;
    }

    async getLastVideo(token :string, query: any) {
        const channelName = query.channelName || resolveValue('channel.Name', query);
        const data = await this.youtubeAuthService.searchChannel(channelName, token);
        const channel = data.items[0];
        const result = channel.id?.channelId;
        const response = this.youtubeAuthService.getLatestVideoFromChannel(token, result);
        console.log(response);
        return response;
    }

    async GetUserChannel(token: string) {
        const data = await this.youtubeAuthService.getUserChannel(token);
        if (!data.items || data.items.length === 0) {
          this.logger.warn('No channels found for this user');
          return null;
        }
        const channel = data.items[0];
        const result: any = {
          name: channel.snippet.title,
          description: channel.snippet.description,
          video_count: channel.statistics.videoCount,
          view_count: channel.statistics.viewCount,
        };
        if (!channel.statistics.hiddenSubscriberCount) {
          result.subscriber_count = channel.statistics.subscriberCount;
        }
        return result;
      }

      async SearchVideos(token: string, query: any) {
        const trackName = query.videoName || resolveValue('video.Name', query);
        const data = await this.youtubeAuthService.searchVideos(trackName, token);
        if (!data || !data.items || data.items.length === 0) {
            this.logger.warn(`Aucune vidéo trouvée pour "${trackName}"`);
        return null;
        }

        const video = data.items[0];

        const result = {
            title: video.snippet?.title,
            url: `https://www.youtube.com/watch?v=${video.id?.videoId}`,
            channel: video.snippet?.channelTitle,
        };
        this.logger.log(`Résultat unique pour "${trackName}":`, result);
        return result;
    }

        async GetId(token: string, query: string) {
            const data = await this.youtubeAuthService.searchVideos(query, token);
            if (!data || !data.items || data.items.length === 0) {
                return null;
            }
            const video = data.items[0];
            const result = video.id?.videoId;
            return result;
        }

        async subscribeChannel(token: string, query: any) {
            const channelName = query.channelName || resolveValue('channel.Name', query);
            const data = await this.youtubeAuthService.searchChannel(channelName, token);
            const channel = data.items[0];
            const result = channel.id?.channelId;

            this.youtubeAuthService.subscribeChannel(result, token);
            return;
        }

        async unsubscribeChannel(token: string, query: any) {
            const channelName = query.channelName || resolveValue('channel.Name', query);
            const data = await this.youtubeAuthService.searchChannel(channelName, token);
            const channel = data.items[0];
            const result = channel.id?.channelId;
            this.youtubeAuthService.unsubscribeChannel(result, token);
        }


        async LikeVideo(token: string, query: any) {
            const trackName = query.videoName || resolveValue('video.Name', query);
            const data = await this.GetId(token, trackName);
            const response = await this.youtubeAuthService.likeVideo(data, token);
            return;
        }

        async DisikeVideo(token: string, query: any) {
            const trackName = query.videoName || resolveValue('video.Name', query);
            const data = await this.GetId(token, trackName);
            const response = await this.youtubeAuthService.dislikeVideo(data, token);
            return;
        }

        async UnlikeVideo(token: string, query: any) {
            const trackName = query.videoName || resolveValue('video.Name', query);
            const data = await this.GetId(token, trackName);
            const response = await this.youtubeAuthService.unlikeVideo(data, token);
            return;
        }
}

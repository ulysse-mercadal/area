import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpotifyAuthService {
    private clientID: string;
    private clientSecret: string;
    private redirectUrl: string;

    constructor(
        private configService: ConfigService,
        private http: HttpService,
    ) {
        this.clientID = this.configService.get<string>('SPOTIFY_CLIENT_ID', '');
        if (this.clientID === '') throw new Error('Spotify client ID undefined');
        this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET', '');
        if (this.clientSecret === '') throw new Error('Spotify clientSecret undefined');
        this.redirectUrl = this.configService.get<string>('SPOTIFY_REDIRECT_URI', '');
        if (this.redirectUrl === '') throw new Error('Spotify redirectURL undefined');
    }

    getAuthUrl(userId?: string): string {
        const scope = 'user-read-recently-played user-library-read user-read-email user-library-modify user-read-private user-top-read user-modify-playback-state user-read-playback-state playlist-modify-public playlist-modify-private';
        return (
            `https://accounts.spotify.com/authorize?` +
            `response_type=code&client_id=${this.clientID}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&redirect_uri=${encodeURIComponent(this.redirectUrl)}` +
            (userId ? `&state=${userId}` : '')
        );
    }

    async exchangeCodeForToken(code: string) {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', this.redirectUrl);
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${this.clientID}:${this.clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('Spotify token exchange failed:', errText);
            throw new InternalServerErrorException('Failed to exchange code for token');
        }
        const tokenResponse = await response.json();
        return tokenResponse;
    }


    async refreshAccessToken(refreshToken: string) {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                Authorization:
                    'Basic ' +
                    Buffer.from(`${this.clientID}:${this.clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });
        const text = await response.text();
        if (!response.ok) {
            console.error('Spotify refresh token failed', response.status, text);
            throw new Error('Failed to refresh Spotify token');
        }
        let body: any;
        try {
            body = JSON.parse(text);
        } catch (e) {
            throw new Error('Invalid response from Spotify');
        }
        return {
            access_token: body.access_token,
            refresh_token: body.refresh_token,
            expires_in: body.expires_in,
        };
    }

    async getTopTracks(access_token: string) {
        const response = await firstValueFrom(
            this.http.get('https://api.spotify.com/v1/me/top/tracks', {
                headers: { Authorization: `Bearer ${access_token}` },
            }),
        );
        return response.data;
    }

    async getTopArtists(access_token: string) {
        const response = await firstValueFrom(
            this.http.get('https://api.spotify.com/v1/me/top/artists', {
                headers: { Authorization: `Bearer ${access_token}` }
            })
        );
        return response.data;
    }

    async getUserProfile(accessToken: string) {
        const response = await firstValueFrom(
            this.http.get('https://api.spotify.com/v1/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
        return response.data;
    }

    async getMusic(itemName: string, accessToken: string, artistName?: string) {
        let searchQuery = itemName;
        if (artistName) {
            searchQuery = `track:${itemName} artist:${artistName}`;
        }
        const encoded = encodeURIComponent(searchQuery);
        const response = await firstValueFrom(
            this.http.get(`https://api.spotify.com/v1/search?q=${encoded}&type=track&limit=10`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
        const tracks = response.data?.tracks?.items || [];
        if (tracks.length === 0) {
            throw new Error(`No track found for: ${itemName}`);
        }
        const exactMatch = tracks.find(track =>
            track.name.toLowerCase() === itemName.toLowerCase()
        );
        const selectedTrack = exactMatch || tracks[0];
        return selectedTrack.uri;
    }

    async getPlaylist(itemName: string, accessToken: string) {
        const encoded = encodeURIComponent(itemName);
        const response = await firstValueFrom(
            this.http.get(`https://api.spotify.com/v1/search?q=${encoded}&type=playlist&limit=10`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            }),
        );
        let playlists = response.data.playlists?.items || [];
        playlists = playlists.filter(p => p && p.name);
        if (playlists.length === 0) {
            throw new Error(`Aucune playlist trouvée pour "${itemName}"`);
        }
        const bestMatch = playlists.find(p =>
            p.name.toLowerCase().includes(itemName.toLowerCase()),
        );
        const target = bestMatch || playlists[0];
        return {
            id: target.id,
            name: target.name,
            owner: target.owner.display_name,
            url: target.external_urls.spotify,
        };
    }

    async getAlbum(itemName: string, accessToken: string) {
        const name: string = encodeURIComponent(itemName);
        const response = await firstValueFrom(
            this.http.get(`https://api.spotify.com/v1/search?q=${name}&type=album&limit=1`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
        const uri = response.data?.albums?.items?.[0]?.uri;
        return uri;
    }

    async followPlaylist(playlistId: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.put(`https://api.spotify.com/v1/playlists/${playlistId}/followers`,
                { public: false },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        );
        return response.data;
    }

    async unfollowPlaylist(playlistId: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.delete(`https://api.spotify.com/v1/playlists/${playlistId}/followers`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
        return response.data;
    }

    async getPlayerState(accessToken: string) {
        try {
            const response: any = await firstValueFrom(
                this.http.get('https://api.spotify.com/v1/me/player', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }),
            );

            if (!response.data || !response.data.item) {
                return null;
            }

            return {
                isPlaying: response.data.is_playing,
                trackName: response.data.item?.name ?? 'Unknown',
                artistName: response.data.item?.artists?.[0]?.name ?? 'Unknown',
                progressMs: response.data.progress_ms,
                durationMs: response.data.item.duration_ms,
                trackUri: response.data.item.uri,
            };
        } catch (error) {
            console.error('Error fetching Spotify player state:', error.message);
            return null;
        }
    }

    async skipMusic(accessToken: string) {
        await firstValueFrom(
            this.http.post(`https://api.spotify.com/v1/me/player/next`, null, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
    }

    async pausePlayback(accessToken: string) {
        await firstValueFrom(
            this.http.put('https://api.spotify.com/v1/me/player/pause', {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
    }

    async resumePlayback(accessToken: string) {
        await firstValueFrom(
            this.http.put('https://api.spotify.com/v1/me/player/play', {}, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
    }

    async playTrack(trackUri: string, accessToken: string) {
        await firstValueFrom(
            this.http.put(
                'https://api.spotify.com/v1/me/player/play',
                { uris: [trackUri] },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        );
    }

    async likeTrack(trackId: string, accessToken: string) {
        await firstValueFrom(
            this.http.put(
                `https://api.spotify.com/v1/me/tracks`,
                { ids: [trackId] },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        );
    }

    async unlikeTrack(trackId: string, accessToken: string) {
        await firstValueFrom(
            this.http.delete(`https://api.spotify.com/v1/me/tracks`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                data: { ids: [trackId] }
            })
        );
    }

    async addTracksToPlaylist(playlistId: string, trackUris: string[], accessToken: string) {
        await firstValueFrom(
            this.http.post(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                { uris: trackUris },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        );
    }

    async createPlaylist(userId: string, name: string, description: string, accessToken: string) {
        const response = await firstValueFrom(
            this.http.post(
                `https://api.spotify.com/v1/users/${userId}/playlists`,
                {
                    name,
                    description,
                    public: false,
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        );
        return response.data;
    }

    async getRecentlyLikedTracks(accessToken: string, limit: number = 20) {
        const response = await firstValueFrom(
            this.http.get(`https://api.spotify.com/v1/me/tracks?limit=${limit}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
        return response.data;
    }

    async getRecentlyPlayed(accessToken: string, limit: number = 20) {
        const response = await firstValueFrom(
            this.http.get(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
        );
        return response.data;
    }
}

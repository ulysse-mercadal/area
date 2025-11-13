import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpotifyService {
  private clientID: string;
  private clientSecret: string;
  private redirectUrl: string;
  private serviceId: number | null = null;

  constructor(
    private configService: ConfigService,
    private http: HttpService,
    private prisma: PrismaService
  ) {
    this.clientID = this.configService.get<string>('SPOTIFY_CLIENT_ID', '');
    if (this.clientID === '') throw new Error('Spotify client ID undefined');

    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET', '');
    if (this.clientSecret === '') throw new Error('Spotify clientSecret undefined');

    this.redirectUrl = this.configService.get<string>('SPOTIFY_REDIRECT_URI', '');
    if (this.redirectUrl === '') throw new Error('Spotify redirectURL undefined');

    this.initializeServiceId();
  }

  private async initializeServiceId() {
    try {
      const service = await this.prisma.service.findUnique({
        where: { name: 'SPOTIFY' }
      });
      if (service) {
        this.serviceId = service.id;
      }
    } catch (error) {
      console.error('Failed to initialize Spotify service ID:', error);
    }
  }

  private async getServiceId(): Promise<number> {
    if (this.serviceId !== null) {
      return this.serviceId;
    }
    const service = await this.prisma.service.findUnique({
      where: { name: 'SPOTIFY' }
    });
    if (!service) {
      throw new Error('Spotify service not found in database');
    }
    this.serviceId = service.id;
    return this.serviceId;
  }

  public async addSpotifyToken(
    userId: number,
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ) {
    const serviceId = await this.getServiceId();
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    return this.prisma.credentials.upsert({
      where: {
        userId_serviceId: {
          userId,
          serviceId
        }
      },
      update: {
        token: accessToken,
        refreshToken,
        expiresAt,
        lastUsed: new Date()
      },
      create: {
        userId,
        serviceId,
        token: accessToken,
        refreshToken,
        expiresAt
      }
    });
  }

  async getTokenFromDb(userId: number) {
    const serviceId = await this.getServiceId();

    const credentials = await this.prisma.credentials.findUnique({
      where: {
        userId_serviceId: {
          userId,
          serviceId
        }
      },
      select: {
        token: true,
        refreshToken: true,
        expiresAt: true,
        lastUsed: true
      }
    });

    if (!credentials) {
      throw new Error('No spotify token found for this user');
    }

    return credentials;
  }

  async refreshAccessTokenIfNeeded(userId: number) {
    const creds = await this.getTokenFromDb(userId);
    const now = new Date();
    if (creds.expiresAt && new Date(creds.expiresAt) > now) {
      return creds.token;
    }

    if (!creds.refreshToken) {
      throw new Error('No refresh token available; re-auth required');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', creds.refreshToken);

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
      body = { access_token: undefined };
    }
    await this.addSpotifyToken(userId, body.access_token, body.refresh_token ?? creds.refreshToken, body.expires_in);
    return body.access_token;
  }

  async getValidAccessToken(userId: number) {
    try {
      return await this.refreshAccessTokenIfNeeded(userId);
    } catch (err) {
      throw err;
    }
  }

  getAuthUrl(): string {
    const scope = 'user-read-email user-library-modify user-read-private user-top-read user-modify-playback-state user-read-playback-state playlist-modify-public playlist-modify-private';
    return (
      `https://accounts.spotify.com/authorize?` +
      `response_type=code&client_id=${this.clientID}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUrl)}`
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
    console.debug('Spotify token response keys:', Object.keys(tokenResponse));
    return tokenResponse;
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

  async getMusic(itemName: string, accessToken: string) {
    const name: string = encodeURIComponent(itemName);

    const response = await firstValueFrom(this.http.get(`https://api.spotify.com/v1/search?q=${name}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
    )
    );
    const uri = response.data?.tracks?.items?.[0]?.uri;
    return uri;
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

    const response = await firstValueFrom(this.http.get(`https://api.spotify.com/v1/search?q=${name}&type=album&limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
    )
    );
    const uri = response.data?.albums?.items?.[0]?.uri;
    return uri;
  }

  async followPlaylist(itemName: string, accessToken: string) {
    const name: string = encodeURIComponent(itemName);

    const response = await firstValueFrom(this.http.put(`https://api.spotify.com/v1/playlists/${name}/followers`, { public: false }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
    )
    );
    return response.data;
  }

  async unfollowPlaylist(itemName: string, accessToken: string) {
    const name: string = encodeURIComponent(itemName);

    const response = await firstValueFrom(this.http.delete(`https://api.spotify.com/v1/playlists/${name}/followers`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
    )
    );
    return response.data;
  }

  async getPlayerState(accessToken: string) {
    try {
      const response: any = await firstValueFrom(
        this.http.get('https://api.spotify.com/v1/me/player', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );
      return {
        isPlaying: response.data.is_playing,
        trackName: response.data.item?.name ?? 'Unknown',
        artistName: response.data.item?.artists?.[0]?.name ?? 'Unknown',
        progressMs: response.data.progress_ms,
        durationMs: response.data.item.duration_ms,
      };
    } catch (error) {
      console.error('Error fetching Spotify player state:', error.message);
      return null;
    }
  }

  async skipMusic(accessToken: string) {
    this.http.post(`https://api.spotify.com/v1/me/player/next`, null, { headers: { Authorization: `Bearer ${accessToken}` } })
  }

  async getPlaylists(accessToken: string) {
    const response = await firstValueFrom(
      this.http.get('https://api.spotify.com/v1/playlists', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    );
    return response.data;
  }

  async changeQueueMusic(accessToken: string) {
    const uri = encodeURIComponent('spotify:track:7wNHu6h06KBh20KVYmnRKa?si=5bb2fc7f18f04d03');

    try {
      const response = this.http.post(
        `https://api.spotify.com/v1/me/player/queue?uri=${uri}`,
        null,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    } catch (error) {
      console.error('Error adding track to queue', error);
    }
  }
}

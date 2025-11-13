import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { GmailAuthService } from '../gmail/auth/gmail-auth.service';
import { CredentialsService } from '../credentials/credientials.service';
import { AuthService } from '../auth/auth.service';

interface EmailData {
  historyId: string;
  id: string;
  threadId?: string;
  [key: string]: any;
}

@Injectable()
export class GmailPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GmailPollingService.name);
  private readonly pollInterval = 5000;
  private isPolling = false;
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private lastHistoryIds = new Map<number, string>();
  private processingUsers = new Set<number>();

  constructor(
    private readonly gmailService: GmailAuthService,
    private readonly credentialsService: CredentialsService,
    private readonly authService: AuthService,
  ) {}

  async onModuleInit() {
    this.logger.log('Gmail polling service initialized');
    await this.startPolling();
  }

  onModuleDestroy() {
    this.logger.log('Gmail polling service shutting down');
    this.stopPolling();
  }

  async startPolling() {
    if (this.isPolling) {
      this.logger.warn('Polling already running');
      return;
    }

    this.isPolling = true;
    this.logger.log(
      `Starting Gmail polling (interval: ${this.pollInterval / 1000}s)`,
    );

    await this.pollAllUsers();

    this.pollingIntervalId = setInterval(async () => {
      if (this.isPolling) {
        await this.pollAllUsers();
      }
    }, this.pollInterval);
  }

  stopPolling() {
    this.isPolling = false;

    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    this.logger.log('Polling stopped');
  }

  private async pollAllUsers() {
    try {
      const userIds =
        await this.credentialsService.getAllUsersWithCredentials();

      if (userIds.length === 0) {
        this.logger.debug('No users with credentials to poll');
        return;
      }

      this.logger.debug(`Polling ${userIds.length} user(s) for new emails`);

      const results = await Promise.allSettled(
        userIds.map((userId) => this.checkUserEmails(userId)),
      );

      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        this.logger.warn(
          `${failures.length}/${userIds.length} users failed to poll`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Critical error in pollAllUsers: ${error.message}`,
        error.stack,
      );
    }
  }

  private async checkUserEmails(userId: number) {
    if (this.processingUsers.has(userId)) {
      this.logger.debug(`User ${userId} already being processed, skipping`);
      return;
    }

    this.processingUsers.add(userId);

    try {
      const creds = await this.credentialsService.getCredentials(userId);
      if (!creds) {
        this.logger.warn(`No credentials found for user ${userId}`);
        return;
      }

      let token = creds.token;

      if (
        this.credentialsService.isTokenExpired(creds) &&
        creds.refreshToken
      ) {
        this.logger.debug(`Refreshing expired token for user ${userId}`);

        const newToken = await this.gmailService.refreshAccessToken(
          creds.refreshToken,
        );

        token = newToken.access_token;

        await this.credentialsService.saveCredentials(
          userId,
          newToken.access_token,
          newToken.refresh_token || creds.refreshToken,
          newToken.expires_in,
        );

        creds.token = token;
        if (newToken.refresh_token) {
          creds.refreshToken = newToken.refresh_token;
        }
      }

      const historyId =
        this.lastHistoryIds.get(userId) || creds.lastHistoryId;

      if (!historyId) {
        this.logger.debug(
          `No history ID for user ${userId}, attempting first-time initialization`,
        );

        try {
          const profileHistoryId = await this.gmailService.getProfileHistoryId(
            token,
          );

          if (profileHistoryId) {
            this.lastHistoryIds.set(userId, profileHistoryId);
            await this.credentialsService.updateLastHistoryId(
              userId,
              profileHistoryId,
            );
            this.logger.log(
              `Initialized history ID for user ${userId} to ${profileHistoryId}`,
            );
          } else {
            this.logger.debug(
              `Could not obtain profile history ID for user ${userId}, will retry later`,
            );
          }
        } catch (err) {
          this.logger.error(
            `Failed to initialize history ID for user ${userId}: ${err.message}`,
            err.stack,
          );
        }
        return;
      }

      let newEmails: EmailData[] = [];
      try {
        newEmails = await this.gmailService.getNewEmails(
          userId,
          historyId,
          token,
        );
      } catch (err) {
        const msg = err?.message || err?.response?.data || String(err);
        if (msg && msg.toString().includes('Requested entity was not found')) {
          this.logger.warn(
            `startHistoryId ${historyId} invalid for user ${userId}, reinitializing cursor: ${msg}`,
          );
          try {
            const profileHistoryId = await this.gmailService.getProfileHistoryId(token);
            if (profileHistoryId) {
              this.lastHistoryIds.set(userId, profileHistoryId);
              await this.credentialsService.updateLastHistoryId(userId, profileHistoryId);
              this.logger.log(`Reinitialized history ID for user ${userId} to ${profileHistoryId}`);
            } else {
              this.logger.warn(
                `Could not obtain profile history id for user ${userId} while handling invalid startHistoryId`,
              );
            }
          } catch (innerErr) {
            this.logger.error(
              `Failed to reinitialize history ID for user ${userId}: ${innerErr?.message || innerErr}`,
              innerErr?.stack,
            );
          }
          return;
        }
        throw err;
      }

      if (newEmails.length === 0) {
        this.logger.debug(`No new emails for user ${userId}`);
        return;
      }

      this.logger.log(
        `Found ${newEmails.length} new email(s) for user ${userId}`,
      );

      for (const email of newEmails) {
        try {
          await this.triggerWebhook(userId, 'email_received', email);
        } catch (error) {
          this.logger.error(
            `Failed to process email ${email.id} for user ${userId}: ${error.message}`,
          );
        }
      }

      try {
        const latestBigInt = newEmails.reduce((max, e) => {
          try {
            const hid = e.historyId ? BigInt(e.historyId) : BigInt(0);
            return hid > max ? hid : max;
          } catch {
            return max;
          }
        }, BigInt(0));

        if (latestBigInt > BigInt(0)) {
          const latestHistoryId = latestBigInt.toString();
          this.lastHistoryIds.set(userId, latestHistoryId);

          await this.credentialsService.updateLastHistoryId(
            userId,
            latestHistoryId,
          );

          this.logger.debug(
            `Updated history ID for user ${userId} to ${latestHistoryId}`,
          );
        } else {
          this.logger.warn(
            `Could not determine latest historyId for user ${userId}, not updating cursor`,
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed computing latest historyId for user ${userId}: ${err.message}`,
          err.stack,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error polling emails for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      this.processingUsers.delete(userId);
    }
  }

  private async triggerWebhook(
    userId: number,
    eventType: string,
    data: any,
  ): Promise<void> {
    try {
      await this.authService.triggerWorkflows(eventType, userId, data);
      this.logger.debug(
        `Triggered ${eventType} workflow for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger workflow for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async pollUser(userId: number): Promise<void> {
    this.logger.log(`Manual poll requested for user ${userId}`);
    await this.checkUserEmails(userId);
  }

  getStatus() {
    return {
      isPolling: this.isPolling,
      pollInterval: this.pollInterval,
      trackedUsers: this.lastHistoryIds.size,
      processingUsers: this.processingUsers.size,
    };
  }
}
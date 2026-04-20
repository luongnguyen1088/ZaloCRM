import { logger } from '../../../shared/utils/logger.js';

/**
 * Facebook Graph API helper for sending messages.
 */
export class FacebookApi {
  private pageAccessToken: string;
  private version = 'v19.0';
  private baseUrl = 'https://graph.facebook.com';

  constructor(pageAccessToken: string) {
    this.pageAccessToken = pageAccessToken;
  }

  /**
   * Send a text message to a recipient PSID.
   */
  async sendTextMessage(psid: string, text: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.version}/me/messages?access_token=${this.pageAccessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: psid },
            message: { text },
            messaging_type: 'RESPONSE',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as any;
        logger.error('[facebook-api] Send message error:', errorData?.error || response.statusText);
        throw new Error(errorData?.error?.message || 'Failed to send message via Facebook');
      }

      return await response.json();
    } catch (err: any) {
      logger.error('[facebook-api] Send message exception:', err.message);
      throw err;
    }
  }

  /**
   * Helper to get Page info using the token.
   */
  async getPageInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/${this.version}/me?fields=id,name,picture&access_token=${this.pageAccessToken}`);
      if (!response.ok) throw new Error('Failed to fetch page info');
      return await response.json();
    } catch (err: any) {
      logger.error('[facebook-api] Get Page Info error:', err.message);
      throw err;
    }
  }
}

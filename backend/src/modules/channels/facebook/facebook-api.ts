import axios from 'axios';
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
      const response = await axios.post(
        `${this.baseUrl}/${this.version}/me/messages`,
        {
          recipient: { id: psid },
          message: { text },
          messaging_type: 'RESPONSE',
        },
        {
          params: { access_token: this.pageAccessToken },
        }
      );
      return response.data;
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      logger.error('[facebook-api] Send message error:', errorData || err.message);
      throw new Error(errorData?.message || 'Failed to send message via Facebook');
    }
  }

  /**
   * Helper to get Page info using the token.
   */
  async getPageInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.version}/me`, {
        params: {
          fields: 'id,name,picture',
          access_token: this.pageAccessToken,
        },
      });
      return response.data;
    } catch (err: any) {
      logger.error('[facebook-api] Get Page Info error:', err.message);
      throw err;
    }
  }
}

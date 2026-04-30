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
  async getPageInfo(pageId = 'me') {
    try {
      const response = await fetch(`${this.baseUrl}/${this.version}/${pageId}?fields=id,name,picture&access_token=${this.pageAccessToken}`);
      const data = await response.json() as any;
      if (!response.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch page info');
      }
      return {
        id: data?.id || null,
        name: data?.name || null,
        avatarUrl: data?.picture?.data?.url || null,
      };
    } catch (err: any) {
      logger.error('[facebook-api] Get Page Info error:', err.message);
      throw err;
    }
  }

  /**
   * Resolve a Messenger user's basic profile from a Page-scoped ID.
   */
  async getUserProfile(psid: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.version}/${psid}?fields=first_name,last_name,profile_pic&access_token=${this.pageAccessToken}`
      );
      const data = await response.json() as any;

      if (!response.ok) {
        logger.warn('[facebook-api] Get user profile by PSID failed:', data?.error || response.statusText);
        return null;
      }

      return {
        firstName: data?.first_name || null,
        lastName: data?.last_name || null,
        fullName: [data?.first_name, data?.last_name].filter(Boolean).join(' ').trim() || null,
        avatarUrl: data?.profile_pic || null,
      };
    } catch (err: any) {
      logger.warn('[facebook-api] Get user profile by PSID exception:', err.message);
      return null;
    }
  }

  /**
   * Fallback lookup via message id when PSID profile access is unavailable.
   */
  async getMessageSenderProfile(messageId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.version}/${messageId}?fields=from&access_token=${this.pageAccessToken}`
      );
      const data = await response.json() as any;

      if (!response.ok) {
        logger.warn('[facebook-api] Get user profile by message id failed:', data?.error || response.statusText);
        return null;
      }

      return {
        fullName: data?.from?.name || null,
        avatarUrl: null,
      };
    } catch (err: any) {
      logger.warn('[facebook-api] Get user profile by message id exception:', err.message);
      return null;
    }
  }

  /**
   * Subscribe the current app to receive webhook events from a Page.
   */
  async subscribeAppToPage(pageId: string, subscribedFields = ['messages', 'messaging_postbacks', 'message_reads', 'message_deliveries']) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.version}/${pageId}/subscribed_apps?access_token=${this.pageAccessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscribed_fields: subscribedFields.join(',') }),
        }
      );

      const data = await response.json() as any;
      if (!response.ok || data?.success !== true) {
        logger.error('[facebook-api] Subscribe page webhook error:', data?.error || data || response.statusText);
        throw new Error(data?.error?.message || 'Failed to subscribe app to Facebook Page webhooks');
      }

      return data;
    } catch (err: any) {
      logger.error('[facebook-api] Subscribe page webhook exception:', err.message);
      throw err;
    }
  }
}

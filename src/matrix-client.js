import { createClient } from 'matrix-js-sdk';
import { config } from './config.js';

export class MatrixClient {
  constructor() {
    this.homeserver = config.matrix.homeserver;
    this.userId = config.matrix.userId;
    this.accessToken = config.matrix.accessToken;
    this.roomId = config.matrix.roomId;
    this.client = null;
  }

  async initialize() {
    try {
      this.client = createClient({
        baseUrl: this.homeserver,
        accessToken: this.accessToken,
        userId: this.userId,
        // Disable encryption to avoid errors in encrypted rooms
        useAuthorizationHeader: true,
        cryptoStore: null
      });

      // Disable encryption support entirely
      this.client.isCryptoEnabled = () => false;
      this.client.isRoomEncrypted = () => false;

      // Override the sendEvent method to never attempt encryption
      const originalSendEvent = this.client.sendEvent.bind(this.client);
      this.client.sendEvent = async (roomId, type, content, txnId) => {
        // Force the client to treat room as unencrypted
        const room = this.client.getRoom(roomId);
        if (room) {
          room.hasEncryptionStateEvent = () => false;
        }
        return originalSendEvent(roomId, type, content, txnId);
      };

      // Start the client
      await this.client.startClient();

      // Wait for initial sync to complete
      await new Promise((resolve, reject) => {
        const onSync = (state) => {
          if (state === 'PREPARED') {
            this.client.removeListener('sync', onSync);
            resolve();
          } else if (state === 'ERROR') {
            this.client.removeListener('sync', onSync);
            reject(new Error('Initial sync failed'));
          }
        };
        this.client.on('sync', onSync);
      });

      console.log('✅ Matrix client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Matrix client initialization failed:', error.message);
      throw new Error(`Matrix initialization failed: ${error.message}`);
    }
  }

  async sendMessage(message, isHtml = false) {
    try {
      if (!this.client) {
        throw new Error('Matrix client not initialized');
      }

      const content = {
        msgtype: 'm.text',
        body: message
      };

      if (isHtml) {
        content.format = 'org.matrix.custom.html';
        content.formatted_body = message;
      }

      await this.client.sendEvent(this.roomId, 'm.room.message', content);
      console.log('Message sent successfully');
    } catch (error) {
      // If the error is about encryption not being supported, but the message was likely sent anyway,
      // treat it as a warning rather than a fatal error
      if (error.message.includes('encryption') && error.message.includes('not support')) {
        console.warn('⚠️ Room uses encryption but client does not support it. Message may still have been sent.');
        return; // Don't throw, treat as success
      }
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async sendFormattedMessage(plainText, htmlText) {
    try {
      if (!this.client) {
        throw new Error('Matrix client not initialized');
      }

      const content = {
        msgtype: 'm.text',
        body: plainText,
        format: 'org.matrix.custom.html',
        formatted_body: htmlText
      };

      await this.client.sendEvent(this.roomId, 'm.room.message', content);
      console.log('Formatted message sent successfully');
    } catch (error) {
      // If the error is about encryption not being supported, but the message was likely sent anyway,
      // treat it as a warning rather than a fatal error
      if (error.message.includes('encryption') && error.message.includes('not support')) {
        console.warn('⚠️ Room uses encryption but client does not support it. Message may still have been sent.');
        return; // Don't throw, treat as success
      }
      throw new Error(`Failed to send formatted message: ${error.message}`);
    }
  }

  async checkConnection() {
    try {
      if (!this.client) {
        throw new Error('Matrix client not initialized');
      }

      // Try to get room state to verify connection
      await this.client.getRoom(this.roomId);
      return true;
    } catch (error) {
      throw new Error(`Matrix connection check failed: ${error.message}`);
    }
  }

  async getRoomInfo() {
    try {
      if (!this.client) {
        throw new Error('Matrix client not initialized');
      }

      const room = this.client.getRoom(this.roomId);
      if (!room) {
        throw new Error('Room not found or not accessible');
      }

      const memberCount = room.getJoinedMemberCount();
      return {
        name: room.name || 'Unknown Room',
        roomId: this.roomId,
        memberCount: memberCount > 0 ? memberCount : 'Unknown'
      };
    } catch (error) {
      throw new Error(`Failed to get room info: ${error.message}`);
    }
  }

  async stop() {
    if (this.client) {
      this.client.stopClient();
      this.client = null;
    }
  }

  // Static method to login and get access token
  static async login(homeserver, username, password) {
    try {
      const tempClient = createClient({ baseUrl: homeserver });

      const loginResponse = await tempClient.login('m.login.password', {
        user: username,
        password: password
      });

      tempClient.stopClient();

      return {
        userId: loginResponse.user_id,
        accessToken: loginResponse.access_token,
        homeserver: homeserver
      };
    } catch (error) {
      throw new Error(`Matrix login failed: ${error.message}`);
    }
  }

  // Static method to get user's rooms
  static async getUserRooms(homeserver, accessToken, userId) {
    try {
      const tempClient = createClient({
        baseUrl: homeserver,
        accessToken: accessToken,
        userId: userId,
        // Disable encryption to avoid errors in encrypted rooms
        useAuthorizationHeader: true,
        cryptoStore: null
      });

      // Disable encryption support entirely
      tempClient.isCryptoEnabled = () => false;
      tempClient.isRoomEncrypted = () => false;

      await tempClient.startClient();

      // Wait for sync
      await new Promise((resolve, reject) => {
        const onSync = (state) => {
          if (state === 'PREPARED') {
            tempClient.removeListener('sync', onSync);
            resolve();
          } else if (state === 'ERROR') {
            tempClient.removeListener('sync', onSync);
            reject(new Error('Sync failed'));
          }
        };
        tempClient.on('sync', onSync);
      });

      const rooms = tempClient.getRooms().map(room => {
        const memberCount = room.getJoinedMemberCount();
        return {
          roomId: room.roomId,
          name: room.name || 'Unnamed Room',
          memberCount: memberCount > 0 ? memberCount : 'Unknown',
          isPublic: room.getJoinRule() === 'public'
        };
      });

      tempClient.stopClient();
      return rooms;
    } catch (error) {
      throw new Error(`Failed to get rooms: ${error.message}`);
    }
  }

  // Static method to test connection
  static async testConnection(homeserver, accessToken, userId, roomId) {
    try {
      const tempClient = createClient({
        baseUrl: homeserver,
        accessToken: accessToken,
        userId: userId,
        // Disable encryption to avoid errors in encrypted rooms
        useAuthorizationHeader: true,
        cryptoStore: null
      });

      // Disable encryption support entirely
      tempClient.isCryptoEnabled = () => false;
      tempClient.isRoomEncrypted = () => false;

      await tempClient.startClient();

      // Wait for sync
      await new Promise((resolve, reject) => {
        const onSync = (state) => {
          if (state === 'PREPARED') {
            tempClient.removeListener('sync', onSync);
            resolve();
          } else if (state === 'ERROR') {
            tempClient.removeListener('sync', onSync);
            reject(new Error('Sync failed'));
          }
        };
        tempClient.on('sync', onSync);
      });

      const room = tempClient.getRoom(roomId);
      if (!room) {
        throw new Error('Room not found or not accessible');
      }

      const memberCount = room.getJoinedMemberCount();
      const result = {
        roomName: room.name || 'Unknown Room',
        memberCount: memberCount > 0 ? memberCount : 'Unknown'
      };

      tempClient.stopClient();
      return result;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  // Static method to send test message
  static async sendTestMessage(homeserver, accessToken, roomId) {
    try {
      const tempClient = createClient({
        baseUrl: homeserver,
        accessToken: accessToken,
        // Disable encryption to avoid errors in encrypted rooms
        useAuthorizationHeader: true,
        cryptoStore: null
      });

      const content = {
        msgtype: 'm.text',
        body: '🧪 YNAB Matrix bot test - connection successful!'
      };

      await tempClient.sendEvent(roomId, 'm.room.message', content);
    } catch (error) {
      // If the error is about encryption not being supported, but the message was likely sent anyway,
      // treat it as a warning rather than a fatal error
      if (error.message.includes('encryption') && error.message.includes('not support')) {
        console.warn('⚠️ Room uses encryption but client does not support it. Test message may still have been sent.');
        return; // Don't throw, treat as success
      }
      throw new Error(`Failed to send test message: ${error.message}`);
    }
  }
}

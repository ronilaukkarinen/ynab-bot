#!/usr/bin/env node

import { MatrixClient } from './src/matrix-client.js';
import { config } from './src/config.js';

async function testMatrixMessage() {
  console.log('Testing Matrix message sending...');

  const matrixClient = new MatrixClient();

  try {
    await matrixClient.initialize();
    console.log('✅ Matrix client initialized');

    const testMessage = {
      plain: '🧪 Test message from YNAB bot - if you see this, Matrix messaging is working!',
      html: '<strong>🧪 Test message from YNAB bot</strong> - if you see this, Matrix messaging is working!'
    };

    console.log('Sending test message...');
    await matrixClient.sendFormattedMessage(testMessage.plain, testMessage.html);
    console.log('✅ Message sent successfully!');

    await matrixClient.stop();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testMatrixMessage();

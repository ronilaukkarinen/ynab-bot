#!/usr/bin/env node

import { YnabClient } from './ynab-client.js';
import { MatrixClient } from './matrix-client.js';
import { MessageFormatter } from './message-formatter.js';
import { TransactionMonitor } from './transaction-monitor.js';
import { validateConfig, config } from './config.js';

class YnabMatrixBot {
  constructor() {
    this.running = false;
    this.checkInterval = null;
  }

  async initialize() {
    console.log('🤖 YNAB Matrix bot starting...');

    try {
      // Validate configuration
      validateConfig();
      console.log('✅ Configuration validated');

      // Initialize clients
      this.ynabClient = new YnabClient();
      this.matrixClient = new MatrixClient();
      this.messageFormatter = new MessageFormatter();

      // Initialize Matrix client first
      await this.matrixClient.initialize();
      console.log('✅ Matrix client initialized');

      // Initialize transaction monitor
      this.monitor = new TransactionMonitor(
        this.ynabClient,
        this.matrixClient,
        this.messageFormatter
      );

      await this.monitor.initialize();
      console.log('✅ Transaction monitor initialized');

      // Test connections
      console.log('Testing YNAB connection...');
      await this.ynabClient.getBudgets();
      console.log('✅ YNAB connection successful');

      console.log('Testing Matrix connection...');
      await this.matrixClient.checkConnection();
      console.log('✅ Matrix connection successful');

      console.log('✅ All systems ready');
      return true;

    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      return false;
    }
  }

  async start() {
    if (this.running) {
      console.log('Bot is already running');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      process.exit(1);
    }

    this.running = true;

    // YNAB allows 200 requests/hour, so check every 3 minutes to be safe
    const pollInterval = 3 * 60 * 1000; // 3 minutes
    console.log(`🚀 Bot started! Monitoring every ${pollInterval / 60000} minutes...`);

    this.checkInterval = setInterval(async () => {
      try {
        console.log('🔍 Checking for new transactions...');
        await this.monitor.checkForNewTransactions();
      } catch (error) {
        console.error('❌ Error checking transactions:', error.message);
      }
    }, pollInterval);

    // Do first check immediately (with timeout protection)
    console.log('🔍 Initial check...');
    try {
      await Promise.race([
        this.monitor.checkForNewTransactions(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Initial check timeout')), 30000))
      ]);
      console.log('✅ Initial check complete');
    } catch (error) {
      console.error('❌ Initial check failed:', error.message);
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async shutdown() {
    console.log('\n🛑 Shutting down bot...');
    this.running = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Skip shutdown notification to reduce spam

    // Stop Matrix client
    if (this.matrixClient) {
      await this.matrixClient.stop();
    }

    console.log('✅ Bot shutdown complete');
    process.exit(0);
  }

  async runOnce() {
    const initialized = await this.initialize();
    if (!initialized) {
      process.exit(1);
    }

    console.log('\n🔍 Checking for new transactions...');
    await this.monitor.checkForNewTransactions();

    await this.matrixClient.stop();
    console.log('✅ Single check complete');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

async function main() {
  const bot = new YnabMatrixBot();

  if (args.includes('--once') || args.includes('-o')) {
    await bot.runOnce();
  } else if (args.includes('--test') || args.includes('-t')) {
    const initialized = await bot.initialize();
    if (initialized) {
      console.log('✅ Connection test passed');
    } else {
      process.exit(1);
    }
    await bot.matrixClient.stop();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log('YNAB Matrix bot');
    console.log('');
    console.log('usage:');
    console.log('  npm start           start the bot in continuous mode');
    console.log('  npm start -- --once run a single check and exit');
    console.log('  npm start -- --test test connections and exit');
    console.log('  npm start -- --help show this help message');
    console.log('');
    console.log('The bot monitors YNAB every 3 minutes for new transactions');
    console.log('and sends instant notifications to Matrix when found.');
  } else {
    await bot.start();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TransactionMonitor {
  constructor(ynabClient, matrixClient, messageFormatter) {
    this.ynabClient = ynabClient;
    this.matrixClient = matrixClient;
    this.messageFormatter = messageFormatter;
    this.lastTransactionCount = 0;
    this.knownTransactionIds = new Set();
    
    // Add simple caching for categories to reduce API calls
    this.categoryCache = null;
    this.categoryCacheTime = null;
    this.cacheValidityMinutes = 30; // Cache categories for 30 minutes
    this.stateFile = path.join(__dirname, '..', '.ynab-bot-state.json');
  }

  async initialize() {
    // Load known transaction IDs from persistent storage
    await this.loadState();
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      const state = JSON.parse(data);
      if (state.knownTransactionIds && Array.isArray(state.knownTransactionIds)) {
        this.knownTransactionIds = new Set(state.knownTransactionIds);
        this.lastTransactionCount = state.knownTransactionIds.length;
        console.log(`📂 Loaded ${this.knownTransactionIds.size} known transaction IDs from state`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to load state:', error.message);
      }
      // If file doesn't exist or is invalid, start fresh
      console.log('📂 Starting with fresh state (no previous transaction IDs found)');
    }
  }

  async saveState() {
    try {
      const state = {
        knownTransactionIds: Array.from(this.knownTransactionIds),
        lastSaved: new Date().toISOString()
      };
      await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
      console.log(`💾 Saved ${this.knownTransactionIds.size} known transaction IDs to state`);
    } catch (error) {
      console.error('Failed to save state:', error.message);
    }
  }

  async checkForNewTransactions() {
    try {
      // Get transactions from today only
      const today = new Date().toISOString().split('T')[0];

            console.log(`📅 Fetching transactions since ${today}...`);
      const allTransactions = await this.ynabClient.getTransactions(today);
      console.log(`📊 Got ${allTransactions.length} total transactions`);
      console.log(`🧠 Known transaction IDs: ${this.knownTransactionIds.size}`);

      // Filter out transfers, deleted, uncleared, and automatic/system transactions
      const realTransactions = allTransactions.filter(transaction =>
        !transaction.deleted &&
        !transaction.transfer_account_id &&
        (transaction.cleared === 'cleared' || transaction.cleared === 'reconciled') && // Only post cleared/reconciled transactions
        !transaction.payee_name?.includes('Starting Balance') &&
        !transaction.memo?.includes('Starting Balance') &&
        !transaction.payee_name?.includes('Manual Balance Adjustment') &&
        !transaction.memo?.includes('Closed Account') &&
        !transaction.memo?.includes('Transfer')
      );

      // Sort by date first, then by ID for transactions on the same date (newest first)
      realTransactions.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        // If dates are the same, sort by ID (assuming later IDs = newer)
        return b.id.localeCompare(a.id);
      });

      console.log(`📋 Real transactions after filtering: ${realTransactions.length}`);

            // Initialize baseline on first run (no state loaded)
      if (this.lastTransactionCount === 0 && this.knownTransactionIds.size === 0) {
        realTransactions.forEach(transaction => {
          this.knownTransactionIds.add(transaction.id);
        });
        this.lastTransactionCount = realTransactions.length;
        console.log(`📋 Baseline set: ${realTransactions.length} existing transactions`);
        await this.saveState(); // Save the baseline
        return; // Don't notify about existing transactions
      }

      // Find truly new transactions by ID
      const newTransactions = realTransactions.filter(transaction =>
        !this.knownTransactionIds.has(transaction.id)
      );

      if (newTransactions.length > 0) {
        console.log(`🆕 FOUND ${newTransactions.length} NEW TRANSACTION(S):`);

        newTransactions.forEach((transaction, index) => {
          console.log(`   ${index + 1}. ${transaction.payee_name || transaction.memo || 'Unknown'} - ${Math.abs(transaction.amount / 1000).toFixed(2)} €`);
          console.log(`     ID: ${transaction.id}`);
          console.log(`     Memo: "${transaction.memo || 'NO MEMO'}"`);
        });

        // Invalidate category cache to get fresh budget data
        this.categoryCache = null;
        this.categoryCacheTime = null;
        
        // Try to get category details, but send message even if it fails
        let categoryDetails;
        let message;
        
        try {
          categoryDetails = await this.getCategoryDetailsForTransactions(newTransactions);
          message = this.messageFormatter.formatMultipleTransactions(newTransactions, categoryDetails);
        } catch (categoryError) {
          console.error('⚠️ Failed to fetch category details:', categoryError.message);
          console.log('📨 Sending simplified message without budget details...');
          
          // Create empty category details map as fallback
          categoryDetails = new Map();
          message = this.messageFormatter.formatMultipleTransactions(newTransactions, categoryDetails);
        }
        
        await this.matrixClient.sendFormattedMessage(message.plain, message.html);
        console.log(`✅ Notification sent`);

        // Only save state AFTER successful message sending
        newTransactions.forEach((transaction) => {
          // Add to known IDs
          this.knownTransactionIds.add(transaction.id);
        });

        // Update count
        this.lastTransactionCount = realTransactions.length;

        // Save state after successful notification
        await this.saveState();
      }

    } catch (error) {
      console.error('❌ Error:', error.message);

      // Only send error messages for critical errors, not for minor issues
      const isCriticalError = 
        error.message.includes('Failed to fetch') ||
        error.message.includes('Rate limit exceeded') ||
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('Access denied') ||
        error.message.includes('authentication') ||
        error.message.includes('Matrix initialization failed');

      if (isCriticalError) {
        try {
          const errorMessage = this.messageFormatter.formatErrorMessage(error);
          await this.matrixClient.sendFormattedMessage(errorMessage.plain, errorMessage.html);
        } catch (matrixError) {
          console.error('Failed to send error message to Matrix:', matrixError.message);
        }
      }
    }
  }

  async getCategoryDetailsForTransactions(transactions) {
    const categoryDetails = new Map();

    try {
      // Check if we have cached categories that are still valid
      const now = Date.now();
      const cacheAgeMinutes = this.categoryCacheTime ? (now - this.categoryCacheTime) / (1000 * 60) : Infinity;
      
      let categories;
      if (this.categoryCache && cacheAgeMinutes < this.cacheValidityMinutes) {
        console.log(`📋 Using cached categories (age: ${Math.round(cacheAgeMinutes)}min)`);
        categories = this.categoryCache;
      } else {
        console.log('📋 Fetching fresh categories...');
        categories = await this.ynabClient.getCategories();
        this.categoryCache = categories;
        this.categoryCacheTime = now;
      }

      // Create a map of category_id -> category details with budget info
      categories.forEach(categoryGroup => {
        categoryGroup.categories.forEach(category => {
          const budgeted = (category.budgeted || 0) / 1000;
          const activity = Math.abs((category.activity || 0) / 1000);
          // Use the balance directly from YNAB API instead of calculating
          const balance = (category.balance || 0) / 1000;

          categoryDetails.set(category.id, {
            name: category.name,
            group: categoryGroup.name,
            budgeted: budgeted,
            spent: activity,
            remaining: balance, // Use YNAB's calculated balance
            hasbudget: budgeted > 0
          });
        });
      });

      return categoryDetails;
    } catch (error) {
      console.error('Failed to fetch category details:', error.message);
      return categoryDetails;
    }
  }
}

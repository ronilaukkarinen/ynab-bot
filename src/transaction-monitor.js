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
  }

  async initialize() {
    // Nothing to do
  }

  async checkForNewTransactions() {
    try {
      // Get transactions from today only
      const today = new Date().toISOString().split('T')[0];

            console.log(`📅 Fetching transactions since ${today}...`);
      const allTransactions = await this.ynabClient.getTransactions(today);
      console.log(`📊 Got ${allTransactions.length} total transactions`);
      console.log(`🧠 Known transaction IDs: ${this.knownTransactionIds.size}`);

      // Filter out transfers, deleted, and automatic/system transactions
      const realTransactions = allTransactions.filter(transaction =>
        !transaction.deleted &&
        !transaction.transfer_account_id &&
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

            // Initialize baseline on first run
      if (this.lastTransactionCount === 0) {
        realTransactions.forEach(transaction => {
          this.knownTransactionIds.add(transaction.id);
        });
        this.lastTransactionCount = realTransactions.length;
        console.log(`📋 Baseline set: ${realTransactions.length} existing transactions`);
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

          // Add to known IDs
          this.knownTransactionIds.add(transaction.id);
        });

        // Update count
        this.lastTransactionCount = realTransactions.length;

        // Get category details and send notification
        const categoryDetails = await this.getCategoryDetailsForTransactions(newTransactions);
        const message = this.messageFormatter.formatMultipleTransactions(newTransactions, categoryDetails);
        await this.matrixClient.sendFormattedMessage(message.plain, message.html);

        console.log(`✅ Notification sent`);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);

      try {
        const errorMessage = this.messageFormatter.formatErrorMessage(error);
        await this.matrixClient.sendFormattedMessage(errorMessage.plain, errorMessage.html);
      } catch (matrixError) {
        console.error('Failed to send error message to Matrix:', matrixError.message);
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
          const balance = (category.balance || 0) / 1000;

          categoryDetails.set(category.id, {
            name: category.name,
            group: categoryGroup.name,
            budgeted: budgeted,
            spent: activity,
            remaining: budgeted - activity, // Calculate remaining correctly
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

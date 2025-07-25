import axios from 'axios';
import { config } from './config.js';

export class YnabClient {
  constructor() {
    this.apiUrl = config.ynab.apiUrl;
    this.accessToken = config.ynab.accessToken;
    this.budgetId = config.ynab.budgetId;

    // Rate limiting: YNAB allows 200 requests per hour (3.33/minute)
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.requestCount = 0;
    this.resetTime = Date.now() + 60 * 60 * 1000; // 1 hour from now
    this.maxRequests = 180; // Conservative limit (90% of 200)
    this.requestDelay = 18000; // 18 seconds between requests (200 requests/hour = 1 request per 18s)

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async makeRateLimitedRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      // Reset rate limit counter if an hour has passed
      if (Date.now() > this.resetTime) {
        this.requestCount = 0;
        this.resetTime = Date.now() + 60 * 60 * 1000;
      }

      // Check if we've hit the rate limit
      if (this.requestCount >= this.maxRequests) {
        const waitTime = this.resetTime - Date.now();
        console.log(`Rate limit reached. Waiting ${Math.round(waitTime / 1000)}s before next request.`);
        await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
        this.requestCount = 0;
        this.resetTime = Date.now() + 60 * 60 * 1000;
      }

      const { requestFn, resolve, reject } = this.requestQueue.shift();
      
      try {
        this.requestCount++;
        const result = await this.executeWithRetry(requestFn);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Wait between requests
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
    }

    this.isProcessingQueue = false;
  }

  async executeWithRetry(requestFn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
          console.log(`Rate limited. Retrying in ${retryAfter}s (attempt ${attempt}/${maxRetries})`);
          
          if (attempt === maxRetries) {
            throw new Error('Rate limit exceeded after maximum retries');
          }
          
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff for other errors
        const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Request failed. Retrying in ${backoffTime}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }

  async getBudgets() {
    return this.makeRateLimitedRequest(async () => {
      try {
        const response = await this.client.get('/budgets');
        return response.data.data.budgets;
      } catch (error) {
        throw new Error(`Failed to fetch budgets: ${error.response?.data?.error?.detail || error.message}`);
      }
    });
  }

  async getDefaultBudgetId() {
    if (this.budgetId && this.budgetId !== 'default') {
      return this.budgetId;
    }

    const budgets = await this.getBudgets();
    const defaultBudget = budgets.find(b => b.name && !b.closed);

    if (!defaultBudget) {
      throw new Error('No open budget found');
    }

    this.budgetId = defaultBudget.id;
    return this.budgetId;
  }

  async getTransactions(sinceDate = null) {
    return this.makeRateLimitedRequest(async () => {
      try {
        const budgetId = await this.getDefaultBudgetId();
        let url = `/budgets/${budgetId}/transactions`;

        if (sinceDate) {
          url += `?since_date=${sinceDate}`;
        }

        const response = await this.client.get(url);
        return response.data.data.transactions;
      } catch (error) {
        throw new Error(`Failed to fetch transactions: ${error.response?.data?.error?.detail || error.message}`);
      }
    });
  }

  async getCategories() {
    return this.makeRateLimitedRequest(async () => {
      try {
        const budgetId = await this.getDefaultBudgetId();
        const response = await this.client.get(`/budgets/${budgetId}/categories`);
        return response.data.data.category_groups;
      } catch (error) {
        throw new Error(`Failed to fetch categories: ${error.response?.data?.error?.detail || error.message}`);
      }
    });
  }

  async getBudgetSummary() {
    return this.makeRateLimitedRequest(async () => {
      try {
        const budgetId = await this.getDefaultBudgetId();
        const response = await this.client.get(`/budgets/${budgetId}`);
        return response.data.data.budget;
      } catch (error) {
        throw new Error(`Failed to fetch budget summary: ${error.response?.data?.error?.detail || error.message}`);
      }
    });
  }

  async getCategoryById(categoryId) {
    try {
      const categoryGroups = await this.getCategories();

      for (const group of categoryGroups) {
        const category = group.categories.find(c => c.id === categoryId);
        if (category) {
          return {
            ...category,
            group_name: group.name
          };
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }
  }

  formatCurrency(milliunits) {
    return (milliunits / 1000).toFixed(2);
  }

  calculateCategoryProgress(category) {
    const budgeted = category.budgeted / 1000;
    const activity = category.activity / 1000;
    const balance = category.balance / 1000;

    if (budgeted === 0) {
      return {
        budgeted: 0,
        spent: Math.abs(activity),
        remaining: balance,
        percentage: 0,
        status: 'no-budget'
      };
    }

    const spent = Math.abs(activity);
    // Use the balance directly from YNAB instead of calculating remaining
    const remaining = balance;
    const percentage = Math.round((spent / budgeted) * 100);

    let status = 'good';
    if (percentage >= 100) {
      status = 'over-budget';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    return {
      budgeted,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      status
    };
  }

  async getAccounts() {
    try {
      const response = await this.api.get(`/budgets/${this.budgetId}/accounts`);
      return response.data.data.accounts.filter(account => !account.deleted);
    } catch (error) {
      throw new Error(`Failed to get accounts: ${error.message}`);
    }
  }

  async createTransaction(transaction) {
    try {
      const response = await this.api.post(`/budgets/${this.budgetId}/transactions`, {
        transaction
      });
      return response.data.data.transaction;
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }
}

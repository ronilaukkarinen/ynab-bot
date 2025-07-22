import axios from 'axios';
import { config } from './config.js';

export class YnabClient {
  constructor() {
    this.apiUrl = config.ynab.apiUrl;
    this.accessToken = config.ynab.accessToken;
    this.budgetId = config.ynab.budgetId;

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getBudgets() {
    try {
      const response = await this.client.get('/budgets');
      return response.data.data.budgets;
    } catch (error) {
      throw new Error(`Failed to fetch budgets: ${error.response?.data?.error?.detail || error.message}`);
    }
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
  }

  async getCategories() {
    try {
      const budgetId = await this.getDefaultBudgetId();
      const response = await this.client.get(`/budgets/${budgetId}/categories`);
      return response.data.data.category_groups;
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.response?.data?.error?.detail || error.message}`);
    }
  }

  async getBudgetSummary() {
    try {
      const budgetId = await this.getDefaultBudgetId();
      const response = await this.client.get(`/budgets/${budgetId}`);
      return response.data.data.budget;
    } catch (error) {
      throw new Error(`Failed to fetch budget summary: ${error.response?.data?.error?.detail || error.message}`);
    }
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
      remaining: balance,
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

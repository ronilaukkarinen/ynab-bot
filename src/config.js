import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

export const config = {
  ynab: {
    accessToken: process.env.YNAB_ACCESS_TOKEN,
    budgetId: process.env.YNAB_BUDGET_ID || 'default',
    apiUrl: 'https://api.ynab.com/v1'
  },
  matrix: {
    homeserver: process.env.MATRIX_HOMESERVER || 'https://chat.mementomori.social',
    userId: process.env.MATRIX_USER_ID,
    accessToken: process.env.MATRIX_ACCESS_TOKEN,
    roomId: process.env.MATRIX_ROOM_ID
  },
  bot: {
    pollIntervalSeconds: parseInt(process.env.POLL_INTERVAL_SECONDS) || 30,
    timezone: process.env.TIMEZONE || 'Europe/Helsinki',
    currency: process.env.CURRENCY || 'EUR'
  },
  text: {
    income: process.env.TEXT_INCOME || 'Income',
    expense: process.env.TEXT_EXPENSE || 'Expense',
    payee: process.env.TEXT_PAYEE || 'Payee',
    memo: process.env.TEXT_MEMO || 'Memo',
    date: process.env.TEXT_DATE || 'Date',
    budget: process.env.TEXT_BUDGET || 'Budget',
    spent: process.env.TEXT_SPENT || 'Spent',
    remaining: process.env.TEXT_REMAINING || 'Remaining',
    balance: process.env.TEXT_BALANCE || 'Balance',
    newTransactions: process.env.TEXT_NEW_TRANSACTIONS || 'new transactions',
    totalSpent: process.env.TEXT_TOTAL_SPENT || 'Total spent',
    totalIncome: process.env.TEXT_TOTAL_INCOME || 'Total income',
    byCategory: process.env.TEXT_BY_CATEGORY || 'By category',
    transactionCount: process.env.TEXT_TRANSACTION_COUNT || 'transaction(s)',
    budgetUsed: process.env.TEXT_BUDGET_USED || 'of budget used',
    noBudget: process.env.TEXT_NO_BUDGET || 'No budget set for this category',
    currentBalance: process.env.TEXT_CURRENT_BALANCE || 'Current balance',
    over: process.env.TEXT_OVER || 'over',
    botStarted: process.env.TEXT_BOT_STARTED || 'YNAB signal bot started',
    monitoringTransactions: process.env.TEXT_MONITORING_TRANSACTIONS || 'Monitoring for new transactions every',
    minutes: process.env.TEXT_MINUTES || 'minutes',
    botError: process.env.TEXT_BOT_ERROR || 'YNAB signal bot error',
    failedToFetch: process.env.TEXT_FAILED_TO_FETCH || 'Failed to fetch new transactions',
    testMessage: process.env.TEXT_TEST_MESSAGE || 'YNAB signal bot test message - connection successful',
    shutdownMessage: process.env.TEXT_SHUTDOWN_MESSAGE || 'YNAB signal bot shutting down',
    months: [
      process.env.MONTH_1 || 'Jan',
      process.env.MONTH_2 || 'Feb',
      process.env.MONTH_3 || 'Mar',
      process.env.MONTH_4 || 'Apr',
      process.env.MONTH_5 || 'May',
      process.env.MONTH_6 || 'Jun',
      process.env.MONTH_7 || 'Jul',
      process.env.MONTH_8 || 'Aug',
      process.env.MONTH_9 || 'Sep',
      process.env.MONTH_10 || 'Oct',
      process.env.MONTH_11 || 'Nov',
      process.env.MONTH_12 || 'Dec'
    ]
  }
};

export function validateConfig() {
  const required = [
    'YNAB_ACCESS_TOKEN',
    'MATRIX_USER_ID',
    'MATRIX_ACCESS_TOKEN',
    'MATRIX_ROOM_ID'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}

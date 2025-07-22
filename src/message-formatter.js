import { config } from './config.js';

export class MessageFormatter {
  constructor() {
    this.currency = config.bot.currency;
    this.currencySymbol = this.currency === 'EUR' ? '€' : '$';
    this.text = config.text;
  }

  // Convert markdown-style formatting to HTML for Matrix
  toHtml(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold** -> <strong>bold</strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic* -> <em>italic</em>
      .replace(/`(.*?)`/g, '<code>$1</code>')            // `code` -> <code>code</code>
      .replace(/\n/g, '<br/>');                          // newlines -> <br/>
  }

  formatCurrency(amount) {
    return `${Math.abs(amount).toFixed(2)} ${this.currencySymbol}`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');

    if (transactionDate.getTime() === today.getTime()) {
      return `tänään ${hour}:${minute}:${second}`;
    } else {
      const month = this.text.months[date.getMonth()];
      const day = date.getDate();
      return `${month} ${day}, ${hour}:${minute}`;
    }
  }

  getProgressBar(percentage, width = 10) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'over-budget': return '🚨';
      case 'no-budget': return 'ℹ️';
      default: return '📊';
    }
  }

  formatTransaction(transaction, category, categoryProgress) {
    const amount = Math.abs(transaction.amount / 1000);
    const isInflow = transaction.amount > 0;

        // Main transaction line
    let message = `**${this.formatCurrency(amount)}** ${isInflow ? this.text.income : this.text.expense}, ${this.text.payee}: *${transaction.payee_name || 'Unknown'}*`;

    if (transaction.memo) {
      message += `. Kulu: *${transaction.memo}*`;
    }

    message += '.\n\n';

    if (category && !isInflow) {
      message += `**Budjetin kategoria:** ${category.name} (${category.group})\n`;

      if (category.hasbudget) {
        const percentage = Math.round((category.spent / category.budgeted) * 100);
        const progressBar = this.getProgressBar(percentage);
        const remaining = category.remaining;
        const isOverBudget = percentage > 100;

        message += `└ ${this.text.budget}: ${this.formatCurrency(category.budgeted)} - ${this.text.spent}: ${this.formatCurrency(category.spent)} (${percentage}%)\n`;
        message += `└ ${progressBar} ${this.text.remaining}: ${remaining >= 0 ? this.formatCurrency(remaining) : '-' + this.formatCurrency(Math.abs(remaining))}`;

        if (isOverBudget) {
          message += ' (Huom, budjetoimaton kulu, ylikäytetty)';
        }
      } else {
        message += `└ ${this.text.noBudget}`;
      }
    }

    return {
      plain: message,
      html: this.toHtml(message)
    };
  }

  formatCategoryProgress(category, progress) {
    const statusEmoji = this.getStatusEmoji(progress.status);
    const progressBar = this.getProgressBar(progress.percentage);

    let message = `${statusEmoji} **${category.name}** (${category.group_name})\n`;

    if (progress.status === 'no-budget') {
      message += `└ ${this.text.noBudget}\n`;
      message += `└ ${this.text.currentBalance}: ${this.formatCurrency(progress.remaining)}`;
    } else {
      message += `└ ${this.text.budget}: ${this.formatCurrency(progress.budgeted)}\n`;
      message += `└ ${progressBar} ${this.text.spent}: ${this.formatCurrency(progress.spent)}\n`;
      message += `└ ${this.text.remaining}: ${this.formatCurrency(progress.remaining)}`;

      if (progress.status === 'over-budget') {
        const overage = progress.spent - progress.budgeted;
        message += ` (${this.formatCurrency(overage)} ${this.text.over}!)`;
      }
    }

    return message;
  }

    formatMultipleTransactions(transactions, categoryDetails) {
    if (transactions.length === 1) {
      const transaction = transactions[0];
      const category = categoryDetails.get(transaction.category_id);
      return this.formatTransaction(transaction, category, null);
    }

    // For multiple transactions, format each one separately with the new clean format
    let message = `**${transactions.length} ${this.text.newTransactions}**\n\n`;

    transactions.forEach((transaction, index) => {
      const amount = Math.abs(transaction.amount / 1000);
      const isInflow = transaction.amount > 0;
      const category = categoryDetails.get(transaction.category_id);

      // Transaction line
      message += `**${this.formatCurrency(amount)}** ${isInflow ? this.text.income : this.text.expense}, ${this.text.payee}: *${transaction.payee_name || 'Unknown'}*`;

      if (transaction.memo) {
        message += `. Kulu: *${transaction.memo}*`;
      }

      message += '.\n';

      // Category info
      if (category && !isInflow) {
        message += `**Budjetin kategoria:** ${category.name} (${category.group})\n`;

        if (category.hasbudget) {
          const percentage = Math.round((category.spent / category.budgeted) * 100);
          const progressBar = this.getProgressBar(percentage);
          const remaining = category.remaining;
          const isOverBudget = percentage > 100;

          message += `└ ${this.text.budget}: ${this.formatCurrency(category.budgeted)} - ${this.text.spent}: ${this.formatCurrency(category.spent)} (${percentage}%)\n`;
          message += `└ ${progressBar} ${this.text.remaining}: ${remaining >= 0 ? this.formatCurrency(remaining) : '-' + this.formatCurrency(Math.abs(remaining))}`;

          if (isOverBudget) {
            message += ' (Huom, budjetoimaton kulu, ylikäytetty)';
          }
        } else {
          message += `└ ${this.text.noBudget}`;
        }
      }

      // Add separator between transactions (except last one)
      if (index < transactions.length - 1) {
        message += '\n\n';
      }
    });

    return {
      plain: message,
      html: this.toHtml(message)
    };
  }

  formatStartupMessage() {
    const message = `🤖 ${this.text.botStarted}\n${this.text.monitoringTransactions} 10 sekunnin välein`;
    return {
      plain: message,
      html: this.toHtml(message)
    };
  }

  formatErrorMessage(error) {
    const message = `🚨 ${this.text.botError}: ${error.message}`;
    return {
      plain: message,
      html: this.toHtml(message)
    };
  }

  formatShutdownMessage() {
    const message = `🛑 ${this.text.shutdownMessage}`;
    return {
      plain: message,
      html: this.toHtml(message)
    };
  }
}

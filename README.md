# YNAB Matrix Bot

A Matrix bot that monitors your YNAB (You Need A Budget) transactions and sends real-time notifications to a Matrix room, including budget progress for each category.

## Features

- ⚡ **Near-instant notifications** for new YNAB transactions (10-second monitoring)
- 📊 **Budget progress tracking** with visual progress bars
- 💰 **Income and expense categorization**
- 💬 **Matrix room messaging** with rich formatting
- 🔄 **Smart monitoring** that only checks when needed
- 🛡️ **Secure credential management**

## Prerequisites

Before setting up the bot, you'll need:

1. **YNAB Account** with API access
2. **Matrix Account** (homeserver and bot user)
3. **Node.js** (v22 via nvm)
4. **Linux server** for deployment

## Installation

### 1. Install Node.js via nvm

First, install [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm) if you don't have it already.

```bash
# Install and use the correct Node.js version
nvm install
nvm use

# Verify installation
node --version
```

### 2. Clone and Setup the Bot

```bash
# Clone the repository
git clone https://github.com/ronilaukkarinen/ynab-bot
cd ynab-bot

# Install dependencies
npm install

# Run the interactive setup
npm run setup
```

## Usage

### Running the Bot

The bot monitors YNAB for new manually added transactions and sends instant notifications to Matrix:

```bash
# Start the bot
npm start

# Start in development mode with detailed logging
npm run dev

# Test the connection
npm start -- --test
```

The bot will:
1. Monitor your YNAB budget every 10 seconds for new transactions
2. Send clean, formatted notifications to your Matrix room
3. Include budget progress and category information
4. Only notify about truly new transactions (no spam)

### Bot Commands

```bash
# Test connectivity
npm start -- --test

# Show help
npm start -- --help
```

### Message examples

**Single transaction:**
```
**12.50 €** meno, Saaja: *Starbucks*. Kulu: *Morning coffee*.

**Budjetin kategoria:** Food & Dining (Everyday Expenses)
└ Budjetti: 200.00 € - Käytetty: 156.50 € (78%)
└ ████████░░ Jäljellä: 43.50 €
```

**Multiple transactions:**
```
**2 uutta tapahtumaa**

**12.50 €** meno, Saaja: *Starbucks*. Kulu: *Morning coffee*.

**Budjetin kategoria:** Food & Dining (Everyday Expenses)
└ Budjetti: 200.00 € - Käytetty: 156.50 € (78%)
└ ████████░░ Jäljellä: 43.50 €

**25.00 €** meno, Saaja: *Grocery Store*.

**Budjetin kategoria:** Groceries (Everyday Expenses)
└ Budjetti: 300.00 € - Käytetty: 275.00 € (92%)
└ █████████░ Jäljellä: 25.00 €
```

## Configuration

The bot uses environment variables for configuration. Run `npm run setup` to configure these interactively, or set them manually:

### Required Environment Variables

```bash
# YNAB Configuration
YNAB_ACCESS_TOKEN=your_ynab_token_here

# Matrix Configuration  
MATRIX_HOMESERVER=https://your.homeserver.com
MATRIX_USER_ID=@bot:your.homeserver.com
MATRIX_ACCESS_TOKEN=your_matrix_token_here
MATRIX_ROOM_ID=!roomid:your.homeserver.com

# Bot Configuration
CURRENCY=EUR
TIMEZONE=Europe/Helsinki
```

### Optional Environment Variables

```bash
# Budget ID (leave empty for default budget)
YNAB_BUDGET_ID=your_budget_id_here

# Customizable text (Finnish by default)
TEXT_INCOME=Tulo
TEXT_EXPENSE=Meno
TEXT_PAYEE=Saaja
TEXT_MEMO=Muistiinpano
TEXT_BUDGET=Budjetti
TEXT_SPENT=Käytetty
TEXT_REMAINING=Jäljellä
TEXT_NEW_TRANSACTIONS=uutta tapahtumaa
TEXT_NO_BUDGET=Ei budjettia tälle kategorialle

# Month names (Finnish by default)
MONTH_1=tammi
MONTH_2=helmi
# ... etc
```

## Deployment

### Running as a systemd Service

1. Create a systemd service file:

```bash
sudo nano /etc/systemd/system/ynab-bot.service
```

2. Add the following content:

```ini
[Unit]
Description=YNAB Matrix Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/ynab-bot
ExecStart=/home/your-username/.nvm/versions/node/v22.16.0/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ynab-bot
sudo systemctl start ynab-bot

# Check status
sudo systemctl status ynab-bot

# View logs
journalctl -u ynab-bot -f
```

### Updating the Bot

```bash
cd ynab-bot
git pull origin main
npm install
sudo systemctl restart ynab-bot
```

## Getting API Tokens

### YNAB API Token

1. Go to [YNAB Developer Settings](https://app.ynab.com/settings/developer)
2. Click "New Token"
3. Copy the generated token

### Matrix Access Token

#### Method 1: Using Element (Recommended)

1. Open Element in your browser
2. Go to Settings → Help & About
3. Scroll down to "Advanced" section
4. Click "Access Token" and copy it

#### Method 2: Using curl

```bash
curl -XPOST -d '{"type":"m.login.password", "user":"your_username", "password":"your_password"}' "https://your.homeserver.com/_matrix/client/r0/login"
```

### Getting Room ID

1. In Element, go to the room
2. Click room settings (gear icon)
3. Go to "Advanced" tab
4. Copy the "Internal room ID"

## Troubleshooting

### Common Issues

**Bot not sending notifications:**
- Check that YNAB token is valid
- Verify Matrix credentials
- Ensure the bot user has joined the target room
- Check logs for error messages

**"This room is configured to use encryption" error:**
- The bot automatically handles this - messages should still be sent
- Consider using an unencrypted room for bot notifications

**Connection timeouts:**
- Check your internet connection
- Verify homeserver URL is correct
- Try restarting the bot

### Logs

View detailed logs:
```bash
# If running with npm
npm run dev

# If running as systemd service
journalctl -u ynab-bot -f

# Check recent logs
journalctl -u ynab-bot --since "10 minutes ago"
```

## Development

### Running in Development Mode

```bash
# Install dependencies
npm install

# Run with detailed logging
npm run dev

# Run tests
npm test
```

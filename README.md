# YNAB Matrix Bot

### A Matrix bot that monitors your YNAB (You Need A Budget) transactions and sends real-time notifications to a Matrix room, including budget progress for each category.

![Open WebUI](https://img.shields.io/badge/YNAB-3B5EDA?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTc2IiBoZWlnaHQ9IjU2OCIgdmlld0JveD0iMCAwIDU3NiA1NjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00NjQuNjU5IDI1OS43NjhIMzU5LjQyMUMzNTcuMTg4IDI1OS43NjggMzU0LjQwMiAyNjEuMzEyIDM1My4yNDUgMjYzLjE5OUwyOTAuMTc3IDM2NS44NjlDMjg5LjAyIDM2Ny43NTYgMjg3LjEzNSAzNjcuNzQ2IDI4NS45NzggMzY1Ljg2OUwyMjMuNTc3IDI2My4yMTlDMjIyLjQzIDI2MS4zMzIgMjE5LjY1NCAyNTkuNzc4IDIxNy40MjEgMjU5Ljc3OEgxMTEuNjkyQzEwOS40NTkgMjU5Ljc3OCAxMDguNjM5IDI2MS4yNzIgMTA5Ljg4OSAyNjMuMTA4TDIzNC41NTggNDQ2LjQyNkMyMzUuODA3IDQ0OC4yNTMgMjM2LjgyMSA0NTEuNTYzIDIzNi44MjEgNDUzLjc2M1Y1NjMuODFDMjM2LjgyMSA1NjYuMDExIDIzOC42NTUgNTY3LjgxNyAyNDAuODg4IDU2Ny44MTdIMzM1LjQyMUMzMzcuNjU0IDU2Ny44MTcgMzM5LjQ4OCA1NjYuMDExIDMzOS40ODggNTYzLjgxVjQ1My43NjNDMzM5LjQ4OCA0NTEuNTYzIDM0MC41MTIgNDQ4LjI1MyAzNDEuNzUyIDQ0Ni40MjZMNDY2LjQ1MSAyNjMuMTA4QzQ2Ny43MDEgMjYxLjI4MiA0NjYuODgxIDI1OS43NzggNDY0LjY0OCAyNTkuNzc4TDQ2NC42NTkgMjU5Ljc2OFoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTI4MC45NDIgMTAxLjE2NkMyODMuNjg3IDEwMi42NyAyODYuMzUgMTAzLjg5MSAyODcuNzUzIDEwMy44OTFDMjg5LjE1NiAxMDMuODkxIDI5MS41MTMgMTAzLjA1MyAyOTQuNTQ1IDEwMS4xNjZDMzU0LjE0OSA2My41NTE2IDMwNC41NTIgMTcuMzg5MSAyODcuNzUzIDBDMjcwLjk0NCAxNy4zODkxIDIyMS4zNDcgNjMuNTUxNiAyODAuOTQyIDEwMS4xNjZaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0yMTguMjU1IDIzOC4zODFDMjIxLjY0NiAyMzguMTA4IDIyNC43OSAyMzcuNjM0IDIyNi4wNSAyMzYuNzk2QzIyNy4zMiAyMzUuOTU5IDIyOC45MjkgMjMzLjgxOSAyMzAuNTA2IDIzMC4zMTdDMjYxLjI1NiAxNjEuMTI0IDE4OC40MDcgMTQ4LjkxMiAxNjIuNjU2IDE0My4xOUMxNTguMTE4IDE2OC44MTQgMTQxLjYwNiAyMzkuNzg0IDIxOC4yNTUgMjM4LjM3MVYyMzguMzgxWiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMTIwLjYwNiAyMjMuMjdDMTIzLjQ3NCAyMjEuNDYzIDEyNi4wMjQgMjE5LjYwNiAxMjYuNzUxIDIxOC4yODRDMTI3LjQ3OSAyMTYuOTYyIDEyNy44ODkgMjE0LjMxNyAxMjcuNjIyIDIxMC41MDNDMTIxLjk3OCAxMzUuMTczIDUxLjc4MjIgMTU3LjkyMSAyNi4zMDc2IDE2NC43MzRDMzQuNDYxMSAxODkuNDcgNTMuNTMzOCAyNTkuODI0IDEyMC42MDYgMjIzLjI3VjIyMy4yN1oiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEzMi43NzMgMzQ5LjU3OEMxMzMuOTkyIDM0Ni40NDkgMTM0LjkxNCAzNDMuNDUyIDEzNC42OTggMzQxLjk2OEMxMzQuNDgzIDM0MC40NzUgMTMzLjIxMyAzMzguMTIzIDEzMC43MDQgMzM1LjIwNkM4MC43MTc0IDI3Ny45NDIgMzcuOTkzNSAzMzcuMzQ2IDIxLjYxNDcgMzU3Ljc0M0M0My4wOTQ1IDM3Mi44NjEgMTAwLjg3NiA0MTguMjU2IDEzMi43NjIgMzQ5LjU3OEgxMzIuNzczWiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjg3Ljc0NCAxMjAuMjU2QzI3NC41OTIgMTM0Ljg3OSAyMzUuNzgxIDE3My42NzUgMjgyLjQwOCAyMDUuMjk0QzI4NC41NTkgMjA2LjU1NSAyODYuNjM4IDIwNy41ODUgMjg3Ljc0NCAyMDcuNTg1QzI4OC44NSAyMDcuNTg1IDI5MC42ODQgMjA2Ljg3OCAyOTMuMDYxIDIwNS4yOTRDMzM5LjY5OCAxNzMuNjc1IDMwMC44OTYgMTM0Ljg2OSAyODcuNzQ0IDEyMC4yNTZaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0xNTkuMzYyIDM4MS43NjdDMTU4LjYxNCAzODEuMjUyIDE1Ny4wMjcgMzgwLjg3OCAxNTQuNjYxIDM4MC44NThDMTA3Ljk1MiAzODAuNjY3IDExNS43MjcgNDI0Ljk1MiAxMTcuNjUzIDQ0MC45NThDMTMzLjU1IDQzNy4xNDMgMTc4LjM4NCA0MjguODM4IDE2MS44NzIgMzg1Ljc5NEMxNjEuMDEyIDM4My45NDcgMTYwLjEgMzgyLjI4MSAxNTkuMzUyIDM4MS43NjdIMTU5LjM2MloiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTI4Mi40MDggMzA1LjkzNUMyODQuNTU5IDMwNy4xOTcgMjg2LjYzOCAzMDguMjI2IDI4Ny43NDQgMzA4LjIyNkMyODguODUgMzA4LjIyNiAyOTAuNjg0IDMwNy41MiAyOTMuMDYgMzA1LjkzNUMzMzkuNjk3IDI3NC4zMTYgMzAwLjg5NiAyMzUuNTExIDI4Ny43NDQgMjIwLjg5N0MyNzQuNTkyIDIzNS41MjEgMjM1Ljc4MSAyNzQuMzE2IDI4Mi40MDggMzA1LjkzNVoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTg1LjY0NDggMjgyLjM3MUM4Ny4xMDk2IDI4MC4zNzMgODguMzM4NyAyNzguNDI1IDg4LjQ0MTEgMjc3LjM0NUM4OC41NDM2IDI3Ni4yNjUgODcuOTkwNCAyNzQuMzk4IDg2LjYwNzYgMjcxLjkyNUM1OC44MjgzIDIyMy4zMjEgMTYuMTI0OCAyNTcuOTI3IDAuMTY2MDE2IDI2OS41MjNDMTMuNzY4OCAyODMuNzQzIDQ5LjUxNzcgMzI1LjMwNCA4NS42NTUzIDI4Mi4zNzFIODUuNjQ0OFoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEzMy43MDMgMTQ4LjUzNUMxMzYuMjAyIDE0OC4zNjMgMTM4LjUwNyAxNDguMDQgMTM5LjQwOCAxNDcuNDE0QzE0MC4zMDkgMTQ2Ljc4OSAxNDEuNDE2IDE0NS4xODQgMTQyLjQ1IDE0Mi41NUMxNjIuNDQ1IDkwLjM2MjQgMTA4LjEwNSA4MC4zMTA1IDg4Ljg0ODIgNzUuNjk4MkM4Ni41MTI4IDk1LjA5NTggNzcuMTA5NSAxNDguNzg3IDEzMy43MTMgMTQ4LjUzNUgxMzMuNzAzWiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNMjEwLjI0MiAxMzEuNzUxQzIxMi45OTcgMTMyLjIyNiAyMTUuNTk5IDEzMi40ODggMjE2Ljc1NyAxMzIuMDU0QzIxNy45MTQgMTMxLjYyIDIxOS41NTMgMTMwLjE2NyAyMjEuMzk3IDEyNy41NzNDMjU3LjQ1MiA3Ni4xNTI3IDIwMS4xMTUgNTAuNzUwMiAxODEuNDI4IDQwLjYwNzRDMTczLjU2MSA2MS4wODQ4IDE0OC42MTkgMTE2Ljk1NiAyMTAuMjQyIDEzMS43NTFWMTMxLjc1MVoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTM0OS43MDggMjM2LjgwM0MzNTAuOTc4IDIzNy42NDEgMzU0LjExMiAyMzguMTA1IDM1Ny41MDMgMjM4LjM4OEM0MzQuMTQyIDIzOS44MDEgNDE3LjYzIDE2OC44MzEgNDEzLjEwMyAxNDMuMjA3QzM4Ny4zNTEgMTQ4LjkxOSAzMTQuNTAyIDE2MS4xNDEgMzQ1LjI1MiAyMzAuMzM0QzM0Ni44MyAyMzMuODI2IDM0OC40MzggMjM1Ljk3NiAzNDkuNzA4IDIzNi44MTNWMjM2LjgwM1oiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTQ0OC4xNjYgMjEwLjQ5OEM0NDcuOSAyMTQuMzEzIDQ0OC4zMDkgMjE2Ljk1OCA0NDkuMDM3IDIxOC4yOEM0NDkuNzY0IDIxOS42MDIgNDUyLjMxNCAyMjEuNDY5IDQ1NS4xODIgMjIzLjI2NUM1MjIuMjY0IDI1OS44MSA1NDEuMzM3IDE4OS40NjYgNTQ5LjQ4IDE2NC43M0M1MjQuMDA1IDE1Ny45MjcgNDUzLjgxIDEzNS4xNjkgNDQ4LjE2NiAyMTAuNDk4VjIxMC40OThaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik00NDUuMDM1IDMzNS4yMDZDNDQyLjUyNSAzMzguMTIzIDQ0MS4yNTUgMzQwLjQ4NSA0NDEuMDQgMzQxLjk2OEM0NDAuODI1IDM0My40NTIgNDQxLjc1NiAzNDYuNDQ5IDQ0Mi45NzUgMzQ5LjU3OEM0NzQuODYyIDQxOC4yNTYgNTMyLjY0NCAzNzIuODYxIDU1NC4xMjMgMzU3Ljc0M0M1MzcuNzQ1IDMzNy4zNDYgNDk1LjAzMSAyNzcuOTQyIDQ0NS4wMzUgMzM1LjIwNlYzMzUuMjA2WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNNDIxLjA4OSAzODAuODQxQzQxOC43MjMgMzgwLjg2MSA0MTcuMTM1IDM4MS4yNDUgNDE2LjM4OCAzODEuNzVDNDE1LjY0IDM4Mi4yNTQgNDE0LjcyOCAzODMuOTIgNDEzLjg2OCAzODUuNzc3QzM5Ny4zNjYgNDI4LjgyIDQ0Mi4xOSA0MzcuMTI2IDQ1OC4wODcgNDQwLjk0MUM0NjAuMDEzIDQyNC45NDUgNDY3Ljc4NyAzODAuNjQ5IDQyMS4wNzkgMzgwLjg0MUg0MjEuMDg5WiIgZmlsbD0iI0ZGRkZGRiIvPgo8cGF0aCBkPSJNNDg5LjE1NyAyNzEuOTM1QzQ4Ny43NjQgMjc0LjQwOCA0ODcuMjIxIDI3Ni4yNzUgNDg3LjMyNCAyNzcuMzU1QzQ4Ny40MjYgMjc4LjQzNCA0ODguNjQ1IDI4MC4zODIgNDkwLjEyIDI4Mi4zODFDNTI2LjI1OCAzMjUuMzAzIDU2Mi4wMDYgMjgzLjc1MyA1NzUuNjA5IDI2OS41MzNDNTU5LjY1IDI1Ny45NDcgNTE2Ljk0NyAyMjMuMzQgNDg5LjE2OCAyNzEuOTM1SDQ4OS4xNTdaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik00MzYuMzUxIDE0Ny40MTRDNDM3LjI1MiAxNDguMDMgNDM5LjU1NyAxNDguMzUzIDQ0Mi4wNTYgMTQ4LjUzNUM0OTguNjU5IDE0OC43ODcgNDg5LjI1NyA5NS4wOTU4IDQ4Ni45MjEgNzUuNjk4MkM0NjcuNjY0IDgwLjMxMDUgNDEzLjMxNCA5MC4zNzI1IDQzMy4zMTkgMTQyLjU1QzQzNC4zNDMgMTQ1LjE4NCA0MzUuNDQ5IDE0Ni43OTkgNDM2LjM2MSAxNDcuNDE0SDQzNi4zNTFaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0zNTkuMDA4IDEzMi4wNTRDMzYwLjE2NSAxMzIuNDg4IDM2Mi43NTcgMTMyLjIyNiAzNjUuNTIzIDEzMS43NTFDNDI3LjE0NSAxMTYuOTU2IDQwMi4yMDMgNjEuMDc0NyAzOTQuMzM3IDQwLjYwNzRDMzc0LjY2IDUwLjc1MDIgMzE4LjMyMyA3Ni4xNTI3IDM1NC4zNjggMTI3LjU3M0MzNTYuMjEyIDEzMC4xNjcgMzU3Ljg1IDEzMS42MiAzNTkuMDA4IDEzMi4wNTRWMTMyLjA1NFoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+Cg==) ![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)

## Features

⚡ **Near-instant notifications** for new YNAB transactions (10-second monitoring)<br>
📊 **Budget progress tracking** with visual progress bars<br>
💰 **Income and expense categorization**<br>
💬 **Matrix room messaging** with rich formatting<br>
🔄 **Smart monitoring** that only checks when needed<br>
🛡️ **Secure credential management**

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

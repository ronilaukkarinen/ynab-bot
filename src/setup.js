import readline from 'readline';
import { MatrixClient } from './matrix-client.js';
import { YnabClient } from './ynab-client.js';
import { validateConfig } from './config.js';
import fs from 'fs/promises';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateEnvFile(key, value) {
  try {
    const envPath = '.env';
    const envContent = await fs.readFile(envPath, 'utf-8');

    // Check if key already exists
    const keyRegex = new RegExp(`^${key}=.*$`, 'm');

    let updatedContent;
    if (keyRegex.test(envContent)) {
      // Update existing key
      updatedContent = envContent.replace(keyRegex, `${key}=${value}`);
    } else {
      // Add new key
      updatedContent = envContent + `\n${key}=${value}\n`;
    }

    await fs.writeFile(envPath, updatedContent);
  } catch (error) {
    console.error('Failed to update .env file:', error.message);
  }
}

async function setupMatrix() {
  console.log('\n🏠 Matrix homeserver setup');
  console.log('===========================');

  let homeserver = await question(`Matrix homeserver URL (e.g., https://matrix.org): `);

  if (!homeserver.trim()) {
    console.error('❌ Matrix homeserver URL is required');
    return null;
  }

  // Ensure homeserver starts with https://
  if (!homeserver.startsWith('http://') && !homeserver.startsWith('https://')) {
    homeserver = 'https://' + homeserver;
  }

  console.log(`Using homeserver: ${homeserver}`);
  await updateEnvFile('MATRIX_HOMESERVER', homeserver);

  console.log('\n🤖 Matrix bot user setup');
  console.log('=========================');
  console.log('You can either:');
  console.log('1. Login with existing Matrix account credentials');
  console.log('2. Manually enter bot details (if you already have access token)');

  const setupChoice = await question('Choose option (1 or 2): ');

  if (setupChoice === '1') {
    return await loginWithCredentials(homeserver);
  } else {
    return await manualMatrixSetup(homeserver);
  }
}

async function loginWithCredentials(homeserver) {
  console.log('\n🔐 Matrix login');
  console.log('================');

  const fullUserId = await question('Matrix User ID (e.g., @botname:your.homeserver.com): ');
  const password = await question('Matrix password: ');

  // Extract just the localpart from the full Matrix ID
  if (!fullUserId.startsWith('@') || !fullUserId.includes(':')) {
    console.error('❌ Invalid Matrix User ID format. Must be like @username:domain');
    return null;
  }

  const username = fullUserId.substring(1).split(':')[0];
  console.log(`Extracted username: ${username}`);

  try {
    console.log('Logging in to Matrix...');
    const loginResult = await MatrixClient.login(homeserver, username, password);

    console.log('✅ Login successful!');
    console.log(`User ID: ${loginResult.userId}`);

    // Save to .env
    await updateEnvFile('MATRIX_USER_ID', loginResult.userId);
    await updateEnvFile('MATRIX_ACCESS_TOKEN', loginResult.accessToken);

    console.log('✅ Matrix credentials saved to .env');

    return {
      homeserver,
      userId: loginResult.userId,
      accessToken: loginResult.accessToken
    };

  } catch (error) {
    console.error('❌ Matrix login failed:', error.message);
    console.log('\nTip: Make sure your username and password are correct.');
    console.log('You can also try option 2 to manually enter details.');
    return null;
  }
}

async function manualMatrixSetup(homeserver) {
  console.log('\n📝 Manual Matrix setup');
  console.log('=======================');
  console.log('You need to provide:');
  console.log('1. Bot user ID (e.g., @ynabbot:matrix.org)');
  console.log('2. Access token for the bot user');
  console.log('\nTo get an access token:');
  console.log('1. Login to Element web client with your bot account');
  console.log('2. Go to Settings → Help & About → Advanced');
  console.log('3. Copy the access token');

  const userId = await question('\nMatrix User ID (@username:domain): ');
  const accessToken = await question('Matrix Access Token: ');

  if (!userId.startsWith('@')) {
    console.error('❌ User ID must start with @');
    return null;
  }

  if (!accessToken.trim()) {
    console.error('❌ Access token is required');
    return null;
  }

  // Save to .env
  await updateEnvFile('MATRIX_USER_ID', userId);
  await updateEnvFile('MATRIX_ACCESS_TOKEN', accessToken);

  console.log('✅ Matrix credentials saved to .env');

  return {
    homeserver,
    userId,
    accessToken
  };
}

async function setupMatrixRoom(matrixConfig) {
  console.log('\n🏠 Matrix room setup');
  console.log('====================');

  try {
    console.log('Fetching your Matrix rooms...');
    const rooms = await MatrixClient.getUserRooms(
      matrixConfig.homeserver,
      matrixConfig.accessToken,
      matrixConfig.userId
    );

    if (rooms.length === 0) {
      console.log('No rooms found. You need to:');
      console.log('1. Create a room in your Matrix client');
      console.log('2. Invite the bot user to the room');
      console.log('3. Run this setup again');
      return false;
    }

    console.log('\nAvailable rooms:');
    rooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.name} (${room.memberCount} members)`);
      console.log(`   Room ID: ${room.roomId}`);
    });

    const roomChoice = await question(`\nSelect room (1-${rooms.length}): `);
    const roomIndex = parseInt(roomChoice) - 1;

    if (roomIndex >= 0 && roomIndex < rooms.length) {
      const selectedRoom = rooms[roomIndex];
      console.log(`\n✅ Selected room: ${selectedRoom.name}`);
      console.log(`Room ID: ${selectedRoom.roomId}`);

      await updateEnvFile('MATRIX_ROOM_ID', selectedRoom.roomId);
      console.log('✅ Room ID saved to .env');

      return true;
    } else {
      console.log('❌ Invalid room selection');
      return false;
    }

  } catch (error) {
    console.error('❌ Failed to fetch rooms:', error.message);
    console.log('\nYou can manually set the room ID in .env file:');
    console.log('MATRIX_ROOM_ID=!your_room_id:your_homeserver');
    return false;
  }
}

async function testMatrixConnection(matrixConfig) {
  console.log('\n🧪 Matrix connection test');
  console.log('=========================');

  try {
    // Read the room ID from .env since it was just saved
    const envContent = await fs.readFile('.env', 'utf-8');
    const roomIdMatch = envContent.match(/^MATRIX_ROOM_ID=(.+)$/m);
    const roomId = roomIdMatch ? roomIdMatch[1] : null;

    if (!roomId) {
      throw new Error('Room ID not found in .env file');
    }

    // Test connection using the credentials directly
    const testResult = await MatrixClient.testConnection(
      matrixConfig.homeserver,
      matrixConfig.accessToken,
      matrixConfig.userId,
      roomId
    );

    console.log('✅ Matrix connection successful!');
    console.log(`📍 Room: ${testResult.roomName}`);
    console.log(`👥 Members: ${testResult.memberCount}`);

    console.log('\nSending test message...');
    await MatrixClient.sendTestMessage(
      matrixConfig.homeserver,
      matrixConfig.accessToken,
      roomId
    );
    console.log('✅ Test message sent!');

    return true;
  } catch (error) {
    console.error('❌ Matrix connection test failed:', error.message);
    return false;
  }
}

async function testYnabConnection() {
  console.log('\n💰 YNAB connection test');
  console.log('=======================');

  try {
    const ynabClient = new YnabClient();
    const budgets = await ynabClient.getBudgets();

    console.log('✅ YNAB connection successful!');
    console.log('\nAvailable budgets:');
    budgets.forEach(budget => {
      console.log(`  - ${budget.name} (ID: ${budget.id})`);
    });

    if (budgets.length > 0) {
      let selectedBudget;

      if (budgets.length === 1) {
        selectedBudget = budgets[0];
        console.log(`\n📊 Using budget: ${selectedBudget.name}`);
      } else {
        // Multiple budgets - let user choose
        console.log('\n📊 Budget selection');
        console.log('==================');
        budgets.forEach((budget, index) => {
          const status = budget.closed ? '(closed)' : '(open)';
          console.log(`${index + 1}. ${budget.name} ${status}`);
        });

        const choice = await question(`\nSelect budget (1-${budgets.length}): `);
        const budgetIndex = parseInt(choice) - 1;

        if (budgetIndex >= 0 && budgetIndex < budgets.length) {
          selectedBudget = budgets[budgetIndex];
          console.log(`\n📊 Selected budget: ${selectedBudget.name}`);

          // Update .env with selected budget ID
          await updateEnvFile('YNAB_BUDGET_ID', selectedBudget.id);
          console.log(`✅ Updated .env with YNAB_BUDGET_ID=${selectedBudget.id}`);
        } else {
          console.log('❌ Invalid selection, using first open budget');
          selectedBudget = budgets.find(b => !b.closed) || budgets[0];
        }
      }

      // Test getting recent transactions with selected budget
      if (selectedBudget.id !== ynabClient.budgetId) {
        ynabClient.budgetId = selectedBudget.id;
      }
      const transactions = await ynabClient.getTransactions();
      console.log(`📈 Found ${transactions.length} transactions`);
    }

    return true;
  } catch (error) {
    console.error('❌ YNAB connection failed:', error.message);
    console.log('\nMake sure your YNAB_ACCESS_TOKEN is correct in the .env file.');
    console.log('Get your token from: https://app.ynab.com/settings/developer');
    return false;
  }
}

async function createEnvFromExample() {
  console.log('\n⚙️  Environment setup');
  console.log('====================');

  const envPath = '.env';
  const examplePath = '.env.example';

  try {
    await fs.access(envPath);
    console.log('.env file already exists.');
    return true;
  } catch (error) {
    // .env doesn't exist, create it
  }

  try {
    const exampleContent = await fs.readFile(examplePath, 'utf-8');
    await fs.writeFile(envPath, exampleContent);
    console.log('✅ Created .env file from .env.example');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    return false;
  }
}

async function setupYnabToken() {
  console.log('\n💰 YNAB access token setup');
  console.log('===========================');

  console.log('To get your YNAB access token:');
  console.log('1. Go to https://app.ynab.com/settings/developer');
  console.log('2. Click Generate');
  console.log('3. Enter your password');
  console.log('4. Copy the generated token');

  const token = await question('\nEnter your YNAB access token: ');

  if (!token.trim()) {
    console.error('❌ YNAB access token is required');
    return false;
  }

  await updateEnvFile('YNAB_ACCESS_TOKEN', token);
  console.log('✅ YNAB access token saved to .env');
  return true;
}



async function main() {
  console.log('🤖 YNAB Matrix bot setup');
  console.log('=========================\n');

  // Step 1: Create .env file if it doesn't exist
  const envExists = await createEnvFromExample();
  if (!envExists) {
    rl.close();
    return;
  }

  // Step 2: Setup YNAB token
  const ynabSetup = await setupYnabToken();
  if (!ynabSetup) {
    rl.close();
    return;
  }

  // Step 3: Test YNAB connection and select budget
  const ynabOk = await testYnabConnection();
  if (!ynabOk) {
    rl.close();
    return;
  }

  // Step 4: Setup Matrix
  const matrixConfig = await setupMatrix();
  if (!matrixConfig) {
    rl.close();
    return;
  }

  // Step 5: Setup Matrix room
  const roomOk = await setupMatrixRoom(matrixConfig);
  if (!roomOk) {
    rl.close();
    return;
  }

  // Step 6: Test Matrix connection
  const matrixOk = await testMatrixConnection(matrixConfig);
  if (!matrixOk) {
    rl.close();
    return;
  }

  console.log('\n🎉 Setup complete!');
  console.log('==================');
  console.log('✅ YNAB connection configured');
  console.log('✅ Matrix connection configured');
  console.log('✅ Room configured');
  console.log('\n🚀 Start the bot with: npm start');
  console.log('💡 The bot will monitor YNAB every 10 seconds for new transactions');
  console.log('📱 Add transactions to YNAB and see instant Matrix notifications!');

  rl.close();
}

main().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});

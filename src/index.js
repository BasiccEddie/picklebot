require('dotenv').config();

const mongoose = require('mongoose');
const { Client, GatewayIntentBits } = require('discord.js');

// --- Discord Client (must be created BEFORE requiring events) ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// --- Events (these need "client") ---
require('./events/interactionCreate')(client);
require('./events/messageCreate')(client);
require('./events/voiceStateUpdate')(client);
require('./events/inviteTracker')(client);
// voice XP later:
// require('./events/voiceStateUpdate')(client);

client.once('ready', () => {
  console.log(`🥒 Bot Pickle is online as ${client.user.tag}`);
});

// --- MongoDB Connect ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🥒 Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB error:', err));

// --- Login ---
client.login(process.env.DISCORD_TOKEN);

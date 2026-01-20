require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for warning')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('warn2')
    .setDescription('Final warning before punishment')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to final-warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for final warning')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your rank card')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('View someone else’s rank (optional)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the top XP leaderboard'),

  new SlashCommandBuilder()
    .setName('inviteleaderboard')
    .setDescription('Show top inviters'),
    
    new SlashCommandBuilder()
  .setName('invites')
  .setDescription('Show invite count for you or someone else')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('User to check (optional)')
      .setRequired(false)
  ),
  new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mute a member for a number of hours')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Member to mute')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('hours')
      .setDescription('Mute duration (hours)')
      .setRequired(true)
      .setMinValue(1)
  )
  .addStringOption(option =>
    option.setName('reason')
      .setDescription('Reason for mute')
      .setRequired(true)
  ),

new SlashCommandBuilder()
  .setName('tempban')
  .setDescription('Tempban a member for a number of days')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('Member to tempban')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('days')
      .setDescription('Tempban duration (days)')
      .setRequired(true)
      .setMinValue(1)
  )
  .addStringOption(option =>
    option.setName('reason')
      .setDescription('Reason for tempban')
      .setRequired(true)
  ),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Register commands error:', error);
  }
})();

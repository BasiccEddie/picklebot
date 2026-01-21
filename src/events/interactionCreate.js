const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

const config = require('../config');
const { isStaff } = require('../utils/permissions');
const Punishment = require('../models/Punishment');
const User = require('../models/User');
const { xpNeeded, getNextLevelXp } = require('../utils/xpCalc');
const { generateRankCard } = require('../utils/rankCard');
const InviteStats = require('../models/InviteStats');

module.exports = (client) => {
  client.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.isChatInputCommand()) return;

      /* =====================
         /warn (first warning)
      ====================== */
      if (interaction.commandName === 'warn') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '🚫 You do not have permission to use this command.',
            ephemeral: true
          });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const sourRole = interaction.guild.roles.cache.get(config.roles.SOUR_PICKLE);
        if (sourRole && member) {
          await member.roles.add(sourRole).catch(() => null);
        }

        const generalChannel = interaction.guild.channels.cache.get(config.channels.GENERAL);
        if (generalChannel) {
          await generalChannel
            .send(`⚠️ ${user} You have been warned because of **${reason}**, and you have received the **Sour Pickle** role!`)
            .catch(() => null);
        }

        const logEmbed = new EmbedBuilder()
          .setTitle('⚠️ Warning Issued')
          .setColor(0xffcc00)
          .addFields(
            { name: 'User', value: `${user.tag} (${user.id})` },
            { name: 'Reason', value: reason },
            { name: 'Staff', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Role Given', value: 'Sour Pickle' }
          )
          .setTimestamp();

        const modLogs = interaction.guild.channels.cache.get(config.channels.MOD_LOGS);
        if (modLogs) {
          await modLogs.send({ embeds: [logEmbed] }).catch(() => null);
        }

        return interaction.reply({
          content: `✅ Warning issued to ${user.tag}`,
          ephemeral: true
        });
      }

      /* =====================
         /warn2 (final warning)
      ====================== */
      if (interaction.commandName === 'warn2') {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: '🚫 You do not have permission to use this command.',
            ephemeral: true
          });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const rottenRole = interaction.guild.roles.cache.get(config.roles.ROTTEN_PICKLE);
        if (rottenRole && member) {
          await member.roles.add(rottenRole).catch(() => null);
        }

        const generalChannel = interaction.guild.channels.cache.get(config.channels.GENERAL);
        if (generalChannel) {
          await generalChannel
            .send(
              `🚨 ${user} You have received your **FINAL WARNING** because of **${reason}**.\n` +
              `You have now been given the **Rotten Pickle** role.\n` +
              `**Next violation will result in a mute or tempban.**`
            )
            .catch(() => null);
        }

        const logEmbed = new EmbedBuilder()
          .setTitle('🚨 Final Warning Issued')
          .setColor(0xff0000)
          .addFields(
            { name: 'User', value: `${user.tag} (${user.id})` },
            { name: 'Reason', value: reason },
            { name: 'Staff', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Role Given', value: 'Rotten Pickle' }
          )
          .setTimestamp();

        const modLogs = interaction.guild.channels.cache.get(config.channels.MOD_LOGS);
        if (modLogs) {
          await modLogs.send({ embeds: [logEmbed] }).catch(() => null);
        }

        return interaction.reply({
          content: `✅ Final warning issued to ${user.tag}`,
          ephemeral: true
        });
      }

      /* =====================
         /rank (rank card image)
         Uses XP into-level progress based on your XP table
      ====================== */
      if (interaction.commandName === 'rank') {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;

        let userData = await User.findOne({
          userId: targetUser.id,
          guildId: interaction.guild.id
        });

        if (!userData) {
          userData = new User({
            userId: targetUser.id,
            guildId: interaction.guild.id,
            xp: 0,
            level: 0
          });
          await userData.save();
        }

        const currentLevel = userData.level || 0;
        const totalXp = userData.xp || 0;

        const currentLevelTotalXp = currentLevel > 0 ? (xpNeeded(currentLevel) ?? 0) : 0;
        const nextLevelTotalXp = getNextLevelXp(currentLevel); // null if maxed / not defined

        const xpIntoLevel = Math.max(0, totalXp - currentLevelTotalXp);
        const xpThisLevelNeeded = nextLevelTotalXp
          ? Math.max(1, nextLevelTotalXp - currentLevelTotalXp)
          : 1;

        // If maxed (no next level), show a full bar
        const xpForCard = nextLevelTotalXp ? xpIntoLevel : xpThisLevelNeeded;

        const avatarURL = targetUser.displayAvatarURL({ extension: 'png', size: 256 });

        const buffer = await generateRankCard({
          username: targetUser.username,
          discriminator: targetUser.discriminator,
          avatarURL,
          level: currentLevel,
          xp: xpForCard,
          xpNext: xpThisLevelNeeded
        });

        const attachment = new AttachmentBuilder(buffer, { name: 'rank.png' });
        return interaction.editReply({ files: [attachment] });
      }

      /* =====================
         /leaderboard (top XP)
      ====================== */
      if (interaction.commandName === 'leaderboard') {
        await interaction.deferReply();

        const top = await User.find({ guildId: interaction.guild.id })
          .sort({ xp: -1 })
          .limit(10);

        if (!top.length) {
          return interaction.editReply('No leaderboard data yet. Start chatting to earn XP! 🥒');
        }

        const lines = top.map((u, i) =>
          `**${i + 1}.** <@${u.userId}> — Level **${u.level || 0}** | XP **${u.xp || 0}**`
        );

        const embed = new EmbedBuilder()
          .setTitle('🏆 Pickle Leaderboard')
          .setColor(0x2ecc71)
          .setDescription(lines.join('\n'))
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      /* =====================
         /inviteleaderboard (top inviters)
      ====================== */
      if (interaction.commandName === 'inviteleaderboard') {
        await interaction.deferReply();

        const top = await InviteStats.find({ guildId: interaction.guild.id })
          .sort({ invites: -1 })
          .limit(10);

        if (!top.length) {
          return interaction.editReply('No invite stats yet. 🥒');
        }

        const lines = top.map((row, i) =>
          `**${i + 1}.** <@${row.inviterId}> — **${row.invites}** invites`
        );

        const embed = new EmbedBuilder()
          .setTitle('🏆 Invite Leaderboard')
          .setColor(0x2ecc71)
          .setDescription(lines.join('\n'))
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      /* =====================
         /invites (check invites)
      ====================== */
      if (interaction.commandName === 'invites') {
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user') || interaction.user;

        const stats = await InviteStats.findOne({
          guildId: interaction.guild.id,
          inviterId: targetUser.id
        });

        const count = stats?.invites ?? 0;

        const embed = new EmbedBuilder()
          .setTitle('📨 Invite Stats')
          .setColor(0x2ecc71)
          .setDescription(`${targetUser} has **${count}** total invited joins.`)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

    } catch (err) {
      console.error('❌ interactionCreate error:', err);
      if (interaction.commandName === 'mute') {
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: '🚫 You do not have permission to use this command.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const user = interaction.options.getUser('user');
  const hours = interaction.options.getInteger('hours');
  const reason = interaction.options.getString('reason');

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.editReply('❌ Could not find that member in this server.');

  const mutedRoleId = '1462597488900050974';

  await member.roles.add(mutedRoleId).catch(() => null);

  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await Punishment.findOneAndUpdate(
    { guildId: interaction.guild.id, userId: user.id, type: 'MUTE' },
    {
      guildId: interaction.guild.id,
      userId: user.id,
      type: 'MUTE',
      roleId: mutedRoleId,
      reason,
      staffId: interaction.user.id,
      expiresAt
    },
    { upsert: true, new: true }
  );

  const general = interaction.guild.channels.cache.get(config.channels.GENERAL);
  if (general) {
    await general.send({
      content: `🔇 **Mute**\n${user.tag} has been muted by the **Pickle Gods** for **${hours} hour(s)**.\nReason: **${reason}**`,
      allowedMentions: { parse: [] }
    }).catch(() => null);
  }

  const embed = new EmbedBuilder()
    .setTitle('🔇 Member Muted')
    .setColor(0xffaa00)
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})` },
      { name: 'Duration', value: `${hours} hour(s)`, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Staff', value: `${interaction.user.tag} (${interaction.user.id})` },
      { name: 'Role', value: 'Muted Pickle', inline: true },
      { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`, inline: false }
    )
    .setTimestamp();

  const modLogs = interaction.guild.channels.cache.get(config.channels.MOD_LOGS);
  if (modLogs) await modLogs.send({ embeds: [embed] }).catch(() => null);

  return interaction.editReply(`✅ Muted ${user.tag} for ${hours} hour(s).`);
}
if (interaction.commandName === 'tempban') {
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: '🚫 You do not have permission to use this command.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const user = interaction.options.getUser('user');
  const days = interaction.options.getInteger('days');
  const reason = interaction.options.getString('reason');

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.editReply('❌ Could not find that member in this server.');

  const frozenRoleId = '1462597563935887410';

  await member.roles.add(frozenRoleId).catch(() => null);

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await Punishment.findOneAndUpdate(
    { guildId: interaction.guild.id, userId: user.id, type: 'TEMPBAN' },
    {
      guildId: interaction.guild.id,
      userId: user.id,
      type: 'TEMPBAN',
      roleId: frozenRoleId,
      reason,
      staffId: interaction.user.id,
      expiresAt
    },
    { upsert: true, new: true }
  );

  const general = interaction.guild.channels.cache.get(config.channels.GENERAL);
  if (general) {
    await general.send({
      content: `🧊 **Tempban**\n${user.tag} has been tempbanned in **Pickle Jar Gaming** by the **Pickle Council** for **${days} day(s)**.\nReason: **${reason}**`,
      allowedMentions: { parse: [] }
    }).catch(() => null);
  }

  const embed = new EmbedBuilder()
    .setTitle('🧊 Member Tempbanned')
    .setColor(0x00aaff)
    .addFields(
      { name: 'User', value: `${user.tag} (${user.id})` },
      { name: 'Duration', value: `${days} day(s)`, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Staff', value: `${interaction.user.tag} (${interaction.user.id})` },
      { name: 'Role', value: 'Frozen Pickle', inline: true },
      { name: 'Expires', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`, inline: false }
    )
    .setTimestamp();

  const modLogs = interaction.guild.channels.cache.get(config.channels.MOD_LOGS);
  if (modLogs) await modLogs.send({ embeds: [embed] }).catch(() => null);

  return interaction.editReply(`✅ Tempbanned ${user.tag} for ${days} day(s).`);
}


      // Try to respond so Discord doesn't show "did not respond"
      if (interaction && (interaction.deferred || interaction.replied)) {
        try {
          await interaction.editReply('❌ Something went wrong. Check the bot console for details.');
        } catch (_) {}
      } else if (interaction && interaction.isRepliable && interaction.isRepliable()) {
        try {
          await interaction.reply({ content: '❌ Something went wrong. Check the bot console.', ephemeral: true });
        } catch (_) {}
      }
      if (interaction.commandName === 'invitesync') {
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: '🚫 You do not have permission to use this command.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  // Requires "Manage Server" permission for the bot
  const invites = await interaction.guild.invites.fetch().catch(() => null);
  if (!invites) {
    return interaction.editReply('❌ Could not fetch invites. Make sure the bot has **Manage Server** permission.');
  }

  // Sum uses per inviterId
  const totals = new Map(); // inviterId -> totalUses
  for (const inv of invites.values()) {
    const inviterId = inv.inviter?.id;
    if (!inviterId) continue;

    const uses = inv.uses ?? 0;
    totals.set(inviterId, (totals.get(inviterId) || 0) + uses);
  }

  // Save to DB
  let updated = 0;
  for (const [inviterId, totalUses] of totals.entries()) {
    await InviteStats.findOneAndUpdate(
      { guildId: interaction.guild.id, inviterId },
      { $set: { invites: totalUses } },
      { upsert: true, new: true }
    );
    updated++;
  }

  return interaction.editReply(`✅ Synced invites for **${updated}** inviters from current Discord invite uses.`);
}
    }
  });
};

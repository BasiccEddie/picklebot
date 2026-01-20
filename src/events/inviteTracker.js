const { Collection, EmbedBuilder } = require('discord.js');
const config = require('../config');

const InviteStats = require('../models/InviteStats');
const InviteJoin = require('../models/InviteJoin');
const { applyInviteRoles } = require('../utils/inviteRoles');
const { sendHallOfFame } = require('../utils/hallOfFame');

module.exports = (client) => {
  client.invitesCache = new Collection();

  async function cacheGuildInvites(guild) {
    try {
      const invites = await guild.invites.fetch();
      client.invitesCache.set(guild.id, invites);
    } catch (err) {
      console.error(`❌ Failed to fetch invites for guild ${guild.id}:`, err);
    }
  }

  client.on('ready', async () => {
    for (const guild of client.guilds.cache.values()) {
      await cacheGuildInvites(guild);
    }
    console.log('🥒 Invite cache ready');
  });

  client.on('inviteCreate', async (invite) => {
    await cacheGuildInvites(invite.guild);
  });

  client.on('inviteDelete', async (invite) => {
    await cacheGuildInvites(invite.guild);
  });

  client.on('guildMemberAdd', async (member) => {
    try {
      const guild = member.guild;

      const oldInvites = client.invitesCache.get(guild.id);
      const newInvites = await guild.invites.fetch().catch(() => null);
      if (!newInvites) return;

      client.invitesCache.set(guild.id, newInvites);

      // Find invite whose uses increased
      const usedInvite = oldInvites
        ? newInvites.find(inv => (inv.uses ?? 0) > (oldInvites.get(inv.code)?.uses ?? 0))
        : null;

      const inviterId = usedInvite?.inviter?.id || null;
      const inviteCode = usedInvite?.code || null;

      // Prevent double counting the same joined user
      const already = await InviteJoin.findOne({ guildId: guild.id, joinedUserId: member.id });
      if (already) return;

      await InviteJoin.create({
        guildId: guild.id,
        joinedUserId: member.id,
        inviterId,
        inviteCode
      });

      // If vanity/unknown, no inviter stats
      if (!inviterId) return;

      // Increment inviter stats (TOTAL invited joins)
      const stats = await InviteStats.findOneAndUpdate(
        { guildId: guild.id, inviterId },
        { $inc: { invites: 1 } },
        { upsert: true, new: true }
      );

      const inviterMember = await guild.members.fetch(inviterId).catch(() => null);
      if (!inviterMember) return;

      // Apply invite milestone roles (10/30/50 etc)
      const roleResult = await applyInviteRoles(inviterMember, stats.invites);

      // Hall of Fame for TWO biggest invite ranks
      if (roleResult && roleResult.awarded) {
        const promoterRoleId = config.inviteBigRoles?.promoterRoleId;
        const cultLeaderRoleId = config.inviteBigRoles?.cultLeaderRoleId;

        if (promoterRoleId && roleResult.roleId === promoterRoleId) {
          await sendHallOfFame(
            guild,
            `📣 **HALL OF FAME** 📣\n${inviterMember.user.tag} has earned **Pickle Promoter** with **${stats.invites} invites**! 🥒🚀`
          );
        }

        if (cultLeaderRoleId && roleResult.roleId === cultLeaderRoleId) {
          await sendHallOfFame(
            guild,
            `🛐 **HALL OF FAME** 🛐\n${inviterMember.user.tag} has earned **Pickle Cult Leader** with **${stats.invites} invites**! 🥒🔥`
          );
        }
      }

      // Optional mod-log
      const modLogs = guild.channels.cache.get(config.channels.MOD_LOGS);
      if (modLogs) {
        const embed = new EmbedBuilder()
          .setTitle('📨 Invite Used')
          .setColor(0x2ecc71)
          .addFields(
            { name: 'Joined', value: `${member.user.tag} (${member.id})`, inline: false },
            { name: 'Inviter', value: `${inviterMember.user.tag} (${inviterId})`, inline: false },
            { name: 'Invite Code', value: inviteCode || 'Unknown', inline: true },
            { name: 'Inviter Total', value: `${stats.invites}`, inline: true }
          )
          .setTimestamp();

        await modLogs.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (err) {
      console.error('❌ inviteTracker error:', err);
    }
  });
};

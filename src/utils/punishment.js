const Punishment = require('../models/Punishment');

async function checkPunishments(client) {
  const now = new Date();

  // Find expired punishments
  const expired = await Punishment.find({ expiresAt: { $lte: now } }).limit(50);

  for (const p of expired) {
    try {
      const guild = await client.guilds.fetch(p.guildId).catch(() => null);
      if (!guild) {
        await Punishment.deleteOne({ _id: p._id }).catch(() => null);
        continue;
      }

      const member = await guild.members.fetch(p.userId).catch(() => null);
      if (member && member.roles.cache.has(p.roleId)) {
        await member.roles.remove(p.roleId).catch(() => null);
      }

      // remove from DB regardless (so it doesn't loop forever)
      await Punishment.deleteOne({ _id: p._id }).catch(() => null);

    } catch (e) {
      console.error('❌ checkPunishments error:', e);
    }
  }
}

module.exports = { checkPunishments };

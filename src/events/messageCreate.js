const User = require('../models/User');
const config = require('../config');
const { getLevel } = require('../utils/xpCalc');
const { applyLevelRoles } = require('../utils/levelRoles');
const { sendHallOfFame } = require('../utils/hallOfFame');

const XP_PER_MESSAGE = 1;
const MESSAGE_COOLDOWN_MS = 10_000; // 10 seconds anti-spam

// Optional: public "level up" messages (off by default)
const ANNOUNCE_LEVEL_UP_IN_CHAT = false;

function hasBlockedXpRole(member) {
  const blocked = [
    config.roles.SOUR_PICKLE,
    config.roles.ROTTEN_PICKLE,
    config.roles.MUTED,
    config.roles.FROZEN_PICKLE
  ].filter(Boolean);

  return member.roles.cache.some(r => blocked.includes(r.id));
}

module.exports = (client) => {
  client.on('messageCreate', async (message) => {
    try {
      if (!message.guild) return;
      if (message.author.bot) return;

      const member = message.member;
      if (!member) return;

      // No XP for punished roles
      if (hasBlockedXpRole(member)) return;

      // Fetch or create DB record
      let userData = await User.findOne({
        userId: message.author.id,
        guildId: message.guild.id
      });

      if (!userData) {
        userData = new User({
          userId: message.author.id,
          guildId: message.guild.id,
          xp: 0,
          level: 0,
          lastMessage: null
        });
      }

      // Cooldown
      const now = Date.now();
      if (userData.lastMessage && (now - userData.lastMessage.getTime()) < MESSAGE_COOLDOWN_MS) {
        return;
      }

      // Award XP
      userData.lastMessage = new Date(now);
      userData.xp += XP_PER_MESSAGE;

      // Level calc using your exact XP table
      const newLevel = getLevel(userData.xp);
      const oldLevel = userData.level || 0;

      if (newLevel <= oldLevel) {
        await userData.save();
        return;
      }

      // Level up
      userData.level = newLevel;
      await userData.save();

      // Apply level reward roles (returns { awarded, roleId, level })
      const roleResult = await applyLevelRoles(member, newLevel);

      if (ANNOUNCE_LEVEL_UP_IN_CHAT) {
        await message.channel
          .send(`🎉 ${message.author} reached level **${newLevel}**!`)
          .catch(() => null);
      }

      // Hall of Fame for Legendary Pickle (60) and Pickle Overlord (70)
      if (roleResult && roleResult.awarded) {
        if (roleResult.level === 60) {
          await sendHallOfFame(
            message.guild,
            `🏆 **HALL OF FAME** 🏆\n${message.author.tag} has reached **Level 60** and earned **Legendary Pickle**! 🥒✨`
          );
        }

        if (roleResult.level === 70) {
          await sendHallOfFame(
            message.guild,
            `👑 **HALL OF FAME** 👑\n${message.author.tag} has reached **Level 70** and become a **Pickle Overlord**! 🥒🔥`
          );
        }
      }
    } catch (err) {
      console.error('❌ messageCreate error:', err);
    }
  });
};

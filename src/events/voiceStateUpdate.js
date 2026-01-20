const User = require('../models/User');
const config = require('../config');
const { getLevel } = require('../utils/xpCalc');
const { applyLevelRoles } = require('../utils/levelRoles');
const { sendHallOfFame } = require('../utils/hallOfFame');

const XP_PER_CHUNK = 1;
const CHUNK_MS = 10 * 60 * 1000; // 10 minutes

// Memory-only sessions: key = guildId:userId -> start timestamp (when eligible)
const voiceSessions = new Map();

function hasBlockedXpRole(member) {
  const blocked = [
    config.roles.SOUR_PICKLE,
    config.roles.ROTTEN_PICKLE,
    config.roles.MUTED,
    config.roles.FROZEN_PICKLE
  ].filter(Boolean);

  return member.roles.cache.some(r => blocked.includes(r.id));
}

// Eligibility rule B:
// - in a voice channel
// - NOT selfDeaf/serverDeaf
// - NOT in AFK channel
function isEligible(state) {
  if (!state.channelId) return false;

  const afkId = state.guild.afkChannelId;
  if (afkId && state.channelId === afkId) return false;

  if (state.selfDeaf) return false;
  if (state.serverDeaf) return false;

  return true;
}

async function addVoiceXp(guild, userId, chunks) {
  if (chunks <= 0) return;

  let userData = await User.findOne({ userId, guildId: guild.id });
  if (!userData) userData = new User({ userId, guildId: guild.id, xp: 0, level: 0 });

  userData.xp += chunks * XP_PER_CHUNK;

  const newLevel = getLevel(userData.xp);
  const oldLevel = userData.level || 0;

  if (newLevel > oldLevel) {
    userData.level = newLevel;
    await userData.save();

    const member = await guild.members.fetch(userId).catch(() => null);
    if (member) {
      const roleResult = await applyLevelRoles(member, newLevel);

      // Hall of Fame for Legendary Pickle (60) and Pickle Overlord (70)
      if (roleResult && roleResult.awarded) {
        if (roleResult.level === 60) {
          await sendHallOfFame(
            guild,
            `🏆 **HALL OF FAME** 🏆\n${member.user.tag} has reached **Level 60** and earned **Legendary Pickle**! 🥒✨`
          );
        }
        if (roleResult.level === 70) {
          await sendHallOfFame(
            guild,
            `👑 **HALL OF FAME** 👑\n${member.user.tag} has reached **Level 70** and become a **Pickle Overlord**! 🥒🔥`
          );
        }
      }
    }
    return;
  }

  await userData.save();
}

module.exports = (client) => {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
      const member = newState.member || oldState.member;
      if (!member) return;
      if (member.user.bot) return;

      const key = `${member.guild.id}:${member.id}`;

      // If user has blocked roles, stop tracking
      if (hasBlockedXpRole(member)) {
        voiceSessions.delete(key);
        return;
      }

      const wasEligible = isEligible(oldState);
      const isNowEligible = isEligible(newState);

      // Eligible -> Not eligible: close session and award XP
      if (wasEligible && !isNowEligible) {
        const start = voiceSessions.get(key);
        if (start) {
          const elapsed = Date.now() - start;
          const chunks = Math.floor(elapsed / CHUNK_MS);
          await addVoiceXp(member.guild, member.id, chunks);
        }
        voiceSessions.delete(key);
        return;
      }

      // Not eligible -> Eligible: start session
      if (!wasEligible && isNowEligible) {
        voiceSessions.set(key, Date.now());
        return;
      }

      // Otherwise no change
    } catch (err) {
      console.error('❌ voiceStateUpdate error:', err);
    }
  });
};

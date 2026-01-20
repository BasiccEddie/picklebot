const config = require('../config');

async function sendHallOfFame(guild, content) {
  const hof = guild.channels.cache.get(config.channels.HALL_OF_FAME);
  if (!hof) return;

  const roleId = config.hallOfFameTagRoleId;
  const tag = roleId ? `<@&${roleId}> ` : '';

  await hof.send({
    content: `${tag}${content}`,
    // ✅ Ping ONLY the Hall of Fame role
    // ❌ No user pings, no @everyone/@here
    allowedMentions: {
      roles: roleId ? [roleId] : [],
      users: [],
      parse: []
    }
  }).catch(() => null);
}

module.exports = { sendHallOfFame };

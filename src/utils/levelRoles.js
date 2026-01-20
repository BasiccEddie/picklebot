const config = require('../config');

function getHighestReward(level) {
  const rewards = (config.levelRoles || [])
    .filter(r => level >= r.level)
    .sort((a, b) => b.level - a.level);
  return rewards[0] || null;
}

// Returns: { awarded: boolean, roleId?: string, level?: number }
async function applyLevelRoles(member, level) {
  if (!member) return { awarded: false };

  const reward = getHighestReward(level);
  if (!reward) return { awarded: false };

  const allRewardRoleIds = (config.levelRoles || []).map(r => r.roleId);

  // Remove lower reward roles
  const rolesToRemove = member.roles.cache
    .filter(r => allRewardRoleIds.includes(r.id) && r.id !== reward.roleId)
    .map(r => r.id);

  if (rolesToRemove.length) {
    await member.roles.remove(rolesToRemove).catch(() => null);
  }

  // Add current reward role if missing
  const hadRole = member.roles.cache.has(reward.roleId);
  if (!hadRole) {
    await member.roles.add(reward.roleId).catch(() => null);
    return { awarded: true, roleId: reward.roleId, level: reward.level };
  }

  return { awarded: false };
}

module.exports = { applyLevelRoles };

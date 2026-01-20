const config = require('../config');

function getHighestInviteReward(invites) {
  const rewards = (config.inviteRoles || [])
    .filter(r => invites >= r.invites)
    .sort((a, b) => b.invites - a.invites);
  return rewards[0] || null;
}

// Returns: { awarded: boolean, roleId?: string, invites?: number }
async function applyInviteRoles(member, invites) {
  if (!member) return { awarded: false };

  const reward = getHighestInviteReward(invites);
  if (!reward) return { awarded: false };

  const allRewardIds = (config.inviteRoles || []).map(r => r.roleId);

  const toRemove = member.roles.cache
    .filter(r => allRewardIds.includes(r.id) && r.id !== reward.roleId)
    .map(r => r.id);

  if (toRemove.length) await member.roles.remove(toRemove).catch(() => null);

  const hadRole = member.roles.cache.has(reward.roleId);
  if (!hadRole) {
    await member.roles.add(reward.roleId).catch(() => null);
    return { awarded: true, roleId: reward.roleId, invites: reward.invites };
  }

  return { awarded: false };
}

module.exports = { applyInviteRoles };


const mongoose = require('mongoose');

const inviteStatsSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  inviterId: { type: String, required: true },
  invites: { type: Number, default: 0 }
});

inviteStatsSchema.index({ guildId: 1, inviterId: 1 }, { unique: true });

module.exports = mongoose.model('InviteStats', inviteStatsSchema);

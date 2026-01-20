const mongoose = require('mongoose');

const inviteJoinSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  joinedUserId: { type: String, required: true },
  inviterId: { type: String, required: false }, // can be null for vanity/unknown
  inviteCode: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

inviteJoinSchema.index({ guildId: 1, joinedUserId: 1 }, { unique: true });

module.exports = mongoose.model('InviteJoin', inviteJoinSchema);

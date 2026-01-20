const mongoose = require('mongoose');

const punishmentSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },

  type: { type: String, enum: ['MUTE', 'TEMPBAN'], required: true },
  roleId: { type: String, required: true },

  reason: { type: String, default: '' },
  staffId: { type: String, default: '' },

  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

punishmentSchema.index({ guildId: 1, userId: 1, type: 1 });

module.exports = mongoose.model('Punishment', punishmentSchema);

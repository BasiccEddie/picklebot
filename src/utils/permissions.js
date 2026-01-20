const config = require('../config');

module.exports = {
  isStaff(member) {
    return member.roles.cache.some(role =>
      config.roles.STAFF.includes(role.id)
    );
  }
};

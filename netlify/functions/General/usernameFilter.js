function createUsernameFilter(username) {
  const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } };
}

module.exports = createUsernameFilter;

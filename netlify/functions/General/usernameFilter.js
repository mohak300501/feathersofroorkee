function validateUsername(username) {
  if (typeof username !== 'string') return 'Invalid username.';
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 30) return 'Username must be between 3 and 30 characters.';
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) return 'Username can contain only letters, numbers, underscores, hyphens, and periods.';
  return null;
}


function createUsernameFilter(username) {
  const escapedUsername = username.replace(/[@.*+?^${}()|[\]\\]/g, '\\$&');
  return { username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') } };
}

module.exports = createUsernameFilter;
module.exports.validateUsername = validateUsername;

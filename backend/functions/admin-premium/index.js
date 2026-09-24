const { getCaller, users } = require('../shared/appwrite');

module.exports = async ({ req, res }) => {
  try {
    const caller = await getCaller(req.headers);
    if (caller.prefs?.role !== 'admin') return res.json({ error: 'Admin access required' }, 403);
    const { action = 'update', userId, isPremium, query } = JSON.parse(req.body || '{}');
    if (action === 'find') {
      if (!query) return res.json({ error: 'Email or user ID is required' }, 400);
      try {
        return res.json(await users.get(query));
      } catch (lookupError) {
        const result = await users.list([], query);
        if (!result.users.length) return res.json({ error: 'User not found' }, 404);
        return res.json(result.users[0]);
      }
    }
    if (!userId) return res.json({ error: 'userId is required' }, 400);
    const target = await users.get(userId);
    return res.json(await users.updatePrefs(userId, { ...target.prefs, isPremium: Boolean(isPremium) }));
  } catch (err) { return res.json({ error: err.message }, 400); }
};
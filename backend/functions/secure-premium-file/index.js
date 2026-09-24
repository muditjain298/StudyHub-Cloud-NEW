const { databases, storage, ids, getCaller } = require('../shared/appwrite');

module.exports = async ({ req, res }) => {
  try {
    const caller = await getCaller(req.headers);
    if (!caller.prefs?.isPremium && caller.prefs?.role !== 'admin') return res.json({ error: 'Premium access required' }, 403);
    const { contentId, disposition = 'attachment' } = JSON.parse(req.body || '{}');
    const content = await databases.getDocument(ids.database, ids.content, contentId);
    if (content.type === 'video') return res.json({ embedUrl: content.videoUrl });
    const url = storage.getFileDownload(process.env.APPWRITE_PREMIUM_BUCKET_ID, content.fileId);
    return res.json({ url: `${url}&expiresIn=300&disposition=${encodeURIComponent(disposition)}` });
  } catch (err) { return res.json({ error: err.message }, 400); }
};
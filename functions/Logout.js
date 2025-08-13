// functions/Logout.js
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true, credentials: true });

module.exports.logout = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

    // __session 쿠키 만료
    res.setHeader('Set-Cookie', [
      `__session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`,
    ]);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ success: true, message: 'Logged out' });
  });
});

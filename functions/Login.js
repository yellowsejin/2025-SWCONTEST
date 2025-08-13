// functions/Login.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true, credentials: true });

if (!admin.apps.length) admin.initializeApp();

module.exports.login = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

    try {
      const { idToken } = req.body;               // 프론트에서 받은 Firebase ID 토큰
      if (!idToken) return res.status(400).json({ error: 'idToken required' });

      // 1) 토큰 검증
      const decoded = await admin.auth().verifyIdToken(idToken, true);

      // 2) 세션 쿠키 생성 (예: 5일)
      const expiresInMs = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn: expiresInMs });

      // 3) __session 쿠키 심기 (Functions는 __session만 인식)
      res.setHeader('Set-Cookie', [
        `__session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${expiresInMs / 1000}`,
      ]);

      res.setHeader('Cache-Control', 'no-store');
      return res.json({ success: true, uid: decoded.uid });
    } catch (err) {
      console.error(err);
      return res.status(401).json({ error: 'Invalid or expired idToken' });
    }
  });
});

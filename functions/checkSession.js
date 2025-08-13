// functions/checkSession.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true, credentials: true });

if (!admin.apps.length) admin.initializeApp();

// __session 쿠키 파서
function getSessionCookie(req) {
  const raw = req.headers.cookie || '';
  const pair = raw.split(';').map(s => s.trim()).find(s => s.startsWith('__session='));
  return pair ? decodeURIComponent(pair.split('=').slice(1).join('=')) : null;
}

module.exports.checkSession = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET')     return res.status(405).end();

    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ authenticated: false, uid: null });
    }

    try {
      const decoded = await admin.auth().verifySessionCookie(sessionCookie, true);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ authenticated: true, uid: decoded.uid });
    } catch (e) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ authenticated: false, uid: null });
    }
  });
});

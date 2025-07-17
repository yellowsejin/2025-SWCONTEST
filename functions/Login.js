const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');
const cors      = require('cors')({ origin: true });

module.exports.login = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).end();

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email과 password가 필요합니다.' });
    }
    const apiKey = functions.config().firebase.api_key;
    try {
      const resp = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        { email, password, returnSecureToken: true }
      );
      res.json({
        uid: resp.data.localId,
        idToken: resp.data.idToken,
        refreshToken: resp.data.refreshToken
      });
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      res.status(401).json({ error: msg });
    }
  });
});
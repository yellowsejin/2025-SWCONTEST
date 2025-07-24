// functions/SignUp.js
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');
const cors      = require('cors')({ origin: true });

module.exports.signup = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      // preflight 요청, cors 미들웨어가 다 해줌
      return res.status(204).send('');
    }
    // 1) POST가 아니면 거절
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password, id } = req.body;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    const idRegex = /^[a-zA-Z0-9_]{4,20}$/;

    // 2) 아이디, 비밀번호 유효성 검사
    if (!id || !idRegex.test(id)) {
      return res.status(400).json({
        error: '아이디는 4~20자의 영문, 숫자, 밑줄(_)만 가능합니다.'
      });
    }
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({
        error: '비밀번호는 영문과 숫자를 포함하여 6자 이상이어야 합니다'
      });
    }

    try {
      // 3) 사용자 생성
      const dupSnap = await admin.firestore()
        .collection('users')
        .where('ID', '==', id)
        .get();
      if (!dupSnap.empty) {
        return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
      }

      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: id
      });
      const uid = userRecord.uid;

      // 4) Firestore에 기본 프로필 세팅
      const userRef = admin.firestore().collection('users').doc(uid);
      await userRef.set({
        email,
        ID: id,
        level: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 5) 소유 가구(defaultIds)도 batch로 생성
      const defaultIds = ['basic table','basic chair','basic bookshelf'];
      const batch = admin.firestore().batch();
      defaultIds.forEach(furnitureId => {
        batch.set(
          userRef.collection('ownedFurnitures').doc(furnitureId),
          {
            furnitureId: furnitureId,
            equipped: false,
            acquiredAt: admin.firestore.FieldValue.serverTimestamp()
          }
        );
      });
      await batch.commit();

      // 6) 성공 응답
      return res.status(200).json({ uid });
    } catch (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

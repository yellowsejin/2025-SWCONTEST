const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const cors      = require('cors')({ origin: true });

if (!admin.apps.length) admin.initializeApp();

function requiredCountFor(level) {
  if (level <= 5)  return 10;
  if (level <= 10) return 20;
  if (level <= 15) return 30;
  if (level <= 20) return 40;
  return 50;
}

exports.signup = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

    const { email, password, id } = req.body;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    const idRegex       = /^[a-zA-Z0-9_]{4,20}$/;

    if (!id || !idRegex.test(id)) {
      return res.status(400).json({ error: '아이디는 4~20자의 영문, 숫자, 밑줄(_)만 가능합니다.' });
    }
    if (!password || !passwordRegex.test(password)) {
      return res.status(400).json({ error: '비밀번호는 영문과 숫자를 포함하여 6자 이상이어야 합니다' });
    }

    try {
      // id 중복 체크
      const dupSnap = await admin.firestore().collection('users').where('id', '==', id).limit(1).get();
      if (!dupSnap.empty) return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });

      // Auth 유저 생성
      const userRecord = await admin.auth().createUser({ email, password, displayName: id });
      const uid = userRecord.uid;

      // 유저 문서 생성 + 카운터 초기화 (⚠ merge:true)
      const level = 1;
      const required = requiredCountFor(level);
      await admin.firestore().collection('users').doc(uid).set({
        email,
        id,
        level,
        completedCount: 0,          // 이번 레벨 완료 수
        totalCompletedCount: 0,     // 누적 완료 수
        requiredTodoCount: required,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return res.status(200).json({ uid });
    } catch (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ error: err.message });
    }
  });
});

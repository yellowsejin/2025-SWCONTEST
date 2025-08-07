const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const db        = admin.firestore();

const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '512MB'
};

const onUserCreate = functions
  .runWith(runtimeOpts)
  .auth
  .user()
  .onCreate(async (user) => {
    console.log('▶ onUserCreate fired for uid:', user.uid);
    const uid   = user.uid;
    const email = user.email || null;
    const id    = user.displayName || '';

    try {
      await db.collection('users').doc(uid).set({
        id: id,
        email,
        createdAt: new Date(),
        point: 0,
        level: 1,
        questStatus: {},
        room: {
          theme: 'basic',
          furniture: []
        }
      });
      console.log(`초기 데이터 세팅 유저 : ${uid}`);
    } catch (err) {
      console.error(`초기 데이터 세팅 실패 ${uid} :`, err);
    }
  });

module.exports = onUserCreate;
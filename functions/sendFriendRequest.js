const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const db        = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '512MB'
};

const sendFriendRequest = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated','로그인이 필요합니다.');
    }
    const from     = context.auth.uid;
    const targetId = data.targetId;
    if (!targetId) {
      throw new functions.https.HttpsError('invalid-argument','targetId가 필요합니다.');
    }

    const snap = await db.collection('users').where('id','==',targetId).limit(1).get();
    if (snap.empty) {
      throw new functions.https.HttpsError('not-found','해당 유저를 찾을 수 없습니다.');
    }
    const to = snap.docs[0].id;

    const dup = await db.collection('friendRequests')
      .where('from','==',from)
      .where('to','==',to)
      .where('status','==','pending')
      .get();
    if (!dup.empty) {
      throw new functions.https.HttpsError('already-exists','이미 요청을 보냈습니다.');
    }

    await db.collection('friendRequests').add({
      from,
      to,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp()
    });
    return { success: true };
  });

module.exports = sendFriendRequest;
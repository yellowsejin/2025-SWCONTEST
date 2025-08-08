const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const db        = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '512MB'
};

const respondFriendRequest = functions
  .region('us-central1')
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated','로그인이 필요합니다.');
    }
    const me        = context.auth.uid;
    const { requestId, accept } = data;
    if (!requestId || typeof accept !== 'boolean') {
      throw new functions.https.HttpsError('invalid-argument','requestId와 accept 필요');
    }

    const reqRef  = db.collection('friendRequests').doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      throw new functions.https.HttpsError('not-found','요청을 찾을 수 없습니다.');
    }
    const { from, to, status } = reqSnap.data();
    if (to !== me) {
      throw new functions.https.HttpsError('permission-denied','내게 온 요청이 아닙니다.');
    }
    if (status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition','이미 처리된 요청입니다.');
    }

    if (accept) {
      const userRef  = db.collection('users').doc(me);
      const otherRef = db.collection('users').doc(from);
      await db.runTransaction(tx => {
        tx.update(userRef,  { friends: FieldValue.arrayUnion(from) });
        tx.update(otherRef, { friends: FieldValue.arrayUnion(me)   });
        tx.update(reqRef,   { status: 'accepted'                  });
      });
      return { success:true, message:'친구가 되었습니다.' };
    } else {
      await reqRef.update({ status: 'rejected' });
      return { success:true, message:'친구 요청을 거절했습니다.' };
    }
  });

module.exports = respondFriendRequest;
const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const db        = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '512MB'
};

const purchaseFurniture = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated','로그인이 필요합니다.');
    }
    const uid         = context.auth.uid;
    const { furnitureId } = data;
    if (!furnitureId) {
      throw new functions.https.HttpsError('invalid-argument','가구 ID를 전달해야 합니다.');
    }

    const userRef  = db.collection('users').doc(uid);
    const furniRef = db.collection('furnitures').doc(furnitureId);

    await db.runTransaction(async tx => {
      const userSnap  = await tx.get(userRef);
      const furniSnap = await tx.get(furniRef);
      if (!userSnap.exists) {
        throw new functions.https.HttpsError('not-found','사용자 정보를 찾을 수 없습니다.');
      }
      if (!furniSnap.exists) {
        throw new functions.https.HttpsError('not-found','가구 정보를 찾을 수 없습니다.');
      }

      const { point, level }   = userSnap.data();
      const { unlockLevel, price } = furniSnap.data();

      if (level < unlockLevel) {
        throw new functions.https.HttpsError('failed-precondition','레벨이 부족합니다.');
      }
      if (point < price) {
        throw new functions.https.HttpsError('failed-precondition','포인트가 부족합니다.');
      }

      tx.update(userRef, { point: FieldValue.increment(-price) });
      tx.set(
        userRef.collection('ownedFurnitures').doc(furnitureId),
        { purchasedAt: FieldValue.serverTimestamp() }
      );
    });

    return { success: true };
  });

module.exports = purchaseFurniture;
const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const db        = admin.firestore();

const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '512MB'
};

const getUnlockedFurnitures = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated','로그인이 필요합니다.');
    }
    const uid = context.auth.uid;
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError('not-found','사용자 데이터를 찾을 수 없습니다.');
    }
    const { level } = userSnap.data();
    const furniSnap = await db
      .collection('furnitures')
      .where('unlockLevel','<=',level)
      .orderBy('unlockLevel')
      .get();

    return furniSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name,
        assetPath: d.assetPath,
        iconUrl: d.iconUrl,
        unlockLevel: d.unlockLevel,
        category: d.category,
        price: d.price
      };
    });
  });

module.exports = getUnlockedFurnitures;
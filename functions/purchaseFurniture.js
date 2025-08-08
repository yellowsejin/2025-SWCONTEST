const functions = require('firebase-functions/v1');
const admin     = require('firebase-admin');
const db         = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '512MB'
};

const purchaseFurniture = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    // 🔐 인증 확인
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }

    const uid = context.auth.uid;
    const { furnitureId } = data;

    // 📦 가구 ID 유효성 검사
    if (!furnitureId) {
      throw new functions.https.HttpsError('invalid-argument', '가구 ID를 전달해야 합니다.');
    }

    const userRef  = db.collection('users').doc(uid);
    const furniRef = db.collection('furnitures').doc(furnitureId); // ✅ 컬렉션 이름 확인

    // 🔄 트랜잭션 실행
    await db.runTransaction(async tx => {
      const userSnap  = await tx.get(userRef);
      const furniSnap = await tx.get(furniRef);

      if (!userSnap.exists) {
        throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
      }
      if (!furniSnap.exists) {
        throw new functions.https.HttpsError('not-found', '가구 정보를 찾을 수 없습니다.');
      }

      const userData   = userSnap.data();
      const furniture  = furniSnap.data();

      const userPoint  = userData.point || 0;
      const userLevel  = userData.level || 1;
      const unlockLevel = furniture.levelRequired || furniture.unlockLevel || 1;
      const price      = furniture.price || 0;

      // 🚫 레벨 부족
      if (userLevel < unlockLevel) {
        throw new functions.https.HttpsError('failed-precondition', '레벨이 부족합니다.');
      }

      // 🚫 포인트 부족
      if (userPoint < price) {
        throw new functions.https.HttpsError('failed-precondition', '포인트가 부족합니다.');
      }

      // ✅ 포인트 차감 및 배열에 추가
      tx.update(userRef, {
        point: FieldValue.increment(-price),
        furnitureOwned: FieldValue.arrayUnion(furnitureId)
      });

      // 🗃️ 서브컬렉션에 구매 정보 저장
      tx.set(
        userRef.collection('ownedFurnitures').doc(furnitureId),
        {
          name: furniture.name || '',
          price,
          rewardCoins: furniture.rewardCoins || furniture.coinReward || 0,
          levelRequired: unlockLevel,
          purchasedAt: FieldValue.serverTimestamp()
        }
      );
    });

    return { success: true };
  });

module.exports = purchaseFurniture;
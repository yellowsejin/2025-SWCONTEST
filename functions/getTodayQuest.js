const functions = require("firebase-functions/v1");
const admin     = require("firebase-admin");
const db        = admin.firestore();

/**
 * 하루 퀘스트 5개 랜덤 생성 및 조회
 */
const getTodayQuest = functions
  .runWith({
   timeoutSeconds: 300,
    memory: "512MB",
  })
  .https.onCall(async (_, context) => {
    
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "로그인이 필요합니다."
      );
    }

  const uid   = context.auth.uid;
  const today = (() => {
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const y   = now.getUTCFullYear();
      const m   = String(now.getUTCMonth() + 1).padStart(2, '0');
      const d   = String(now.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    })();

  // 사용자별 오늘의 퀘스트 문서 참조
  const dailyRef = db
    .collection("users").doc(uid)
    .collection("dailyQuests").doc(today);
    

  const snap = await dailyRef.get();
    if (snap.exists) {
      const ids = snap.data().questIds || [];
      // 기존에 저장된 ID로 {id,text,rewardCoins} 배열로 변환
      return Promise.all(
        ids.map(async id => {
          const qSnap = await db.collection("quests").doc(id).get();
          const data  = qSnap.data() || {};
          return {
            id,
            text: data.text || "",
            rewardCoins: data.rewardCoins || 0
          };
        })
      );
    }

    // 전체 퀘스트 컬렉션에서 ID 5개 랜덤 추출
    const allIds = (await db.collection("quests").get()).docs.map(d => d.id);
    for (let i = allIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
    }
    const pickIds = allIds.slice(0, 5);

    // 오늘치로 ID 리스트 저장
    await dailyRef.set({
      questIds: pickIds,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 최종 반환할 객체 배열 생성
    return Promise.all(
      pickIds.map(async id => {
        const qSnap = await db.collection("quests").doc(id).get();
        const data  = qSnap.data() || {};
        return {
          id,
          text: data.text || "",
          rewardCoins: data.rewardCoins || 0
        };
      })
    );
  });

module.exports = getTodayQuest
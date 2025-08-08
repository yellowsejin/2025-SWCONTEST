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
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // 사용자별 오늘의 퀘스트 문서 참조
  const dailyRef = db
    .collection("users").doc(uid)
    .collection("dailyQuests").doc(today);

  const snap = await dailyRef.get();
  if (snap.exists) {
      // 기존에 객체 배열로 저장돼 있던 것도, 새로 문자열 배열로 저장된 것도 모두 커버
    const raw = snap.data().quests || [];
    return raw.map(q => typeof q === "string" ? q : q.text);
  }
    
  // 전체 퀘스트 목록에서 ID만 가져오기
  const allSnap = await db.collection("quests").get();
  const allIds  = allSnap.docs.map(doc => doc.id);

  // Fisher–Yates 셔플
  for (let i = allIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
  }

  // 상위 5개 뽑기
  const pickIds = allIds.slice(0, 5);

  const quests = await Promise.all(
    pickIds.map(async id => {
      const defSnap = await db.collection("quests").doc(id).get();
      const { text, rewardCoins } = defSnap.data();
      return { text }; 
    })
  );


  // 오늘의 퀘스트 저장
  await dailyRef.set({
    quests,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return quests;
});

module.exports = getTodayQuest;
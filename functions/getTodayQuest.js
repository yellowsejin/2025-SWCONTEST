const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const db = admin.firestore();

const getTodayQuest = functions
  .runWith({ timeoutSeconds: 300, memory: "512MB" })
  .https.onCall(async (_, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const uid = context.auth.uid;

    // 한국 시간 YYYY-MM-DD
    const today = (() => {
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const d = String(now.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    })();

    const dailyRef = db.collection("users").doc(uid).collection("dailyQuests").doc(today);

    // 이미 생성된 오늘 퀘스트 있으면 그대로 반환 (+ 상태 포함)
    const snap = await dailyRef.get();
    if (snap.exists) {
      const { questIds = [], status = {} } = snap.data() || {};
      const quests = await Promise.all(
        questIds.map(async (id) => {
          const qSnap = await db.collection("quests").doc(id).get();
          const data = qSnap.data() || {};
          const rewarded = !!(status[id]?.rewardGiven);
          return {
            id,
            text: data.text || "",
            rewardCoins: data.rewardCoins || 0,
            state: rewarded ? "rewarded" : "idle",
          };
        })
      );
      return quests; // ← 기존처럼 배열 반환
    }

    // 없으면 새로 5개 추출하고 status 맵 초기화
    const allIds = (await db.collection("quests").get()).docs.map((d) => d.id);
    for (let i = allIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
    }
    const pickIds = allIds.slice(0, 5);

    await dailyRef.set({
      questIds: pickIds,
      status: {}, // ✅ 맵 필드 초기화
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 처음에는 전부 idle
    const quests = await Promise.all(
      pickIds.map(async (id) => {
        const qSnap = await db.collection("quests").doc(id).get();
        const data = qSnap.data() || {};
        return { id, text: data.text || "", rewardCoins: data.rewardCoins || 0, state: "idle" };
      })
    );
    return quests; // ← 배열 유지
  });

module.exports = getTodayQuest;
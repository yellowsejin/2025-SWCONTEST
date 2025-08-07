const admin = require('firebase-admin');
const serviceAccount = require('./dooop-69a1b-firebase-adminsdk-fbsvc-d0497b5bd7.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dooop-69a1b'
});

const db = admin.firestore();

// 시드용 퀘스트 데이터 (원하는 만큼 추가하세요)
const quests = [
  { text: '책상 위 정리', rewardCoins: 5 },
  { text: '좋아하는 노래 2곡 듣기', rewardCoins: 5 },
  { text: '날씨 확인 후 옷 고르기', rewardCoins: 5 },
  { text: '5분 스트레칭', rewardCoins: 5 },
  { text: '이불 정리하기', rewardCoins: 5 },
  { text: '오늘의 기분 한 줄 메모', rewardCoins: 5 },
  { text: '물 한 컵 마시기', rewardCoins: 5 },
  { text: '창문 열고 환기 시키기', rewardCoins: 5 },
  { text: '내일 할 일 3가지 적기', rewardCoins: 5 },
  { text: '오늘 할 일 3가지 적기', rewardCoins: 5 },
  { text: '20초 동안 눈 감고 있기', rewardCoins: 5 },
  { text: '산책 10분', rewardCoins: 5 },
  { text: '가방 정리', rewardCoins: 5 }
];

async function seedQuests() {
  const batch = db.batch();
  quests.forEach(q => {
    const ref = db.collection('quests').doc();  // 자동 ID
    batch.set(ref, q);
  });
  await batch.commit();
  console.log(`✅ ${quests.length}개 퀘스트 시딩 완료`);
  process.exit(0);
}

seedQuests().catch(err => {
  console.error('❌ 퀘스트 시딩 오류:', err);
  process.exit(1);
});

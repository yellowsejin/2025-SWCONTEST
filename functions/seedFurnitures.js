const admin = require('firebase-admin');
const serviceAccount = require('./dooop-69a1b-firebase-adminsdk-fbsvc-d0497b5bd7.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "dooop-69a1b"
});

const db = admin.firestore();

// 가구 목록 (category 필드 제거)
const furnitures = [
  { id: 'bed',        name: '침대',          unlockLevel: 1,  price: 15, iconUrl: '', assetPath: '' },
  { id: 'bathtub',    name: '욕조',       unlockLevel: 3,  price: 12, iconUrl: '', assetPath: '' },
  { id: 'ac',         name: '벽걸이 에어컨',           unlockLevel: 4,  price: 15, iconUrl: '', assetPath: '' },
  { id: 'fan',        name: '선풍기',     unlockLevel: 2,  price: 9,  iconUrl: '', assetPath: '' },
  { id: 'wallLamp',   name: '벽걸이 조명',   unlockLevel: 1,  price: 6,  iconUrl: '', assetPath: '' },
  { id: 'bookcase',   name: '책장',      unlockLevel: 1,  price: 14, iconUrl: '', assetPath: '' },
  { id: 'chair',      name: '의자',   unlockLevel: 1,  price: 7,  iconUrl: '', assetPath: '' },
  { id: 'nightstand', name: '2단 서랍',          unlockLevel: 2,  price: 8,  iconUrl: '', assetPath: '' },
  { id: 'table',      name: '테이블',         unlockLevel: 2,  price: 10, iconUrl: '', assetPath: '' },
  { id: 'tvConsole',  name: 'TV',        unlockLevel: 3,  price: 18, iconUrl: '', assetPath: '' },
  { id: 'floorLamp',  name: '스탠드 조명',       unlockLevel: 2,  price: 9,  iconUrl: '', assetPath: '' },
  { id: 'wardrobe',   name: '옷장',     unlockLevel: 3,  price: 16, iconUrl: '', assetPath: '' },
  { id: 'toilet',     name: '모던 싱글 화장실',         unlockLevel: 4,  price: 11, iconUrl: '', assetPath: '' },
  { id: 'plant',      name: '화분',    unlockLevel: 1,  price: 5,  iconUrl: '', assetPath: '' },
  { id: 'wallArt',    name: '그림',       unlockLevel: 1,  price: 6,  iconUrl: '', assetPath: '' },
  { id: 'slippers',   name: '실내 슬리퍼',       unlockLevel: 1,  price: 3,  iconUrl: '', assetPath: '' },
  { id: 'sink',       name: '세면대',            unlockLevel: 3,  price: 13, iconUrl: '', assetPath: '' },
  { id: 'deskLamp',   name: '탁상조명',         unlockLevel: 2,  price: 6,  iconUrl: '', assetPath: '' }
];

async function seed() {
  const batch = db.batch();
  furnitures.forEach(f => {
    const ref = db.collection('furnitures').doc(f.id);
    batch.set(ref, {
      name: f.name,
      unlockLevel: f.unlockLevel,
      price: f.price,
      iconUrl: f.iconUrl || '',
      assetPath: f.assetPath || ''
    });
  });
  await batch.commit();
  console.log('✅ Furnitures seeded!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
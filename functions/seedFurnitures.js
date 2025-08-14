const admin = require('firebase-admin');

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

// 1) 자격 증명: JSON 경로가 있으면 그걸로, 없으면 애플리케이션 기본 자격증명(ADC)
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS; // optional
if (saPath) {
  admin.initializeApp({
    credential: admin.credential.cert(require(saPath)),
  });
  console.log('Using service account credentials from', saPath);
} else {
  admin.initializeApp(); // GOOGLE_APPLICATION_CREDENTIALS or gcloud auth application-default login
  console.log('Using Application Default Credentials (ADC)');
}

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) console.warn('No explicit projectId. Using default from credentials/context.');

const db = admin.firestore();

// 가구 목록
const furnitures = [
  { id: 'bed',        name: '침대',   unlockLevel: 1, price: 10,  iconUrl: '', assetPath: '' },
  { id: 'desk',       name: '책상',   unlockLevel: 1, price: 10,  iconUrl: '', assetPath: '' },
  { id: 'bookcase',   name: '책장',   unlockLevel: 1, price: 10,  iconUrl: '', assetPath: '' },
  { id: 'chair',      name: '의자',   unlockLevel: 1, price: 10,  iconUrl: '', assetPath: '' },
  { id: 'wardrobe',   name: '옷장',   unlockLevel: 1, price: 10,  iconUrl: '', assetPath: '' },
  { id: 'fridge',     name: '냉장고', unlockLevel: 1, price: 10, iconUrl: '', assetPath: '' },
  { id: 'computer',   name: '컴퓨터', unlockLevel: 1, price: 10, iconUrl: '', assetPath: '' },
  { id: 'sofa',       name: '소파',   unlockLevel: 2, price: 10, iconUrl: '', assetPath: '' },
];

async function seed() {
  const batch = db.batch();
  furnitures.forEach((f) => {
    const ref = db.collection('furnitures').doc(f.id);
    batch.set(ref, {
      name: f.name,
      unlockLevel: f.unlockLevel,
      price: f.price,
      iconUrl: f.iconUrl || '',
      assetPath: f.assetPath || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
  console.log('✅ Furnitures seeded!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
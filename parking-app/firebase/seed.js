// Popola la collection "parkingSpots" su Firestore con il dataset dimostrativo.
//
// Uso:
//   1. Scarica una service account key dalla Console Firebase
//      (Impostazioni progetto > Account di servizio > Genera nuova chiave privata).
//   2. GOOGLE_APPLICATION_CREDENTIALS=/percorso/service-account.json node firebase/seed.js
//
// Sicuro da rieseguire più volte: sovrascrive solo i documenti con lo stesso id.
const admin = require('firebase-admin');
const spots = require('./seedData.json');

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

async function main() {
  const batch = db.batch();
  const now = Date.now();

  for (const spot of spots) {
    const ref = db.collection('parkingSpots').doc(spot.id);
    batch.set(ref, {
      lat: spot.lat,
      lng: spot.lng,
      address: spot.address,
      pricePerHour: spot.pricePerHour,
      status: 'unknown',
      statusUpdatedAt: now,
    });
  }

  await batch.commit();
  console.log(`Importati ${spots.length} parcheggi in Firestore.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

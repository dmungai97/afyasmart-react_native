const fs = require("fs");
const path = require("path");
const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const projectRoot = path.resolve(__dirname, "..");
const seedDir = path.join(projectRoot, "seed-data");

function getProjectId() {
  if (process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT) {
    return process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  }

  const rcPath = path.join(projectRoot, ".firebaserc");
  if (!fs.existsSync(rcPath)) return undefined;

  const rc = JSON.parse(fs.readFileSync(rcPath, "utf8"));
  return rc.projects?.default;
}

function initializeAdmin() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = getProjectId();

  if (serviceAccountPath) {
    const serviceAccount = require(path.resolve(serviceAccountPath));
    initializeApp({ credential: cert(serviceAccount), projectId });
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId });
}

function stableId(item, fallback) {
  const source = item.email || item.phone || item.name || fallback;
  return String(source)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function seedCollection(db, collectionName) {
  const filePath = path.join(seedDir, `${collectionName}.json`);
  const items = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const batchSize = 400;

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = db.batch();
    const chunk = items.slice(index, index + batchSize);

    chunk.forEach((item, offset) => {
      const id = stableId(item, `${collectionName}-${index + offset + 1}`);
      batch.set(db.collection(collectionName).doc(id), {
        ...item,
        seeded_at: new Date(),
      });
    });

    await batch.commit();
  }

  console.log(`Seeded ${items.length} ${collectionName}`);
}

async function main() {
  initializeAdmin();
  const db = getFirestore();

  await seedCollection(db, "doctors");
  await seedCollection(db, "drugs");
  await seedCollection(db, "pharmacies");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

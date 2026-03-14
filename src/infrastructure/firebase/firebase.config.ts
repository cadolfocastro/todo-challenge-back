import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(serviceAccountPath) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    // In Cloud Functions / GCP environments, Application Default Credentials are
    // automatically provided. For local dev, set GOOGLE_APPLICATION_CREDENTIALS.
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }

  console.log('✅ Firebase Admin initialized');
}

export const db = admin.firestore();
export const firebaseAuth = admin.auth();

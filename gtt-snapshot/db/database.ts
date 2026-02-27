import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function initFirebase(): Firestore {
  if (getApps().length === 0) {
    // In production (Firebase App Hosting), ADC is auto-configured.
    // Locally, set GOOGLE_APPLICATION_CREDENTIALS to a service-account key file,
    // or provide FIREBASE_SERVICE_ACCOUNT_JSON as an env var.
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (saJson) {
      const sa: ServiceAccount = JSON.parse(saJson);
      initializeApp({ credential: cert(sa) });
    } else {
      // Uses Application Default Credentials
      initializeApp();
    }
  }
  return getFirestore();
}

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    _db = initFirebase();
  }
  return _db;
}

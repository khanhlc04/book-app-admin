import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { ServiceAccount } from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json';

export const firebaseAdminApp =
    getApps().length > 0
        ? getApp('book-app')
        : initializeApp(
            {
                credential: cert(serviceAccount as ServiceAccount),
            },
            'book-app'
        );
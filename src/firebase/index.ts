'use client';

import { useMemo } from 'react';
import {initializeApp, getApp, getApps, type FirebaseApp} from 'firebase/app';
import {getAuth, type Auth} from 'firebase/auth';
import {getFirestore, type Firestore} from 'firebase/firestore';
import {getStorage, type FirebaseStorage} from 'firebase/storage';
import {firebaseConfig} from '@/firebase/config';

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} | null {
  if (!firebaseConfig) {
    console.warn(
      'Firebase config is not provided. Skipping Firebase initialization.'
    );
    return null;
  }
  const firebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  // Initialize App Check
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey) {
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else {
      console.warn('App Check skipped: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is missing');
    }
  }

  return {firebaseApp, auth, firestore, storage};
}

export const useMemoFirebase = useMemo;

export {FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore, useStorage} from './provider';
export {FirebaseClientProvider} from './client-provider';
export {useUser} from './auth/use-user';
export {useCollection} from './firestore/use-collection';
export {useDoc} from './firestore/use-doc';

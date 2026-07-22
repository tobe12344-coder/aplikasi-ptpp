'use client';

import {
  type Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Login menggunakan akun Google.
 * - Jika user baru (belum ada document di Firestore), return isNewUser: true.
 * - Jika user sudah terdaftar, return isNewUser: false.
 */
export async function loginWithGoogle(auth: Auth) {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Check if user exists in Firestore
  const db = getFirestore(auth.app);
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // User baru, langsung buatkan profil dengan role admin dan status approved
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: 'admin',
      status: 'approved',
      createdAt: new Date().toISOString(),
    });
  }

  return { user, isNewUser: false };
}

/**
 * Logout user dari Firebase Auth.
 */
export async function logout(auth: Auth) {
  await signOut(auth);
}

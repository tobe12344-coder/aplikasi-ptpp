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

  if (!user.email) {
    await signOut(auth);
    throw new Error('Email tidak ditemukan.');
  }

  const db = getFirestore(auth.app);
  
  // 1. Cek apakah email user terdaftar di koleksi 'allowed_emails'
  const allowedRef = doc(db, 'allowed_emails', user.email.toLowerCase());
  const allowedDoc = await getDoc(allowedRef);

  if (!allowedDoc.exists()) {
    // Jika tidak ada di daftar whitelist, paksa logout dan lemparkan error
    await signOut(auth);
    throw new Error('NOT_REGISTERED');
  }

  // 2. Jika diizinkan, pastikan profilnya ada di koleksi 'users'
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
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

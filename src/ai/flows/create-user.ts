
'use server';
/**
 * @fileOverview A server-side flow for securely creating new users.
 * This flow uses the Firebase Admin SDK to bypass client-side limitations,
 * allowing administrators to create accounts with specific roles and statuses.
 *
 * - createUser - The exported function to be called from the client.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountStr) {
      adminApp = initializeApp({
        credential: credential.cert(JSON.parse(serviceAccountStr)),
        projectId: firebaseConfig.projectId,
      });
    } else {
      adminApp = initializeApp({
        credential: credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    // Fallback to application default to prevent crashing on import
    adminApp = initializeApp({
      credential: credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
  }
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

const CreateUserInputSchema = z.object({
  email: z.string().email().describe('Email address for the new user.'),
  password: z.string().min(6).describe('Initial password (min 6 chars).'),
  role: z.enum(['admin', 'employee', 'security', 'receptionist', 'teknik', 'csbr', 'tad', 'ro', 'pp', 'driver']).describe('Assigned system role.'),
  status: z.enum(['pending', 'approved']).describe('Initial account status.'),
  displayName: z.string().optional().describe('Full name of the user.'),
});

const CreateUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

/**
 * Main function to create a user from the admin dashboard.
 */
export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    try {
      // 1. Create the user in Firebase Auth
      const userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName || input.email,
      });

      // 2. Create the user document in Firestore
      const userData = {
        uid: userRecord.uid,
        email: input.email,
        role: input.role,
        status: input.status,
        displayName: input.displayName || input.email,
        photoURL: '',
      };

      await db.collection('users').doc(userRecord.uid).set(userData);

      return { success: true, message: 'User created successfully.' };
    } catch (error: any) {
      console.error('Error in createUserFlow:', error);
      
      // Handle common Firebase Admin errors
      if (error.code === 'auth/email-already-exists') {
        return { success: false, message: 'Email sudah terdaftar di sistem.' };
      }
      
      return { success: false, message: error.message || 'Gagal membuat pengguna baru.' };
    }
  }
);

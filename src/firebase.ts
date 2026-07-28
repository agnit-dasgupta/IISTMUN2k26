/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase client SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);

// Mandated Operation Types for Firebase Security & Debugging
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Mandated error handler to format Firestore "Missing or insufficient permissions" errors.
 * Packs details into a stringified JSON exception for easier system diagnostics.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid ? '***authenticated***' : null,
      email: auth.currentUser?.email ? '***@***' : null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: '***@***',
      })) || []
    },
    operationType,
    path
  };
  console.error(`Firestore Error [${operationType}]: ${errorMessage}`);
  throw new Error(`Firestore operation (${operationType}) failed: ${errorMessage}`);
}

/**
 * Validate connection to Firestore on initial boot.
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('Could not reach Cloud Firestore backend'))) {
      console.warn("Firestore status: Client operating in offline mode or waiting for connection.");
    } else {
      console.warn("Firestore connection check:", error instanceof Error ? error.message : "Connection warning");
    }
  }
}

// Perform boot connection test
testConnection();

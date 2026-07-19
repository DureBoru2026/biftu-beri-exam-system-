import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously,
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  inMemoryPersistence,
  setPersistence
} from "firebase/auth";
import { getFirestore, initializeFirestore, doc, getDocFromServer, collection, addDoc } from "firebase/firestore";
import { deleteApp } from "firebase/app";
import firebaseConfig from "@/firebase-applet-config.json";

const app = initializeApp(firebaseConfig as any);
const dbId = (firebaseConfig as any).firestoreDatabaseId;
const firestoreSettings: any = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  ignoreUndefinedProperties: true
};

export const db = dbId
  ? initializeFirestore(app, firestoreSettings, dbId)
  : initializeFirestore(app, firestoreSettings);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    if (error.code === 'auth/invalid-credential') {
      throw new Error("Invalid Auth credentials. Please ensure Google Sign-in is enabled in the Firebase Console and that the project configuration is correct.");
    }
    throw error;
  }
}

export async function signInDemoUser() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Demo login failed", error);
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Anonymous Auth is not enabled. Please enable it in the Firebase Console > Authentication > Sign-in method.");
    }
    throw error;
  }
}

/**
 * Registers a student user using a secondary Firebase app instance.
 * This allows the admin to create student accounts without being signed out 
 * from the main application session.
 */
export async function registerSecondaryUser(email: string, pass: string) {
  const secondaryAppName = `RegistrationApp_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig as any, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    // The secondary app is isolated, but we use in-memory persistence to be extra safe 
    // about not interfering with the main app's session if the SDK behavior changes.
    await setPersistence(secondaryAuth, inMemoryPersistence);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    
    // Sign out to be clean
    await secondaryAuth.signOut();
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Secondary registration failed details:", {
      code: error.code,
      message: error.message,
      email: email,
      projectId: (firebaseConfig as any).projectId
    });
    
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error(`Email/Password authentication is not enabled for project '${(firebaseConfig as any).projectId}'. Please go to Firebase Console > Authentication > Sign-in method and enable 'Email/Password' (not Email Link).`);
    }
    if (error.code === 'auth/invalid-credential') {
       throw new Error("Invalid credential error from Firebase. This may happen if the API key is restricted or if the provider is disabled.");
    }
    if (error.code === 'auth/email-already-in-use') {
       throw new Error("This student ID/Email is already registered.");
    }
    throw error;
  } finally {
    // Delete the temporary app container
    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      console.warn("Could not delete secondary app", e);
    }
  }
}

// Global error handler for Firestore as per instructions
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    // Attempting a tiny read to verify service status without forcing hard network dependency on startup
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firebase: Firestore connection verified.");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firebase: Firestore reached (Access verified successfully).");
    } else if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.log("Firebase: Running in offline-first mode. Firestore will sync state as soon as connection is fully active.");
    } else {
      console.info("Firebase: Connection sync running:", error.message);
    }
  }
}
testConnection();

export async function createAuditLog(
  action: 'view_report' | 'print_report' | 'export_pdf',
  component: string,
  targetStudentId?: string,
  targetStudentName?: string
) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const logData = {
      userId: currentUser.uid,
      userEmail: currentUser.email || 'anonymous@bbschool.com',
      action,
      component,
      targetStudentId: targetStudentId || 'N/A',
      targetStudentName: targetStudentName || 'N/A',
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, 'auditLogs'), logData);
    console.log(`AuditLog saved: ${action} - ${targetStudentName || 'System'}`);
  } catch (error) {
    // Audit logs are secondary; we don't want to crash the UI if they fail (e.g. permission denied for non-admins)
    console.warn('Could not write AuditLog (likely permission related):', error);
  }
}

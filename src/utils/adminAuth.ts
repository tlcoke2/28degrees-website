import { 
  getAuth, 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  updatePassword as firebaseUpdatePassword,
  createUserWithEmailAndPassword,
  Auth,
  UserCredential
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Firestore,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';

export interface AdminUser extends User {
  isAdmin?: boolean;
  requiresPasswordChange?: boolean;
  lastPasswordChange?: Date;
}

const ADMIN_EMAILS = ['tlcoke@hotmail.com'];

export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

export const getCurrentAdmin = (): Promise<AdminUser | null> => {
  return new Promise((resolve) => {
    const auth: Auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        resolve(null);
        return;
      }

      try {
        // Check if user is in the admin list
        if (!user || !user.email || !isAdminEmail(user.email)) {
          await firebaseSignOut(auth);
          resolve(null);
          return;
        }

        // Get additional admin data from Firestore
        const firestoreDb: Firestore = db as Firestore;
        const userDocRef: DocumentReference<DocumentData> = doc(firestoreDb, 'admins', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Create admin document if it doesn't exist
          await setDoc(userDocRef, {
            email: user.email,
            isAdmin: true,
            requiresPasswordChange: true,
            lastPasswordChange: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        const adminData = userDoc.data();

        resolve({
          ...user,
          isAdmin: true,
          requiresPasswordChange: adminData?.requiresPasswordChange || false,
          lastPasswordChange: adminData?.lastPasswordChange?.toDate()
        } as AdminUser);
      } catch (error) {
        console.error('Error in getCurrentAdmin:', error);
        resolve(null);
      }

      unsubscribe();
    });
  });
};

export const createAdminUser = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!isAdminEmail(email)) {
      throw new Error('Only admin emails are allowed');
    }

    const auth: Auth = getAuth();
    const firestoreDb: Firestore = db as Firestore;
    
    // Check if user already exists
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = userCredential.user;

    // Add admin user to Firestore
    await setDoc(doc(firestoreDb, 'admins', user.uid), {
      email: user.email,
      isAdmin: true,
      requiresPasswordChange: true,
      lastPasswordChange: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, user };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in createAdminUser:', error);
    return { success: false, error: errorMessage };
  }
};

export const updateAdminPassword = async (newPassword: string) => {
  try {
    if (!newPassword) {
      throw new Error('New password is required');
    }

    const auth: Auth = getAuth();
    const user: User | null = auth.currentUser;
    
    if (!user || !user.email || !isAdminEmail(user.email)) {
      throw new Error('No admin user is signed in');
    }

    await firebaseUpdatePassword(user, newPassword);
    
    // Update Firestore with password change
    const firestoreDb: Firestore = db as Firestore;
    await updateDoc(doc(firestoreDb, 'admins', user.uid), {
      requiresPasswordChange: false,
      lastPasswordChange: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in updateAdminPassword:', error);
    return { success: false, error: errorMessage };
  }
};

export const adminSignOut = async () => {
  try {
    const auth: Auth = getAuth();
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in adminSignOut:', error);
    return { success: false, error: errorMessage };
  }
};

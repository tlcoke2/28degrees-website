import { getAuth, User, onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resolve(null);
        return;
      }

      // Check if user is in the admin list
      if (!isAdminEmail(user.email || '')) {
        await signOut(auth);
        resolve(null);
        return;
      }

      // Get additional admin data from Firestore
      const userDoc = await getDoc(doc(db, 'admins', user.uid));
      const adminUser = {
        ...user,
        isAdmin: true,
        requiresPasswordChange: userDoc.data()?.requiresPasswordChange || false,
        lastPasswordChange: userDoc.data()?.lastPasswordChange?.toDate()
      } as AdminUser;

      resolve(adminUser);
      unsubscribe();
    });
  });
};

export const createAdminUser = async (email: string, password: string) => {
  const auth = getAuth();
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create admin document in Firestore
    await setDoc(doc(db, 'admins', user.uid), {
      email: user.email,
      displayName: user.displayName || 'Admin',
      photoURL: user.photoURL || '',
      isAdmin: true,
      requiresPasswordChange: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      lastPasswordChange: null
    });

    return user;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

export const updateAdminPassword = async (newPassword: string) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Update password in Firebase Auth
    await updatePassword(user, newPassword);
    
    // Update last password change timestamp in Firestore
    await updateDoc(doc(db, 'admins', user.uid), {
      lastPasswordChange: serverTimestamp(),
      requiresPasswordChange: false
    });

    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

export const adminSignOut = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);
    // Clear any admin-specific session data here if needed
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

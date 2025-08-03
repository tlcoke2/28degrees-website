import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, updatePassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AdminUser, getCurrentAdmin } from '../utils/adminAuth';

type AdminContextType = {
  admin: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  requiresPasswordChange: boolean;
  updateAdminPassword: (newPassword: string) => Promise<boolean>;
};

const defaultContextValue: AdminContextType = {
  admin: null,
  loading: true,
  isAdmin: false,
  requiresPasswordChange: false,
  updateAdminPassword: async () => {
    throw new Error('Admin context not initialized');
  },
};

const AdminContext = createContext<AdminContextType>(defaultContextValue);

export const useAdmin = () => useContext(AdminContext);

export const useSignOut = () => {
  const { admin } = useAdmin();
  
  const signOut = async () => {
    const auth = getAuth();
    await firebaseSignOut(auth);
    
    // Clear any admin-specific data if needed
    if (admin) {
      // Add any cleanup logic here
    }
    
    return true;
  };
  
  return signOut;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentAdmin = await getCurrentAdmin();
        setAdmin(currentAdmin);
        setIsAdmin(!!currentAdmin?.isAdmin);
        setRequiresPasswordChange(currentAdmin?.requiresPasswordChange || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdmin(null);
        setIsAdmin(false);
        setRequiresPasswordChange(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // Set up auth state listener
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, () => {
      checkAdminStatus();
    });

    return () => unsubscribe();
  }, []);

  // Function to update admin password
  const updateAdminPassword = async (newPassword: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      // Update password in Firebase Auth
      await updatePassword(user, newPassword);
      
      // Update last password change timestamp in Firestore
      if (admin) {
        await updateDoc(doc(db, 'admins', admin.uid), {
          lastPasswordChange: serverTimestamp(),
          requiresPasswordChange: false
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  return (
    <AdminContext.Provider 
      value={{ 
        admin, 
        loading, 
        isAdmin, 
        requiresPasswordChange,
        updateAdminPassword
      }}
    >
      {!loading && children}
    </AdminContext.Provider>
  );
};

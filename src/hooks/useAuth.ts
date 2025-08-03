import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import AuthContext, { AuthContextType } from '../contexts/AuthContext';
import { useContext } from 'react';
import { User } from 'firebase/auth';

// This hook provides authentication state and methods
// It combines the context with any additional Firebase auth methods we need
export const useAuth = () => {
  const context = useContext<AuthContextType | undefined>(AuthContext);
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(auth);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Ensure we have a valid context
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    // From context
    ...context,
    // From firebase hooks
    user: firebaseUser || context.currentUser,
    loading: firebaseLoading || context.loading,
    error: firebaseError,
    // Convenience methods
    isAuthenticated: !!firebaseUser || !!context.currentUser,
    isAdmin: context.isAdmin,
  };
};

export default useAuth;

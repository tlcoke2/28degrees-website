import { useEffect } from 'react';
import { auth } from '../firebase';
import { User } from 'firebase/auth';

const TestFirebaseConfig = () => {
  useEffect(() => {
    console.log('Firebase Auth Object:', auth);
    console.log('Current User:', auth.currentUser);
    
    // Try to listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      console.log('Auth State Changed:', user ? 'User is signed in' : 'No user signed in');
      if (user) {
        console.log('User details:', {
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified,
          providerData: user.providerData
        });
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', margin: '20px' }}>
      <h3>Firebase Configuration Test</h3>
      <p>Check the browser's developer console (F12) for Firebase configuration details.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
        <h4>Current Environment Variables:</h4>
        <pre>{
          JSON.stringify({
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '***' + import.meta.env.VITE_FIREBASE_API_KEY.slice(-4) : 'Not set',
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not set',
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set',
            // Don't show full keys in the UI for security
          }, null, 2)
        }</pre>
      </div>
    </div>
  );
};

export default TestFirebaseConfig;

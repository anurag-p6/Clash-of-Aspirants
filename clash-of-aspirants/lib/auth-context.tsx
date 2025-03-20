"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';

interface User {
  id: string;
  firebaseUid: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  score: number;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setFirebaseUser(authUser);

      if (authUser) {
        try {
          // Always create a fallback user as a backup
          const fallbackUser = {
            id: authUser.uid,
            firebaseUid: authUser.uid,
            email: authUser.email || 'unknown@example.com',
            username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            score: 0
          };

          // Try to fetch user data, with multiple fallbacks
          try {
            // First try direct endpoint with cache control to prevent 404 errors breaking the app
            let response = await fetch(`/api/users/${authUser.uid}`, {
              cache: 'no-store'
            });
            
            // If that fails, try query parameter endpoint as fallback
            if (!response.ok) {
              console.log('Direct user endpoint failed, trying fallback endpoint with query parameter');
              response = await fetch(`/api/users?firebaseUid=${authUser.uid}`, {
                cache: 'no-store'
              });
            }
            
            if (response.ok) {
              try {
                const userData = await response.json();
                // Make sure the user data has all the required fields
                if (userData.user && userData.user.id) {
                  setUser(userData.user);
                } else {
                  console.log('Invalid user data returned from API, using fallback');
                  setUser(fallbackUser);
                }
              } catch (parseError) {
                console.error('Error parsing user data JSON:', parseError);
                setUser(fallbackUser);
              }
            } else {
              // If we can't get user from API, use the fallback user
              console.log('Creating temporary user object from Firebase data');
              setUser(fallbackUser);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Use the fallback user
            setUser(fallbackUser);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { user: authUser } = result;

      if (authUser) {
        try {
          // Check if user exists in your database
          const checkResponse = await fetch(`/api/users/${authUser.uid}`);
        
          if (!checkResponse.ok) {
            try {
              // User doesn't exist, register them
              const registerResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  firebaseUid: authUser.uid,
                  email: authUser.email,
                  username: authUser.displayName || `user${Math.floor(Math.random() * 10000)}`,
                }),
              });

              if (registerResponse.ok) {
                const userData = await registerResponse.json();
                setUser(userData.user);
              }
            } catch (registerError) {
              console.error('Error registering user:', registerError);
              // Create temporary user if API fails
              setUser({
                id: authUser.uid,
                firebaseUid: authUser.uid,
                email: authUser.email || 'unknown@example.com',
                username: authUser.displayName || `user-${authUser.uid.substring(0, 5)}`
              });
            }
          } else {
            // User exists, set user data
            const userData = await checkResponse.json();
            setUser(userData.user);
          }
        } catch (apiError) {
          console.error('API error during sign in:', apiError);
          // Create temporary user if API fails
          setUser({
            id: authUser.uid,
            firebaseUid: authUser.uid,
            email: authUser.email || 'unknown@example.com',
            username: authUser.displayName || `user-${authUser.uid.substring(0, 5)}`
          });
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user: authUser } = userCredential;

      if (authUser) {
        try {
          // Register user in your database
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid: authUser.uid,
              email: authUser.email,
              username,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            // If API fails, create a temporary user
            console.log('API returned error, creating temporary user');
            setUser({
              id: authUser.uid,
              firebaseUid: authUser.uid,
              email: authUser.email || email,
              username
            });
          }
        } catch (apiError) {
          console.error('API error during signup:', apiError);
          // Create temporary user if API fails
          setUser({
            id: authUser.uid,
            firebaseUid: authUser.uid,
            email: authUser.email || email,
            username
          });
        }
      }
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const { user: authUser } = result;
      
      // Manually check the user instead of relying on auth state change listener
      if (authUser) {
        try {
          const response = await fetch(`/api/users/${authUser.uid}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            // If we can't get the user, create a temporary one
            console.log('API returned error, creating temporary user');
            setUser({
              id: authUser.uid,
              firebaseUid: authUser.uid,
              email: authUser.email || email,
              username: authUser.displayName || `user-${authUser.uid.substring(0, 5)}`
            });
          }
        } catch (apiError) {
          console.error('API error during sign in:', apiError);
          // Create temporary user
          setUser({
            id: authUser.uid,
            firebaseUid: authUser.uid,
            email: authUser.email || email,
            username: authUser.displayName || `user-${authUser.uid.substring(0, 5)}`
          });
        }
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
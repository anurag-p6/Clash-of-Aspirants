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

          // Create or update user in the database
          try {
            const createUserResponse = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firebaseUid: authUser.uid,
                email: authUser.email || 'unknown@example.com',
                username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
              }),
            });

            if (createUserResponse.ok) {
              const userData = await createUserResponse.json();
              if (userData.user && userData.user.id) {
                console.log('User created/updated in database:', userData.user);
                setUser(userData.user);
                setLoading(false);
                return;
              } else {
                console.log('User API returned success but with invalid data format, trying fallback endpoints');
              }
            } else {
              console.log('Failed to create/update user in database, status:', createUserResponse.status);
              // Try one more time with different parameters
              try {
                const retryResponse = await fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    firebaseUid: authUser.uid,
                    email: authUser.email || `user-${authUser.uid.substring(0, 5)}@example.com`,
                    username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
                  }),
                });
                
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  if (retryData.user && retryData.user.id) {
                    console.log('User created/updated on retry:', retryData.user);
                    setUser(retryData.user);
                    setLoading(false);
                    return;
                  }
                }
              } catch (retryError) {
                console.error('Error on retry of user creation:', retryError);
              }
              console.log('Failed to create/update user after retry, trying fallback endpoints');
            }
          } catch (createError) {
            console.error('Error creating/updating user in database:', createError);
          }

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
          // Create or update user in our database
          const registerResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid: authUser.uid,
              email: authUser.email || 'unknown@example.com',
              username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
            }),
          });

          if (registerResponse.ok) {
            const userData = await registerResponse.json();
            setUser(userData.user);
          } else {
            console.error('Failed to register user in database');
            // Create temporary user
            setUser({
              id: authUser.uid,
              firebaseUid: authUser.uid,
              email: authUser.email || 'unknown@example.com',
              username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              score: 0
            });
          }
        } catch (apiError) {
          console.error('API error during sign in:', apiError);
          // Create temporary user if API fails
          setUser({
            id: authUser.uid,
            firebaseUid: authUser.uid,
            email: authUser.email || 'unknown@example.com',
            username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            score: 0
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
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid: authUser.uid,
              email: authUser.email || email,
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
              username,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              score: 0
            });
          }
        } catch (apiError) {
          console.error('API error during signup:', apiError);
          // Create temporary user if API fails
          setUser({
            id: authUser.uid,
            firebaseUid: authUser.uid,
            email: authUser.email || email,
            username,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            score: 0
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
      
      // Create or update user in the database
      if (authUser) {
        try {
          // Create or update user in our database
          const registerResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebaseUid: authUser.uid,
              email: authUser.email || email,
              username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
            }),
          });

          if (registerResponse.ok) {
            const userData = await registerResponse.json();
            setUser(userData.user);
          } else {
            console.error('Failed to update user in database during signin');
            // Create temporary user
            setUser({
              id: authUser.uid,
              firebaseUid: authUser.uid,
              email: authUser.email || email,
              username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              score: 0
            });
          }
        } catch (apiError) {
          console.error('API error during sign in:', apiError);
          // Create temporary user
          setUser({
            id: authUser.uid,
            firebaseUid: authUser.uid,
            email: authUser.email || email,
            username: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            score: 0
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
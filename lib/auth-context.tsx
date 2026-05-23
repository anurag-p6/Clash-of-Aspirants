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

async function syncDatabaseUser(
  authUser: FirebaseUser,
  usernameOverride?: string
): Promise<User | null> {
  const payload = {
    firebaseUid: authUser.uid,
    email: authUser.email || `user-${authUser.uid.substring(0, 5)}@example.com`,
    username:
      usernameOverride ||
      authUser.displayName ||
      `User-${authUser.uid.substring(0, 5)}`,
  };

  try {
    const createResponse = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (createResponse.ok) {
      const data = await createResponse.json();
      if (data.user?.id) return data.user;
    }
  } catch (error) {
    console.error("Error syncing user to database:", error);
  }

  try {
    const fetchResponse = await fetch(`/api/users/${authUser.uid}`, {
      cache: "no-store",
    });
    if (fetchResponse.ok) {
      const data = await fetchResponse.json();
      if (data.user?.id) return data.user;
    }
  } catch (error) {
    console.error("Error fetching user from database:", error);
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setFirebaseUser(authUser);

      if (authUser) {
        const dbUser = await syncDatabaseUser(authUser);
        if (!dbUser) {
          console.error(
            "Firebase user is signed in but no database profile exists. Sign out and sign in again."
          );
        }
        setUser(dbUser);
        setLoading(false);
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
        const dbUser = await syncDatabaseUser(authUser);
        if (!dbUser) {
          throw new Error("Could not sync your account to the database. Please try again.");
        }
        setUser(dbUser);
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
        const dbUser = await syncDatabaseUser(authUser, username);
        if (!dbUser) {
          throw new Error("Could not create your account in the database. Please try again.");
        }
        setUser(dbUser);
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
        const dbUser = await syncDatabaseUser(authUser);
        if (!dbUser) {
          throw new Error("Could not sync your account to the database. Please try again.");
        }
        setUser(dbUser);
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
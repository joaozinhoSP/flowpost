import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface UserStatus {
  uid: string;
  email: string;
  planId: string;
  subscriptionId: string | null;
  status: string;
  postsUsed: number;
  postsLimit: number;
  canPost: boolean;
}

interface AuthContextType {
  user: User | null;
  status: UserStatus | null;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  loginWithProvider: (provider: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchStatus(firebaseUser);
      } else {
        setStatus(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function fetchStatus(firebaseUser: User) {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/user/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function refreshStatus() {
    if (!user) return;
    await fetchStatus(user);
  }

  async function loginWithProvider(provider: any) {
    try {
      setError(null);
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function logout() {
    await signOut(auth);
    setStatus(null);
  }

  return (
    <AuthContext.Provider value={{ user, status, loading, error, refreshStatus, loginWithProvider, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

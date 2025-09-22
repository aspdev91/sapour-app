import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from './api-client';
import { supabase } from './supabase';

interface AuthContextType {
  user: { email: string; userId: string } | null;
  loading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<{ email: string; userId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      // For now, we'll get user info from Supabase directly
      // The backend /auth/me endpoint can be used for additional validation if needed
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        setUser({
          email: user.email!,
          userId: user.id,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    // Listen for Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session) {
        // User signed in with Supabase, now check allowlist
        await checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
      }
    });

    // Initial check
    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    checkAuth,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

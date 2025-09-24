import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from './api-client';
import { supabase } from './supabase';

interface AuthContextType {
  user: { email: string; userId: string; hasAccess: boolean } | null;
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
  const [user, setUser] = useState<{ email: string; userId: string; hasAccess: boolean } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Checking authentication...');

      // Use Supabase as the single source of truth for auth state
      console.log('Checking Supabase session...');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn('Supabase session error:', sessionError);
        throw sessionError;
      }

      console.log('Session result:', { hasSession: !!session });

      if (session) {
        // User is signed in with Supabase, get additional info from backend
        console.log('Getting user info from backend...');
        const userResponse = await authApi.getCurrentUser();
        console.log('User response:', userResponse);
        setUser(userResponse);
      } else {
        console.log('No session found');
        setUser(null);
      }
    } catch (err) {
      console.error('checkAuth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setUser(null);
    } finally {
      console.log('checkAuth completed');
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    let isInitialCheck = true;

    // Listen for Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Supabase auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session && session.user.id !== currentSessionUserId) {
        setCurrentSessionUserId(session.user.id);
        await checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setCurrentSessionUserId(null);
        setUser(null);
        setError(null);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION' && isInitialCheck) {
        isInitialCheck = false;
        if (session) {
          setCurrentSessionUserId(session.user.id);
          await checkAuth();
        } else {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [currentSessionUserId]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    checkAuth,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

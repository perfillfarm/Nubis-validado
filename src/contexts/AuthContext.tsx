import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = authService.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const adminStatus = await authService.checkIsAdmin(session.user.id);
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const session = await authService.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const adminStatus = await authService.checkIsAdmin(session.user.id);
        setIsAdmin(adminStatus);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: authUser } = await authService.login(email, password);
      if (authUser) {
        const adminStatus = await authService.checkIsAdmin(authUser.id);
        if (!adminStatus) {
          await authService.logout();
          throw new Error('Acesso negado. Você não tem permissão de administrador.');
        }
        setIsAdmin(true);
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

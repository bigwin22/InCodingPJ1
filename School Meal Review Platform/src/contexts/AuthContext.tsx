import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const createUserFromSession = (session: Session): User => {
    const { user: sbUser } = session;
    return {
        id: sbUser.id,
        google_id: sbUser.identities?.[0]?.id || 'unknown',
        email: sbUser.email || '',
        name: sbUser.user_metadata.full_name || sbUser.user_metadata.name || sbUser.email?.split('@')[0] || '사용자',
        school_code: undefined,
        school_name: undefined 
    };
  };

  useEffect(() => {
    console.log("AuthProvider: Initializing...");
    console.log("AuthProvider: Current URL:", window.location.href);
    console.log("AuthProvider: URL Hash:", window.location.hash);

    // 1. 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("AuthProvider: Initial session check:", session ? "Found" : "None");
      if (error) console.error("AuthProvider: Session check error:", error);

      if (session) {
        console.log("AuthProvider: Session data:", {
          user_id: session.user.id,
          email: session.user.email,
          expires_at: new Date(session.expires_at! * 1000).toISOString(),
        });
        setSession(session);
        setUser(createUserFromSession(session));
        syncWithBackend(session);
      } else {
        setIsLoading(false);
      }
    });

    // 2. 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthProvider: Auth State Change Event:", event);
      console.log("AuthProvider: Session:", session ? "Present" : "None");

      setSession(session);
      if (session) {
        console.log("AuthProvider: User logged in:", session.user.email);
        setUser(createUserFromSession(session));
        syncWithBackend(session);
      } else {
        console.log("AuthProvider: User logged out");
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  const syncWithBackend = async (session: Session) => {
    try {
        const accessToken = session.access_token;
        const backendUser = await api.getMe(accessToken);
        
        if (backendUser) {
            console.log("AuthProvider: Backend sync success");
            setUser(backendUser);
        }
    } catch (error) {
        console.error("AuthProvider: Backend sync error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const login = async () => {
    console.log("AuthProvider: Starting OAuth login...");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
      });
      if (error) throw error;
    } catch (error) {
        console.error("AuthProvider: Login error", error);
        alert("로그인 요청 중 오류가 발생했습니다.");
    }
  };

  const logout = async () => {
    try {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    } catch (error) {
        console.error("AuthProvider: Logout error", error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        token: session?.access_token || null, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout, 
        updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
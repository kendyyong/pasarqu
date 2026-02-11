import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

// Tipe data Context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null; // Data tambahan dari tabel profiles
  isAdmin: boolean;
  isMerchant: boolean;
  isCourier: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshProfile: () => Promise<void>; // Fungsi untuk reload manual
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. FUNGSI FETCH PROFILE (YANG DIPERBAIKI)
  const fetchProfile = async (userId: string) => {
    try {
      // PERBAIKAN DISINI: Ganti .single() menjadi .maybeSingle()
      // .maybeSingle() tidak akan error 406 jika data belum ada
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); 

      if (error) {
        console.error("Gagal load profil:", error.message);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Auth Context Error:", err);
    }
  };

  useEffect(() => {
    // Cek sesi saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listener perubahan auth (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Ambil profil jika login
        fetchProfile(session.user.id);
      } else {
        // Kosongkan profil jika logout
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper Roles
  const isAdmin = profile?.role === 'LOCAL_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const isMerchant = profile?.role === 'MERCHANT';
  const isCourier = profile?.role === 'COURIER';

  // Login Manual
  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });

    if (error) throw error;
    return !!data.session;
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  // Refresh Profile Manual (Dipakai setelah update data)
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ 
        session, user, profile, 
        isAdmin, isMerchant, isCourier, 
        login, logout, loading, refreshProfile 
    }}>
      {!loading && children}
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
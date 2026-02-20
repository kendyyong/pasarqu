import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session, User } from "@supabase/supabase-js";

// Tipe data Context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  isMerchant: boolean;
  isCourier: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. FUNGSI FETCH PROFILE (Ditingkatkan untuk deteksi Merchant ID)
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Gagal load profil:", error.message);
      } else {
        // Jika user adalah Merchant, pastikan statusnya sudah APPROVED
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper Roles - Dibuat lebih ketat
  const isAdmin =
    profile?.role === "LOCAL_ADMIN" || profile?.role === "SUPER_ADMIN";

  // ✅ PENTING: Hanya dianggap Merchant jika role benar DAN status sudah APPROVED
  const isMerchant =
    profile?.role === "MERCHANT" && profile?.status === "APPROVED";

  const isCourier =
    profile?.role === "COURIER" && profile?.status === "APPROVED";

  // Login Manual
  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: pass,
    });

    if (error) throw error;
    return !!data.session;
  };

  // ✅ FULL LOGOUT SCRIPT
  const logout = async () => {
    try {
      const currentMarketId = profile?.managed_market_id || profile?.market_id;

      if (currentMarketId) {
        localStorage.setItem("active_market_id", currentMarketId);
      }

      await supabase.auth.signOut();

      setSession(null);
      setUser(null);
      setProfile(null);

      window.location.href = "/";
    } catch (error) {
      console.error("Error saat logout:", error);
      window.location.href = "/";
    }
  };

  // Refresh Profile Manual
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        isMerchant,
        isCourier,
        login,
        logout,
        loading,
        refreshProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

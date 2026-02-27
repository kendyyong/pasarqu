import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 🚀 Ambil role terbaru dan paksa ke HURUF BESAR agar sinkron dengan kodingan
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        // Default ke CUSTOMER jika data role kosong di database
        const fetchedRole = (data?.role || "CUSTOMER").toUpperCase();
        setRole(fetchedRole);
      } catch (err) {
        console.error("Error checking role:", err);
        setRole("CUSTOMER");
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  // TAMPILKAN LOADING GAHAR SAAT CEK TIKET MASUK
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2
          className="animate-spin text-[#008080]"
          size={40}
          strokeWidth={3}
        />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Memvalidasi Akses...
        </p>
      </div>
    );
  }

  // 1. Jika belum login, tendang ke login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. SUPER ADMIN (GOD MODE) - Bebas akses jalur mana pun
  if (role === "SUPER_ADMIN") return children;

  // 3. PROSES VALIDASI ROLE (Anti Gagal Huruf Besar/Kecil)
  // Kita samakan semua ke huruf besar sebelum dibandingkan
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toUpperCase());

  if (role && !normalizedAllowedRoles.includes(role)) {
    console.warn(
      `🚨 AKSES DITOLAK: Role [${role}] mencoba masuk ke area yang butuh [${allowedRoles}]`,
    );

    // JIKA SALAH KAMAR, KEMBALIKAN KE MARKAS MASING-MASING
    if (role === "MERCHANT")
      return <Navigate to="/merchant-dashboard" replace />;
    if (role === "COURIER") return <Navigate to="/courier-dashboard" replace />;
    if (role === "LOCAL_ADMIN") return <Navigate to="/admin-wilayah" replace />;

    // Default: Lempar ke customer dashboard
    return <Navigate to="/customer-dashboard" replace />;
  }

  // 4. Lolos sensor! Silakan masuk Bos CEO!
  return children;
};

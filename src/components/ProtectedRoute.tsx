import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext"; // Mundur satu folder ke contexts
import { supabase } from "../lib/supabaseClient"; // Mundur satu folder ke lib

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      // Cek role terbaru langsung dari database
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setRole(data?.role || "CUSTOMER");
      setLoading(false);
    };

    checkUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );
  }

  // 1. Kalau belum login, tendang ke halaman login
  if (!user) return <Navigate to="/login" replace />;

  // 2. SUPER ADMIN (GOD MODE) - Bebas masuk kemana saja
  if (role === "SUPER_ADMIN") return children;

  // 3. Cek apakah role user ada di daftar yang diizinkan
  if (role && !allowedRoles.includes(role)) {
    // Jika salah kamar, kembalikan ke dashboard asli mereka
    if (role === "MERCHANT")
      return <Navigate to="/merchant-dashboard" replace />;
    if (role === "COURIER") return <Navigate to="/courier-dashboard" replace />;
    if (role === "LOCAL_ADMIN") return <Navigate to="/admin-wilayah" replace />;

    // Default lempar ke customer dashboard
    return <Navigate to="/customer-dashboard" replace />;
  }

  // 4. Jika lolos pengecekan, silakan masuk
  return children;
};

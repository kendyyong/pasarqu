import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

// ✅ KABEL PENTING: Mengimpor MarketplaceApp dari folder pages
import { MarketplaceApp } from "../pages/MarketplaceApp";

export const RoleBasedRedirect = () => {
  const { profile, loading, user } = useAuth();

  // 1. TAMPILAN LOADING
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans text-teal-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  // 2. JIKA BELUM LOGIN, TAMPILKAN MARKETPLACE (Bebas lihat barang)
  if (!user) return <MarketplaceApp />;

  // 🚀 3. LOGIKA PINTAR: CEK KTP DAN STATUS VERIFIKASI
  switch (profile?.role) {
    case "SUPER_ADMIN":
      return <Navigate to="/super-admin" replace />;

    case "MERCHANT":
      // ✅ JIKA SUDAH DI-ACC ADMIN -> Masuk Dashboard Toko
      if (profile.is_verified === true) {
        return <Navigate to="/merchant-dashboard" replace />;
      }
      // ⏳ JIKA BELUM DI-ACC -> Biarkan di Halaman Belanja
      return <MarketplaceApp />;

    case "COURIER":
      // ✅ JIKA SUDAH DI-ACC ADMIN -> Masuk Dashboard Kurir
      if (profile.is_verified === true) {
        return <Navigate to="/courier-dashboard" replace />;
      }
      // ⏳ JIKA BELUM DI-ACC -> Biarkan di Halaman Belanja
      return <MarketplaceApp />;

    case "LOCAL_ADMIN":
      return <Navigate to="/admin-wilayah" replace />;

    default:
      // USER BIASA / PEMBELI -> Tampilkan Halaman Belanja Utama
      return <MarketplaceApp />;
  }
};

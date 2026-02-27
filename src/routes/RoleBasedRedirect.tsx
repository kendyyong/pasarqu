import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

// ✅ KABEL PENTING: Mengimpor MarketplaceApp dari folder pages
import { MarketplaceApp } from "../pages/MarketplaceApp";

export const RoleBasedRedirect = () => {
  const { profile, loading, user } = useAuth();
  const location = useLocation();

  // 1. TAMPILAN LOADING
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans text-teal-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  // 2. JIKA BELUM LOGIN, TAMPILKAN MARKETPLACE (Bebas lihat barang)
  if (!user) return <MarketplaceApp />;

  // 🚀 3. SATPAM PINTAR (DUAL-MODE UNTUK MERCHANT & KURIR)
  // Cek apakah Bos membawa "Kunci Pass" (mode=belanja di URL atau di Session Storage)
  const searchParams = new URLSearchParams(location.search);
  const isShopMode =
    searchParams.get("mode") === "belanja" ||
    sessionStorage.getItem("app_mode") === "belanja";

  if (isShopMode) {
    // Simpan kunci pass di saku (session) biar aman pas HP di-refresh
    sessionStorage.setItem("app_mode", "belanja");
    return <MarketplaceApp />;
  }

  // 4. LOGIKA NORMAL (Redirect ke Dashboard masing-masing saat pertama login)
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

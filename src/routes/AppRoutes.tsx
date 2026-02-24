import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

// --- HOOKS & REDIRECT ---
import { useMarketCheck } from "../hooks/useMarketCheck";
import { RoleBasedRedirect } from "./RoleBasedRedirect";

// --- PAGES DASAR ---
import { MarketSelectionPage } from "../pages/market-selection/MarketSelectionPage";

// --- IMPORT PAGES BARU (Agar Jalur Tersambung) ---
import { HelpCenterPage } from "../pages/info/HelpCenterPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { MerchantLoginPage } from "../pages/auth/MerchantLoginPage";
import { CourierLoginPage } from "../pages/auth/CourierLoginPage";

// --- IMPORT SECTIONS (Rute yang sudah dipisah) ---
import { AuthRoutes } from "./sections/AuthRoutes";
import { CustomerRoutes } from "./sections/CustomerRoutes";
import { PartnerRoutes } from "./sections/PartnerRoutes";
import { AdminRoutes } from "./sections/AdminRoutes";

export const AppRoutes = () => {
  const location = useLocation();
  const { isChecking, selectedMarket } = useMarketCheck();

  // 1. LOADING STATE (Tetap sesuai aslinya)
  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-white font-black uppercase text-[#008080]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p className="text-[10px] tracking-[0.3em]">
            MENGHUBUNGKAN KE SERVER...
          </p>
        </div>
      </div>
    );
  }

  // 2. LOGIKA BYPASS PASAR (Menambah jalur tanpa mengubah desain)
  const bypassRoutes = [
    "/login",
    "/register",
    "/verify-otp",
    "/complete-profile",
    "/terms",
    "/privacy",
    "/register-merchant",
    "/portal",
    "/admin",
    "/admin-wilayah",
    "/waiting-approval",
    "/track-order",
    "/merchant-promo",
    "/promo/kurir",
    "/select-market",
    "/invoice",
    "/pasarqu-pay",
    "/terms-cashback",
    "/order-history",
    "/settings/address",
    "/info",
  ];

  const isBypassRoute = bypassRoutes.some((route) =>
    location.pathname.startsWith(route),
  );
  const isCheckoutPage = location.pathname === "/checkout";

  // 3. PROTEKSI PEMILIHAN PASAR
  if (!selectedMarket && !isBypassRoute && !isCheckoutPage) {
    return <MarketSelectionPage />;
  }

  return (
    <Routes>
      {/* --- RUTE UTAMA & REDIRECT --- */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/select-market" element={<MarketSelectionPage />} />

      {/* --- PENDAFTARAN JALUR (MENGHUBUNGKAN TOMBOL PORTAL KE FILE MASING-MASING) --- */}
      <Route path="/info/bantuan" element={<HelpCenterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/toko" element={<MerchantLoginPage />} />
      <Route path="/login/kurir" element={<CourierLoginPage />} />

      {/* --- PENGGABUNGAN SEMUA SEKSI RUTE --- */}
      {AuthRoutes()}
      {CustomerRoutes()}
      {PartnerRoutes()}
      {AdminRoutes()}

      {/* --- 404 FALLBACK --- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

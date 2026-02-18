import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

// --- HOOKS & REDIRECT ---
import { useMarketCheck } from "../hooks/useMarketCheck";
import { RoleBasedRedirect } from "./RoleBasedRedirect";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";

// --- PAGES IMPORTS ---
import { MarketSelectionPage } from "../pages/market-selection/MarketSelectionPage";
import { PortalLoginPage } from "../pages/auth/PortalLoginPage";
import { AuthPage } from "../pages/auth/AuthPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { RegisterMerchantPage } from "../pages/auth/RegisterMerchantPage";
import { WaitingApprovalPage } from "../pages/auth/WaitingApprovalPage";
import { MerchantPromoPage } from "../pages/merchant/components/MerchantPromoPage";
import { CourierPromoPage } from "../pages/courier/components/CourierPromoPage";
import { ShopDetail } from "../pages/customer/ShopDetail";
import { ProductDetail } from "../pages/customer/ProductDetail";
import { OrderTrackingPage } from "../pages/customer/OrderTrackingPage";
import { MerchantDashboard } from "../pages/merchant/MerchantDashboard";
import { CourierDashboard } from "../pages/courier/CourierDashboard";
import { CustomerDashboard } from "../pages/customer/CustomerDashboard";
import { LocalAdminDashboard } from "../pages/admin/local-admin/LocalAdminDashboard";
import { SuperAdminDashboard } from "../pages/admin/super-admin/SuperAdminDashboard";
import { ShippingConfig } from "../pages/admin/super-admin/components/ShippingConfig";

// ✅ IMPORT HALAMAN CHAT
import { ChatPage } from "../pages/chat/ChatPage";
import { ChatRoom } from "../pages/chat/ChatRoom";

import {
  MerchantLogin,
  CourierLogin,
  AdminLogin,
  SuperAdminLogin,
} from "../pages/auth/PartnerLoginPages";

export const AppRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isChecking, selectedMarket } = useMarketCheck();

  if (isChecking)
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans text-teal-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  // --- 🛠️ DAFTAR JALUR BEBAS (BYPASS) ---
  const bypassRoutes = [
    "/login",
    "/register",
    "/register-merchant",
    "/portal",
    "/super-admin",
    "/admin",
    "/waiting-approval",
    "/track-order",
    "/merchant-promo",
    "/promo/kurir",
    "/select-market",
    "/chat", // ✅ TAMBAHKAN INI AGAR TIDAK KEDIP
  ];

  const isBypassRoute = bypassRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  // Logika: Jika belum pilih pasar dan bukan jalur bypass, paksa ke halaman pilih pasar
  if (!selectedMarket && !isBypassRoute) return <MarketSelectionPage />;

  return (
    <Routes>
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/select-market" element={<MarketSelectionPage />} />

      {/* --- ✅ RUTE CHAT (REALTIME) --- */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute
            allowedRoles={[
              "CUSTOMER",
              "MERCHANT",
              "COURIER",
              "LOCAL_ADMIN",
              "SUPER_ADMIN",
            ]}
          >
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:roomId"
        element={
          <ProtectedRoute
            allowedRoles={[
              "CUSTOMER",
              "MERCHANT",
              "COURIER",
              "LOCAL_ADMIN",
              "SUPER_ADMIN",
            ]}
          >
            <ChatRoom />
          </ProtectedRoute>
        }
      />

      {/* --- RUTE AUTH --- */}
      <Route path="/portal" element={<PortalLoginPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/login/master" element={<SuperAdminLogin />} />
      <Route path="/login/toko" element={<MerchantLogin />} />
      <Route path="/login/kurir" element={<CourierLogin />} />
      <Route path="/login/admin-wilayah" element={<AdminLogin />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-merchant" element={<RegisterMerchantPage />} />
      <Route path="/waiting-approval" element={<WaitingApprovalPage />} />

      {/* --- RUTE FITUR --- */}
      <Route path="/merchant-promo" element={<MerchantPromoPage />} />
      <Route path="/promo/kurir" element={<CourierPromoPage />} />
      <Route path="/shop/:merchantId" element={<ShopDetail />} />
      <Route path="/product/:productId" element={<ProductDetail />} />

      <Route
        path="/track-order/:orderId"
        element={
          <ProtectedRoute
            allowedRoles={["CUSTOMER", "SUPER_ADMIN", "COURIER", "MERCHANT"]}
          >
            <OrderTrackingPage />
          </ProtectedRoute>
        }
      />

      {/* --- DASHBOARDS --- */}
      <Route
        path="/merchant-dashboard"
        element={
          <ProtectedRoute allowedRoles={["MERCHANT"]}>
            <MerchantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courier-dashboard"
        element={
          <ProtectedRoute allowedRoles={["COURIER"]}>
            <CourierDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-dashboard"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-wilayah"
        element={
          <ProtectedRoute allowedRoles={["LOCAL_ADMIN"]}>
            <LocalAdminDashboard onBack={() => navigate("/")} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shipping-config"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <ShippingConfig
              theme={{
                bg: "bg-white",
                text: "text-slate-900",
                subText: "text-slate-400",
                border: "border-slate-100",
                card: "bg-white",
              }}
            />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

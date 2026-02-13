import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

// --- CONTEXTS ---
import { ConfigProvider } from "./contexts/ConfigContext";
import { MarketProvider, useMarket } from "./contexts/MarketContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";

// PERBAIKAN DI SINI: Alamat disetel ke level yang benar
import { supabase } from "./lib/supabaseClient";

// --- HOOKS ---
import { useMarketCheck } from "./hooks/useMarketCheck";

// --- COMPONENTS ---
import { MobileLayout } from "./components/MobileLayout";
import { HeroOnboarding } from "./components/HeroOnboarding";
import { GhostBar } from "./components/GhostBar";
import { CartDrawer } from "./components/CartDrawer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppHeader } from "./components/AppHeader";
import { HomeMenuGrid } from "./components/HomeMenuGrid";

// --- PAGES ---
import { Home } from "./pages/Home";
import { LocalAdminDashboard } from "./pages/admin/LocalAdminDashboard";
import { SuperAdminDashboard } from "./pages/admin/SuperAdminDashboard";
import { MerchantDashboard } from "./pages/merchant/MerchantDashboard";
import { CourierDashboard } from "./pages/courier/CourierDashboard";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { ShopDetail } from "./pages/customer/ShopDetail";
import { ProductDetail } from "./pages/customer/ProductDetail";
import { OrderTrackingPage } from "./pages/customer/OrderTrackingPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { WaitingApprovalPage } from "./pages/auth/WaitingApprovalPage";
import { PortalLoginPage } from "./pages/auth/PortalLoginPage";
import { MerchantPromoPage } from "./pages/promo/MerchantPromoPage";
import { CourierPromoPage } from "./pages/promo/CourierPromoPage";
import { AdminPromoPage } from "./pages/promo/AdminPromoPage";
import { MarketSelectionPage } from "./pages/MarketSelection/MarketSelectionPage";
import { CheckoutPaymentPage } from "./pages/checkout/CheckoutPaymentPage";

// --- NEW FEATURES ---
import { ManageAds } from "./pages/admin/super-features/ManageAds";

import {
  MerchantLogin,
  CourierLogin,
  AdminLogin,
  SuperAdminLogin,
} from "./pages/auth/PartnerLoginPages";

// --- PENGARAH JALAN OTOMATIS ---
const RoleBasedRedirect = () => {
  const { profile, loading, user } = useAuth();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  if (!user) return <MarketplaceApp />;

  switch (profile?.role) {
    case "SUPER_ADMIN":
      return <Navigate to="/super-admin" replace />;
    case "MERCHANT":
      return <Navigate to="/merchant-dashboard" replace />;
    case "COURIER":
      return <Navigate to="/courier-dashboard" replace />;
    case "LOCAL_ADMIN":
      return <Navigate to="/admin-wilayah" replace />;
    default:
      return <MarketplaceApp />;
  }
};

// --- KOMPONEN MARKETPLACE (HOME) ---
const MarketplaceApp = () => {
  const { user } = useAuth();
  const marketContext = useMarket();
  const navigate = useNavigate();

  const cart = marketContext?.cart || [];
  const updateQty = marketContext?.updateQty || (() => {});
  const removeFromCart = marketContext?.removeFromCart || (() => {});

  const [activeTab, setActiveTab] = useState<
    "home" | "search" | "orders" | "account"
  >("home");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState<string>("Tamu");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        setUserName(
          profileData?.full_name || user.email?.split("@")[0] || "User",
        );
        setUserAvatar(profileData?.avatar_url || null);
      }
    };
    fetchUserData();
  }, [user]);

  return (
    /* PERBAIKAN BACKGROUND: bg-white untuk menghapus warna abu-abu */
    <div className="bg-white min-h-screen">
      <MobileLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={setSearchQuery}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={totalCartCount}
      >
        <AppHeader
          userName={userName}
          userAvatar={userAvatar}
          cartCount={totalCartCount}
          onCartClick={() => setIsCartOpen(true)}
          onSearch={setSearchQuery}
          onUserClick={() =>
            user ? navigate("/customer-dashboard") : navigate("/login")
          }
        />

        {/* STRUKTUR FULL LEBAR (PONSEL):
            - px-0: Menghapus sisa ruang di kiri kanan ponsel secara total.
            - md:px-5: Hanya memberikan jarak/sejajar saat di layar desktop.
            - bg-white: Memastikan latar belakang bersih.
        */}
        <div className="w-full max-w-[1200px] mx-auto px-0 md:px-5 bg-white">
          {!searchQuery && (
            <>
              {/* Iklan Utama - Full Mentok */}
              <HeroOnboarding />

              {/* Panel Cepat - Full Lebar di HP */}
              <div className="mt-0">
                <HomeMenuGrid />
              </div>
            </>
          )}

          {/* Katalog Produk & Portal - Full Lebar di HP */}
          <Home searchQuery={searchQuery} />
        </div>

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onCheckout={() => {
            setIsCartOpen(false);
            setTimeout(() => setIsCheckoutOpen(true), 300);
          }}
        />
        <CheckoutPaymentPage
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </MobileLayout>
    </div>
  );
};

// --- LOGIKA ROUTING UTAMA ---
const MainContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isChecking, selectedMarket } = useMarketCheck();

  if (isChecking)
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-teal-600" size={40} />
      </div>
    );

  const bypassRoutes = [
    "/login",
    "/register",
    "/portal",
    "/promo",
    "/super-admin",
    "/waiting-approval",
    "/login/master",
    "/track-order",
  ];
  const isBypassRoute = bypassRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  if (!selectedMarket && !isBypassRoute) return <MarketSelectionPage />;

  return (
    <Routes>
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/portal" element={<PortalLoginPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/login/master" element={<SuperAdminLogin />} />
      <Route path="/login/toko" element={<MerchantLogin />} />
      <Route path="/login/kurir" element={<CourierLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/waiting-approval" element={<WaitingApprovalPage />} />
      <Route path="/promo/toko" element={<MerchantPromoPage />} />
      <Route path="/promo/kurir" element={<CourierPromoPage />} />
      <Route path="/promo/admin" element={<AdminPromoPage />} />
      <Route path="/shop/:merchantId" element={<ShopDetail />} />
      <Route path="/product/:productId" element={<ProductDetail />} />

      <Route
        path="/track-order/:orderId"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN", "COURIER"]}>
            <OrderTrackingPage />
          </ProtectedRoute>
        }
      />

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
        path="/super-admin/manage-ads"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <ManageAds />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/*"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <ToastProvider>
    <ConfigProvider>
      <MarketProvider>
        <AuthProvider>
          <ChatProvider>
            <Router>
              <GhostBar />
              <MainContent />
            </Router>
          </ChatProvider>
        </AuthProvider>
      </MarketProvider>
    </ConfigProvider>
  </ToastProvider>
);

export default App;

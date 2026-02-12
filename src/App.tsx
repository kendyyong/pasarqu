import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

// --- CONTEXTS ---
import { ConfigProvider } from "./contexts/ConfigContext";
import { MarketProvider, useMarket } from "./contexts/MarketContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";
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
import { AuthPage } from "./pages/auth/AuthPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { WaitingApprovalPage } from "./pages/auth/WaitingApprovalPage";
import { PortalLoginPage } from "./pages/auth/PortalLoginPage";
import { MerchantPromoPage } from "./pages/promo/MerchantPromoPage";
import { CourierPromoPage } from "./pages/promo/CourierPromoPage";
import { AdminPromoPage } from "./pages/promo/AdminPromoPage";
import { MarketSelectionPage } from "./pages/MarketSelection/MarketSelectionPage";
import { CheckoutPaymentPage } from "./pages/checkout/CheckoutPaymentPage";

// IMPORT HALAMAN MASTER ADMIN
import { ManageQuickActions } from "./pages/admin/super-features/ManageQuickActions";

import {
  MerchantLogin,
  CourierLogin,
  AdminLogin,
  SuperAdminLogin, // <--- INI ADALAH KOMPONEN GOD MODE
} from "./pages/auth/PartnerLoginPages";

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
          .select("name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        setUserName(profileData?.name || user.email?.split("@")[0] || "User");
        setUserAvatar(profileData?.avatar_url || null);
      }
    };
    fetchUserData();
  }, [user]);

  const handleCheckoutProcess = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setIsCartOpen(false);
    setTimeout(() => {
      setIsCheckoutOpen(true);
    }, 300);
  };

  return (
    <MobileLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSearch={setSearchQuery}
      onCartClick={() => setIsCartOpen(true)}
      cartCount={totalCartCount}
    >
      <div className="bg-[#f5f5f5] min-h-screen text-left pt-[86px] md:pt-[105px]">
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
        {!searchQuery && (
          <>
            <HeroOnboarding />
            <HomeMenuGrid />
          </>
        )}
        <Home searchQuery={searchQuery} />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onCheckout={handleCheckoutProcess}
        />

        <CheckoutPaymentPage
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </div>
    </MobileLayout>
  );
};

// --- MAIN ROUTING LOGIC ---
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
  ];
  const isBypassRoute = bypassRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  // LOGIKA BYPASS UNTUK RUTE RAHASIA (LANGSUNG KE GOD MODE)
  if (location.pathname === "/login/master") {
    return (
      <Routes>
        <Route path="/login/master" element={<SuperAdminLogin />} />
      </Routes>
    );
  }

  if (!selectedMarket && !isBypassRoute) return <MarketSelectionPage />;

  return (
    <Routes>
      <Route path="/" element={<MarketplaceApp />} />
      <Route path="/shop/:merchantId" element={<ShopDetail />} />
      <Route path="/product/:productId" element={<ProductDetail />} />
      <Route path="/portal" element={<PortalLoginPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/waiting-approval" element={<WaitingApprovalPage />} />

      {/* --- RUTE RAHASIA: MENGARAH KE GOD MODE LOGIN --- */}
      <Route path="/login/master" element={<SuperAdminLogin />} />

      {/* LOGIN PARTNER */}
      <Route path="/login/toko" element={<MerchantLogin />} />
      <Route path="/login/kurir" element={<CourierLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* PROMO/PENDAFTARAN */}
      <Route path="/promo/toko" element={<MerchantPromoPage />} />
      <Route path="/promo/kurir" element={<CourierPromoPage />} />
      <Route path="/promo/admin" element={<AdminPromoPage />} />
      <Route path="/admin/register" element={<AdminPromoPage />} />

      {/* DASHBOARD DASHBOARD */}
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
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
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

      {/* PUSAT KENDALI SUPER ADMIN */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<MarketplaceApp />} />
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

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Loader2 } from "lucide-react"; // Icon yang dibutuhkan sisa ini saja

// CONTEXTS
import { ConfigProvider } from "./contexts/ConfigContext";
import { MarketProvider, useMarket } from "./contexts/MarketContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";
import { supabase } from "./lib/supabaseClient";

// HOOKS
import { useMarketCheck } from "./hooks/useMarketCheck";

// COMPONENTS
import { MobileLayout } from "./components/MobileLayout";
import { HeroOnboarding } from "./components/HeroOnboarding";
import { GhostBar } from "./components/GhostBar";
import { CartDrawer } from "./components/CartDrawer";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppHeader } from "./components/AppHeader";
import { HomeMenuGrid } from "./components/HomeMenuGrid"; // <--- KOMPONEN BARU

// PAGES
import { Home } from "./pages/Home";
import { LocalAdminDashboard } from "./pages/admin/LocalAdminDashboard";
import { SuperAdminDashboard } from "./pages/admin/SuperAdminDashboard";
import { MerchantDashboard } from "./pages/merchant/MerchantDashboard";
import { CourierDashboard } from "./pages/courier/CourierDashboard";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { ShopDetail } from "./pages/customer/ShopDetail";
import { AuthPage } from "./pages/auth/AuthPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { CheckoutPaymentPage } from "./pages/checkout/CheckoutPaymentPage";
import { PortalLoginPage } from "./pages/auth/TopBarLoginPage";
import { MerchantPromoPage } from "./pages/promo/MerchantPromoPage";
import { CourierPromoPage } from "./pages/promo/CourierPromoPage";
import { AdminPromoPage } from "./pages/promo/AdminPromoPage";
import { MarketSelectionPage } from "./pages/MarketSelection/MarketSelectionPage";
import {
  MerchantLogin,
  CourierLogin,
  AdminLogin,
  SuperAdminLogin,
} from "./pages/auth/PartnerLoginPages";

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

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchProfileName = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .maybeSingle();
        setUserName(data?.name || user.email?.split("@")[0] || "User");
      } else {
        setUserName("Tamu");
      }
    };
    fetchProfileName();
  }, [user]);

  const handleCheckoutProcess = () => {
    setIsCartOpen(false);
    user ? setIsCheckoutOpen(true) : navigate("/register");
  };

  const handleUserClick = () =>
    user ? navigate("/customer-dashboard") : navigate("/login");

  const renderTabContent = () => (
    <div className="bg-[#f5f5f5] min-h-screen text-left pt-[86px] md:pt-[105px]">
      <AppHeader
        userName={userName}
        cartCount={totalCartCount}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={setSearchQuery}
        onUserClick={handleUserClick}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroOnboarding />

              {/* AREA NAVIGASI (Sangat Ringkas!) */}
              <HomeMenuGrid />

              <Home searchQuery={searchQuery} />
            </>
          }
        />
        <Route path="/shop/:merchantId" element={<ShopDetail />} />
      </Routes>

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
  );

  return (
    <MobileLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSearch={setSearchQuery}
      onCartClick={() => setIsCartOpen(true)}
      cartCount={totalCartCount}
    >
      {renderTabContent()}
    </MobileLayout>
  );
};

// --- MAIN CONTENT ---
const MainContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    "/checkout",
  ];
  const isBypassRoute = bypassRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  if (!selectedMarket && !isBypassRoute) return <MarketSelectionPage />;

  return (
    <Routes>
      <Route path="/portal" element={<PortalLoginPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/checkout"
        element={
          <div className="pt-16 bg-gray-50 min-h-screen">
            <CheckoutPaymentPage isOpen={true} onClose={() => navigate("/")} />
          </div>
        }
      />

      <Route path="/login/toko" element={<MerchantLogin />} />
      <Route path="/login/kurir" element={<CourierLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/login/master" element={<SuperAdminLogin />} />

      <Route path="/promo/toko" element={<MerchantPromoPage />} />
      <Route path="/promo/kurir" element={<CourierPromoPage />} />
      <Route path="/promo/admin" element={<AdminPromoPage />} />

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
          <ProtectedRoute allowedRoles={["CUSTOMER", "BUYER"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/*" element={<MarketplaceApp />} />
    </Routes>
  );
};

// --- APP PROVIDERS WRAPPER (Opsional: Agar bagian bawah lebih rapi) ---
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

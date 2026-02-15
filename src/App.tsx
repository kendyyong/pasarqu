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
import { ToastProvider } from "./contexts/ToastContext";

// LEVEL AKSES DB
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
import { AuthPage } from "./pages/auth/AuthPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { WaitingApprovalPage } from "./pages/auth/WaitingApprovalPage";
import { PortalLoginPage } from "./pages/auth/PortalLoginPage";
import { ShopDetail } from "./pages/customer/ShopDetail";
import { ProductDetail } from "./pages/customer/ProductDetail";
import { OrderTrackingPage } from "./pages/customer/OrderTrackingPage";
import { MarketSelectionPage } from "./pages/MarketSelection/MarketSelectionPage";
import { CheckoutPaymentPage } from "./pages/checkout/CheckoutPaymentPage";

// --- DASHBOARDS ---
import { LocalAdminDashboard } from "./pages/admin/LocalAdminDashboard";
import { SuperAdminDashboard } from "./pages/admin/SuperAdminDashboard";
import { MerchantDashboard } from "./pages/merchant/MerchantDashboard";
import { CourierDashboard } from "./pages/courier/CourierDashboard";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";

// --- SUPER FEATURES (NEW) ---
import { ShippingConfig } from "./pages/admin/super-features/ShippingConfig";

// --- LOGIN KHUSUS ---
import {
  MerchantLogin,
  CourierLogin,
  AdminLogin,
  SuperAdminLogin,
} from "./pages/auth/PartnerLoginPages";

// --- REDIRECT LOGIC ---
const RoleBasedRedirect = () => {
  const { profile, loading, user } = useAuth();

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans">
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          setUserName(
            profileData?.full_name || user.email?.split("@")[0] || "User",
          );
          setUserAvatar(profileData?.avatar_url || null);
        } catch (e) {
          console.error("User fetch error", e);
        }
      }
    };
    fetchUserData();
  }, [user]);

  return (
    <div className="bg-white min-h-screen">
      <MobileLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={setSearchQuery}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
      >
        <AppHeader
          userName={userName}
          userAvatar={userAvatar}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onCartClick={() => setIsCartOpen(true)}
          onSearch={setSearchQuery}
          onUserClick={() =>
            user ? navigate("/customer-dashboard") : navigate("/login")
          }
        />
        <div className="w-full max-w-[1200px] mx-auto px-0 md:px-5 bg-white">
          {!searchQuery && (
            <>
              <HeroOnboarding />
              <div className="mt-0">
                <HomeMenuGrid />
              </div>
            </>
          )}
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

const MainContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isChecking, selectedMarket } = useMarketCheck();

  if (isChecking)
    return (
      <div className="h-screen flex items-center justify-center bg-white font-sans text-teal-600">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );

  const bypassRoutes = [
    "/login",
    "/register",
    "/portal",
    "/super-admin",
    "/admin", // Bypass untuk rute admin
    "/waiting-approval",
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
      <Route path="/login/admin-wilayah" element={<AdminLogin />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/waiting-approval" element={<WaitingApprovalPage />} />

      {/* PELANGGAN */}
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

      {/* MITRA DASHBOARD */}
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

      {/* ADMIN WILAYAH */}
      <Route
        path="/admin-wilayah"
        element={
          <ProtectedRoute allowedRoles={["LOCAL_ADMIN"]}>
            <LocalAdminDashboard onBack={() => navigate("/")} />
          </ProtectedRoute>
        }
      />

      {/* ✅ SEKSI MASTER ADMIN */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/finance"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 🚚 SUPER FEATURE: LOGISTICS ENGINE */}
      <Route
        path="/admin/shipping-config"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            {/* Menggunakan default theme light */}
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

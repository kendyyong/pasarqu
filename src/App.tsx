import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

// CONTEXTS & LIBS
import { ConfigProvider } from "./contexts/ConfigContext";
import { MarketProvider, useMarket } from "./contexts/MarketContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";
import { supabase } from "./lib/supabaseClient";
import { Product } from "./types";

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

// LOGIN PARTNER
import {
  MerchantLogin,
  CourierLogin,
  AdminLogin,
  SuperAdminLogin,
} from "./pages/auth/PartnerLoginPages";

// COMPONENTS
import { MobileLayout } from "./components/MobileLayout";
import { HeroOnboarding } from "./components/HeroOnboarding";
import { GhostBar } from "./components/GhostBar";
import { CartDrawer } from "./components/CartDrawer";
import { AppLogo } from "./components/AppLogo";

// ICONS
import {
  Truck,
  Store,
  Bike,
  Search,
  ShoppingBag,
  Loader2,
  MapPin,
  Shield,
  Zap,
  Ticket,
  CreditCard,
  Gift,
  User,
  Globe,
} from "lucide-react";

// --- KOMPONEN SATPAM (ROUTE GUARD) ---
// Tugas: Mengecek jabatan user sebelum mengizinkan masuk pintu dashboard
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: string[];
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

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" />
      </div>
    );

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
    return <Navigate to="/customer-dashboard" replace />;
  }

  // 4. Jika lolos pengecekan, silakan masuk
  return children;
};

const MarketplaceApp = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
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

  const [tapCount, setTapCount] = useState(0);

  const handleSecretLogoClick = () => {
    setTapCount((prev) => prev + 1);
    setTimeout(() => setTapCount(0), 1000);

    if (tapCount + 1 === 5) {
      showToast("🔓 Akses Super Admin Terbuka...", "success");
      navigate("/login/master");
      setTapCount(0);
    } else {
      if (tapCount === 0) navigate("/");
    }
  };

  useEffect(() => {
    const fetchProfileName = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        if (data && data.name) setUserName(data.name);
        else setUserName(user.email?.split("@")[0] || "User");
      } else {
        setUserName("Tamu");
      }
    };
    fetchProfileName();
  }, [user]);

  const handleUserClick = () => {
    if (user) navigate("/customer-dashboard");
    else navigate("/login");
  };

  const handleCheckoutProcess = () => {
    setIsCartOpen(false);
    if (!user) {
      showToast("Silakan daftar sebagai pelanggan untuk memesan", "info");
      navigate("/register");
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderTabContent = () => {
    return (
      <div className="bg-[#f5f5f5] min-h-screen text-left pt-[54px] md:pt-[105px]">
        {/* HEADER FIXED */}
        <header className="fixed top-0 left-0 right-0 bg-teal-600 z-[1000] shadow-sm">
          <div className="hidden md:block bg-black/10">
            <div className="max-w-[1200px] mx-auto px-4 h-7 flex justify-between items-center text-white text-[10px] font-medium">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/login/toko")}
                  className="hover:text-teal-200 transition-colors"
                >
                  Login Toko
                </button>
                <span className="opacity-30">|</span>
                <button
                  onClick={() => navigate("/login/kurir")}
                  className="hover:text-teal-200 transition-colors"
                >
                  Login Kurir
                </button>
                <span className="opacity-30">|</span>
                <button
                  onClick={() => navigate("/login/admin")}
                  className="hover:text-teal-200 transition-colors"
                >
                  Login Admin
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleUserClick}
                  className="flex items-center gap-1.5 hover:text-teal-200 transition-colors cursor-pointer"
                >
                  <User size={12} /> <span>Halo, {userName}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-[1200px] mx-auto px-3 h-[54px] md:h-[70px] flex items-center justify-between gap-3 md:gap-8">
            <div
              className="hidden md:flex items-center cursor-pointer shrink-0 select-none"
              onClick={handleSecretLogoClick}
            >
              <AppLogo
                size="sm"
                regionName="PASARQU"
                className="text-white scale-90 origin-left"
              />
            </div>

            <div className="flex-1 bg-white rounded-sm flex items-center p-1 shadow-sm h-9 md:h-10">
              <div className="flex-1 flex items-center px-2">
                <div
                  className="md:hidden mr-2 shrink-0 cursor-pointer"
                  onClick={handleUserClick}
                >
                  <div className="w-6 h-6 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 border border-teal-100">
                    <User size={14} />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder={`Cari di Pasarqu...`}
                  className="w-full text-xs md:text-sm outline-none text-slate-800 font-medium bg-transparent"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="bg-teal-600 hover:bg-teal-700 text-white w-10 md:w-16 h-full rounded-sm flex items-center justify-center transition-colors">
                <Search size={16} />
              </button>
            </div>

            <div
              className="relative cursor-pointer text-white px-1 md:px-2 group"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag
                className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-105 transition-transform"
                strokeWidth={1.5}
              />
              {totalCartCount > 0 && (
                <div className="absolute -top-1 right-0 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-teal-600 shadow-sm">
                  {totalCartCount}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- BAGIAN DINAMIS (ROUTES) --- */}
        <Routes>
          {/* Tampilan Home Utama (Default) */}
          <Route
            path="/"
            element={
              <>
                <HeroOnboarding />
                <div className="max-w-[1200px] mx-auto px-2 md:px-0 relative z-10 -mt-2">
                  <div className="bg-white pt-4 pb-2 mb-2 grid grid-cols-5 md:grid-cols-10 gap-y-3 px-2 rounded-b-lg shadow-sm border-t border-slate-50">
                    <MenuIcon
                      icon={<Zap />}
                      label="Flash Sale"
                      color="bg-orange-500"
                    />
                    <MenuIcon
                      icon={<Ticket />}
                      label="Voucher"
                      color="bg-teal-500"
                    />
                    <MenuIcon
                      icon={<CreditCard />}
                      label="Isi Saldo"
                      color="bg-slate-900"
                    />
                    <MenuIcon
                      icon={<Gift />}
                      label="Hadiah"
                      color="bg-pink-500"
                    />
                    <MenuIcon
                      icon={<Truck />}
                      label="Paket"
                      color="bg-emerald-500"
                    />
                    <MenuIcon
                      icon={<Shield />}
                      label="Bantuan"
                      color="bg-slate-400"
                    />
                    <MenuIcon
                      icon={<Store />}
                      label="Toko"
                      color="bg-teal-600"
                      onClick={() => navigate("/login/toko")}
                    />
                    <MenuIcon
                      icon={<Bike />}
                      label="Kurir"
                      color="bg-orange-600"
                      onClick={() => navigate("/login/kurir")}
                    />
                    <MenuIcon
                      icon={<Globe />}
                      label="Zona"
                      color="bg-blue-600"
                      onClick={() => navigate("/login/admin")}
                    />
                    <MenuIcon
                      icon={<MapPin />}
                      label="Ganti Pasar"
                      color="bg-rose-600"
                      onClick={() => {
                        marketContext?.setSelectedMarket(null);
                        localStorage.removeItem("selected_market_id");
                        window.location.reload();
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <PromoBox
                      onClick={() => navigate("/promo/toko")}
                      icon={<Store size={16} />}
                      label="Mulai Jualan"
                      color="text-teal-700"
                      borderColor="hover:border-teal-400"
                    />
                    <PromoBox
                      onClick={() => navigate("/promo/kurir")}
                      icon={<Bike size={16} />}
                      label="Daftar Kurir"
                      color="text-orange-700"
                      borderColor="hover:border-orange-400"
                    />
                    <PromoBox
                      onClick={() => navigate("/promo/admin")}
                      icon={<Globe size={16} />}
                      label="Mitra Zona"
                      color="text-blue-700"
                      borderColor="hover:border-blue-400"
                    />
                  </div>
                </div>
                <Home searchQuery={searchQuery} />
              </>
            }
          />

          {/* Tampilan Detail Toko (Saat di klik) */}
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
  };

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

const MenuIcon = ({ icon, label, color, onClick }: any) => (
  <div
    onClick={onClick}
    className="flex flex-col items-center gap-1 cursor-pointer group p-1"
  >
    <div
      className={`w-10 h-10 md:w-11 md:h-11 ${color} rounded-[14px] flex items-center justify-center text-white shadow-sm group-active:scale-95 transition-all`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <span className="text-[10px] text-slate-600 text-center font-medium leading-tight truncate w-full px-1">
      {label}
    </span>
  </div>
);

const PromoBox = ({ onClick, icon, label, color, borderColor }: any) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-lg p-2 flex flex-col items-center justify-center ${color} border border-slate-100 shadow-sm ${borderColor} transition-all cursor-pointer active:scale-95`}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-[9px] font-bold uppercase tracking-tight">
      {label}
    </span>
  </div>
);

const MainContent = () => {
  const marketContext = useMarket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const selectedMarket = marketContext?.selectedMarket;
  const setSelectedMarket = marketContext?.setSelectedMarket;

  useEffect(() => {
    const checkMarket = async () => {
      const savedId = localStorage.getItem("selected_market_id");
      if (savedId && !selectedMarket) {
        const { data } = await supabase
          .from("markets")
          .select("*")
          .eq("id", savedId)
          .single();
        if (data) setSelectedMarket(data);
      }
      setIsChecking(false);
    };
    checkMarket();
  }, [selectedMarket, setSelectedMarket]);

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
    "/login/toko",
    "/login/kurir",
    "/login/admin",
    "/login/master",
    "/promo/toko",
    "/promo/kurir",
    "/promo/admin",
    "/super-admin",
    "/checkout",
  ];

  const isBypassRoute = bypassRoutes.some((route) =>
    location.pathname.startsWith(route),
  );

  if (!selectedMarket && !isBypassRoute) {
    return <MarketSelectionPage />;
  }

  return (
    <Routes>
      {/* RUTE PUBLIK (Bebas Masuk) */}
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
      <Route path="/shop/:merchantId" element={<ShopDetail />} />

      <Route path="/promo/toko" element={<MerchantPromoPage />} />
      <Route path="/promo/kurir" element={<CourierPromoPage />} />
      <Route path="/promo/admin" element={<AdminPromoPage />} />

      {/* --- RUTE DENGAN PENJAGAAN KETAT (SATPAM) --- */}

      {/* 1. Dashboard Admin Wilayah (Hanya untuk LOCAL_ADMIN) */}
      <Route
        path="/admin-wilayah"
        element={
          <ProtectedRoute allowedRoles={["LOCAL_ADMIN"]}>
            <LocalAdminDashboard onBack={() => navigate("/")} />
          </ProtectedRoute>
        }
      />

      {/* 2. Dashboard Super Admin (Hanya untuk SUPER_ADMIN) */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 3. Dashboard Toko (Hanya untuk MERCHANT) */}
      <Route
        path="/merchant-dashboard"
        element={
          <ProtectedRoute allowedRoles={["MERCHANT"]}>
            <MerchantDashboard />
          </ProtectedRoute>
        }
      />

      {/* 4. Dashboard Kurir (Hanya untuk COURIER) */}
      <Route
        path="/courier-dashboard"
        element={
          <ProtectedRoute allowedRoles={["COURIER"]}>
            <CourierDashboard />
          </ProtectedRoute>
        }
      />

      {/* 5. Dashboard Member/Pembeli (Hanya untuk CUSTOMER/BUYER) */}
      <Route
        path="/customer-dashboard"
        element={
          <ProtectedRoute allowedRoles={["CUSTOMER", "BUYER"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route path="/*" element={<MarketplaceApp />} />
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

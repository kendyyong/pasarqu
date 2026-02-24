import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileLayout } from "../components/layout/MobileLayout";
import { AppHeader } from "../components/layout/AppHeader";
import { CartDrawer } from "../components/shared/CartDrawer";

// ✅ JALUR IMPORT CONTEXT
import { useAuth } from "../contexts/AuthContext";
import { useMarket } from "../contexts/MarketContext";

// ✅ KABEL UTAMA: Memanggil Home.tsx yang sudah mengelola Iklan, Navigasi Cepat, & Produk
import { Home } from "./Home";

export const MarketplaceApp = () => {
  const { user, profile } = useAuth();
  const marketContext = useMarket();
  const navigate = useNavigate();
  const location = useLocation();

  const cart = marketContext?.cart || [];
  const updateQty = marketContext?.updateQty || (() => {});
  const removeFromCart = marketContext?.removeFromCart || (() => {});
  const selectedMarket = marketContext?.selectedMarket;

  /** * 🛠️ SYNC TYPE DATA:
   * Kembali ke 4 menu utama: home, search, orders, account
   */
  const [activeTab, setActiveTab] = useState<
    "home" | "search" | "orders" | "account"
  >("home");

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Menghitung total barang di keranjang untuk badge di AppHeader
  const totalCartItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  // Efek jika ada redirect untuk langsung buka checkout setelah login
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("openCheckout") === "true" && user) {
      navigate("/checkout", { replace: true });
    }
  }, [location, user, navigate]);

  /** 🚀 HANDLE NAVIGASI TAB BAWAH */
  const handleTabChange = (tab: any) => {
    if (tab === "account") {
      /**
       * 🛠️ LOGIKA BARU:
       * Jika klik SAYA:
       * 1. Jika sudah login -> ke Dashboard
       * 2. Jika belum login -> ke Login (di mana tombol Mitra berada)
       */
      user ? navigate("/customer-dashboard") : navigate("/login");
    } else if (tab === "orders") {
      navigate("/order-history");
    } else {
      setActiveTab(tab);
    }
  };

  const handleCheckoutTrigger = () => {
    setIsCartOpen(false);
    if (!user) {
      navigate("/login?redirect=checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* WRAPPER NAVIGASI BAWAH */}
      <MobileLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearch={setSearchQuery}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={totalCartItems}
      >
        {/* HEADER APLIKASI (FIXED DI ATAS) */}
        <AppHeader
          userName={user ? profile?.name || "Member" : "Tamu"}
          userAvatar={profile?.avatar_url || null}
          cartCount={totalCartItems}
          regionName={selectedMarket?.brandName || selectedMarket?.name}
          onCartClick={() => setIsCartOpen(true)}
          onSearch={setSearchQuery}
          onUserClick={() =>
            user ? navigate("/customer-dashboard") : navigate("/login")
          }
        />

        {/* 🛠️ AREA KONTEN UTAMA */}
        <div className="w-full max-w-[1200px] mx-auto bg-white pt-0 pb-24 text-left">
          <div className="text-left overflow-hidden">
            <Home searchQuery={searchQuery} />
          </div>
        </div>

        {/* DRAWER KERANJANG (POPUP) */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onCheckout={handleCheckoutTrigger}
        />
      </MobileLayout>
    </div>
  );
};

export default MarketplaceApp;

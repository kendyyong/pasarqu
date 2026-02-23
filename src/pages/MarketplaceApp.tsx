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
   * Menyesuaikan dengan 5 menu di MobileLayout: home, search, orders, mitra, account
   */
  const [activeTab, setActiveTab] = useState<
    "home" | "search" | "orders" | "mitra" | "account"
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
    if (tab === "mitra") {
      navigate("/portal"); // Pintu masuk untuk penjual/kurir
    } else if (tab === "account") {
      navigate("/customer-dashboard"); // Pintu masuk untuk profil pembeli (SAYA)
    } else if (tab === "orders") {
      navigate("/order-history"); // Pintu masuk riwayat pesanan
    } else {
      setActiveTab(tab); // Home dan Search dikelola oleh state lokal
    }
  };

  const handleCheckoutTrigger = () => {
    setIsCartOpen(false);
    if (!user) {
      navigate("/register?redirect=checkout");
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

        {/* 🛠️ AREA KONTEN UTAMA
            pt-0: Karena Home.tsx sudah memiliki pt-[75px] sendiri untuk menghindari header.
            pb-24: Memberi ruang agar konten tidak tertutup navigasi bawah.
        */}
        <div className="w-full max-w-[1200px] mx-auto bg-white pt-0 pb-24 text-left">
          {/* KONTEN DINAMIS:
              File Home.tsx sekarang sudah sangat cerdas:
              - Menampilkan HeroOnboarding (Iklan)
              - Menampilkan QuickActions (Navigasi Cepat)
              - Menampilkan Katalog Produk (Bezel-less)
          */}
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

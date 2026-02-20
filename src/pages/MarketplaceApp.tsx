import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileLayout } from "../components/layout/MobileLayout";
import { AppHeader } from "../components/layout/AppHeader";
import { HeroOnboarding } from "./home/components/HeroOnboarding";
import { HomeMenuGrid } from "./home/components/HomeMenuGrid";
import { CartDrawer } from "../components/shared/CartDrawer";

// ✅ FIX JALUR IMPORT (Hanya mundur 1 tingkat)
import { useAuth } from "../contexts/AuthContext";
import { useMarket } from "../contexts/MarketContext";

// ✅ KABEL PENTING: Memanggil Home.tsx yang ada di folder yang sama
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

  const [activeTab, setActiveTab] = useState<
    "home" | "search" | "orders" | "account"
  >("home");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      <MobileLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={setSearchQuery}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={totalCartItems}
      >
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

        <div className="w-full max-w-[1200px] mx-auto bg-white pt-0 md:pt-4 pb-24 text-left">
          {!searchQuery && (
            <div className="flex flex-col m-0 p-0 text-left">
              <HeroOnboarding />
              <div className="mt-0 px-4 md:px-5">
                <HomeMenuGrid />
              </div>
            </div>
          )}
          <div className="px-4 md:px-5 text-left">
            <Home searchQuery={searchQuery} />
          </div>
        </div>

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

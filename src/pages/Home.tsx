import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useMarket } from "../contexts/MarketContext";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";

/** 🚀 IMPORT KOMPONEN PENDUKUNG */
import { HeroOnboarding } from "./home/components/HeroOnboarding";
import { HomeMenuGrid } from "./home/components/HomeMenuGrid";
// 🚀 FIX GPS: Mundur 1 langkah dari pages/ ke src/, lalu masuk components/shared/
import { ProductCard } from "../components/shared/ProductCard";

interface HomeProps {
  searchQuery: string;
}

const SkeletonCard = () => (
  <div className="flex flex-col h-full bg-white border-b border-r border-slate-100 animate-pulse">
    <div className="aspect-square w-full bg-slate-200" />
    <div className="p-3 flex flex-col flex-1 text-left">
      <div className="h-2 w-12 bg-slate-100 mb-2 rounded" />
      <div className="h-3 w-full bg-slate-200 mb-1 rounded" />
      <div className="mt-auto h-8 w-full bg-slate-100 rounded-lg" />
    </div>
  </div>
);

export const Home: React.FC<HomeProps> = ({ searchQuery }) => {
  const navigate = useNavigate();
  const { selectedMarket, addToCart, setMarketById } = useMarket();
  const { showToast } = useToast();
  const { user } = useAuth() as any;

  const [products, setProducts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sinkronisasi Pasar
  useEffect(() => {
    const savedMarketId = localStorage.getItem("active_market_id");
    if (savedMarketId && selectedMarket?.id !== savedMarketId) {
      if (typeof setMarketById === "function") {
        setMarketById(savedMarketId);
      }
    }
  }, [selectedMarket, setMarketById]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. FETCH IKLAN
      let adQuery = supabase.from("ads").select("*").eq("is_active", true);

      if (selectedMarket?.id) {
        adQuery = adQuery.or(
          `market_id.is.null,market_id.eq.${selectedMarket.id}`,
        );
      } else {
        adQuery = adQuery.is("market_id", null);
      }

      const { data: adData } = await adQuery.order("sort_order", {
        ascending: true,
      });
      setAds(adData || []);

      // 2. FETCH PRODUK (Hanya APPROVED)
      let prodQuery = supabase
        .from("products")
        .select("*, merchants:merchant_id(shop_name)")
        .eq("status", "APPROVED")
        .order("stock", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedMarket?.id) {
        prodQuery = prodQuery.eq("market_id", selectedMarket.id);
      }

      const { data: prodData } = await prodQuery;
      setProducts(prodData || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMarket, searchQuery]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full font-sans text-left bg-white min-h-screen pb-24 pt-[65px] md:pt-[80px] overflow-x-hidden relative">
      <div className="max-w-[1200px] mx-auto">
        {/* --- 1. IKLAN SLIDE (TETAP ADA) --- */}
        {!searchQuery && <HeroOnboarding banners={ads} isLoading={isLoading} />}

        {/* --- 2. MENU GRID (TETAP ADA) --- */}
        {!searchQuery && <HomeMenuGrid />}

        {/* --- 3. PRODUK GRID --- */}
        <div className="mt-4 mb-8">
          <div className="flex items-center justify-between mb-4 px-5 md:px-1 text-left">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Katalog Produk{" "}
              {selectedMarket?.name && `di ${selectedMarket.name}`}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-[1px] md:gap-4 px-0 md:px-0 bg-slate-100 md:bg-transparent border-y border-slate-100 md:border-none">
            {isLoading
              ? [...Array(10)].map((_, i) => <SkeletonCard key={i} />)
              : filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    // 🚀 FIX ERROR 7006: Menambahkan type string dan any
                    onNavigate={(id: string) => navigate(`/product/${id}`)}
                    onAddToCart={(p: any) => {
                      // 🚀 PINTU PENJAGA LOGIN
                      if (!user) {
                        showToast(
                          "Silakan login dulu untuk berbelanja!",
                          "error",
                        );
                        navigate("/login");
                        return;
                      }
                      addToCart(p);
                      showToast("Berhasil masuk keranjang", "success");
                    }}
                  />
                ))}
          </div>

          {!isLoading && filteredProducts.length === 0 && (
            <div className="py-20 text-center opacity-30">
              <p className="text-sm font-black uppercase tracking-widest">
                Barang tidak ditemukan
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

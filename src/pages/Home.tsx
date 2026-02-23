import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBasket,
  Zap,
  ArrowRight,
  Flame,
  Star,
  Timer,
  Package,
  Store,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useMarket } from "../contexts/MarketContext";
import { useToast } from "../contexts/ToastContext";

/** 🚀 IMPORT KOMPONEN PENDUKUNG */
import { HeroOnboarding } from "./home/components/HeroOnboarding";
import { HomeMenuGrid } from "./home/components/HomeMenuGrid";

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
      // Fetch Iklan
      const { data: adData } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setAds(adData || []);

      // Fetch Produk
      let query = supabase
        .from("products")
        .select("*, merchants:merchant_id(shop_name)")
        .eq("status", "APPROVED")
        .order("stock", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedMarket?.id) {
        query = query.eq("market_id", selectedMarket.id);
      }
      const { data: prodData } = await query;
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
    /**
     * 🚀 UPDATE SPACING:
     * pt-[65px]: Jarak aman dari AppHeader di mobile.
     * md:pt-[80px]: Jarak aman untuk desktop.
     */
    <div className="w-full font-sans text-left bg-white min-h-screen pb-24 pt-[65px] md:pt-[80px] overflow-x-hidden relative">
      <div className="max-w-[1200px] mx-auto">
        {/* --- 1. IKLAN SLIDE --- */}
        {!searchQuery && <HeroOnboarding banners={ads} isLoading={isLoading} />}

        {/* --- 2. MENU GRID (NAVIGASI CEPAT) --- 
            Memanggil komponen HomeMenuGrid yang mengambil data dari 'app_menus'
        */}
        {!searchQuery && <HomeMenuGrid />}

        {/* --- 3. PRODUK GRID (BEZEL-LESS) --- */}
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
              : filteredProducts.map((product) => {
                  const isHabis = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock < 5;

                  return (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className={`flex flex-col h-full bg-white rounded-none md:rounded-xl md:border md:border-slate-100 md:shadow-sm overflow-hidden group transition-all active:bg-slate-50 ${isHabis ? "opacity-90" : ""}`}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-slate-50 cursor-pointer relative">
                        <img
                          src={
                            product.image_url ||
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
                          }
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isHabis ? "grayscale contrast-125" : ""}`}
                          alt={product.name}
                        />
                        {product.is_po && (
                          <div className="absolute bottom-2 left-2 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase">
                            <Timer size={10} /> PO {product.po_days} HARI
                          </div>
                        )}
                      </div>

                      <div className="p-3 flex flex-col flex-1 text-left">
                        <div className="flex items-center gap-1 mb-1 opacity-70">
                          <Store size={10} className="text-slate-400" />
                          <p className="text-[8px] font-black text-slate-400 uppercase truncate">
                            {product.merchants?.shop_name || "Toko Pasarqu"}
                          </p>
                        </div>

                        <h4
                          className={`text-[11px] font-bold text-slate-800 line-clamp-2 mb-2 leading-tight min-h-[32px] ${isHabis ? "line-through text-slate-400" : ""}`}
                        >
                          {product.name}
                        </h4>

                        <div className="mt-auto mb-3 flex items-center justify-between">
                          <span className="text-[14px] font-black text-[#FF6600] tracking-tighter">
                            Rp {product.price.toLocaleString()}
                          </span>

                          {!isHabis && (
                            <div
                              className={`flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded ${isLowStock ? "bg-red-50 text-red-600 border border-red-100" : "bg-teal-50 text-teal-600 border border-teal-100"}`}
                            >
                              <Package size={10} />
                              <span className="uppercase">{product.stock}</span>
                            </div>
                          )}
                        </div>

                        <button
                          disabled={isHabis}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isHabis) {
                              addToCart(product);
                              showToast("Berhasil masuk keranjang", "success");
                            }
                          }}
                          className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${isHabis ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 text-white"}`}
                        >
                          {isHabis ? (
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              HABIS
                            </span>
                          ) : (
                            <>
                              <ShoppingBasket size={13} />
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                TAMBAH
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </div>
  );
};

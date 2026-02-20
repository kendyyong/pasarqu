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

interface HomeProps {
  searchQuery: string;
}

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="flex flex-col h-full bg-white border border-slate-100 rounded-none overflow-hidden animate-pulse">
    <div className="aspect-square w-full bg-slate-200" />
    <div className="p-4 flex flex-col flex-1">
      <div className="h-2 w-12 bg-slate-100 mb-2 rounded" />
      <div className="h-3 w-full bg-slate-200 mb-1 rounded" />
      <div className="h-3 w-3/4 bg-slate-200 mb-4 rounded" />
      <div className="mt-auto h-5 w-24 bg-slate-100 mb-3 rounded" />
      <div className="h-10 w-full bg-slate-200 rounded-lg" />
    </div>
  </div>
);

export const Home: React.FC<HomeProps> = ({ searchQuery }) => {
  const navigate = useNavigate();
  const { selectedMarket, addToCart, markets, setMarketById } = useMarket(); // Pastikan setMarketById ada di context Anda
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // --- LOGIKA BARU: SINKRONISASI PASAR PASCA LOGOUT ---
  useEffect(() => {
    // Ambil ID pasar yang dititipkan di localStorage saat logout
    const savedMarketId = localStorage.getItem("active_market_id");

    // Jika ada ID titipan dan ID tersebut berbeda dengan pasar yang sedang aktif
    if (savedMarketId && selectedMarket?.id !== savedMarketId) {
      // Panggil fungsi untuk mengganti pasar secara global
      // Pastikan fungsi setMarketById atau logic serupa tersedia di MarketContext Anda
      if (typeof setMarketById === "function") {
        setMarketById(savedMarketId);
      }
    }
  }, [selectedMarket, setMarketById]);

  // --- FETCH DATA LOGIC ---
  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error("Gagal mengambil iklan:", err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*, merchants:merchant_id(shop_name)")
        .eq("status", "APPROVED")
        .order("stock", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedMarket?.id) {
        query = query.eq("market_id", selectedMarket.id);
      } else {
        // Jika belum ada pasar terpilih, coba ambil dari localStorage sebagai cadangan terakhir
        const fallbackId = localStorage.getItem("active_market_id");
        if (fallbackId) {
          query = query.eq("market_id", fallbackId);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error("Gagal mengambil produk:", err.message);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const fetchQuickActions = async () => {
    try {
      const { data, error } = await supabase
        .from("quick_actions")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setQuickActions(data || []);
    } catch (err) {
      console.error("Gagal mengambil quick actions:", err);
    }
  };

  useEffect(() => {
    fetchAds();
    fetchProducts();
    fetchQuickActions();
  }, [selectedMarket, searchQuery]);

  // --- ADS SLIDER LOGIC ---
  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [ads]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Flame":
        return <Flame size={22} />;
      case "Star":
        return <Star size={22} />;
      case "Zap":
        return <Zap size={22} />;
      default:
        return <Zap size={22} />;
    }
  };

  return (
    <div className="w-full font-sans text-left bg-white min-h-screen pb-16 pt-[10px] overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto">
        {/* 1. IKLAN SLIDE */}
        {!searchQuery && ads.length > 0 && (
          <div className="mt-0">
            <div className="relative h-44 md:h-72 w-full overflow-hidden rounded-none md:rounded-xl group border-none text-left shadow-md">
              {ads.map((ad, index) => (
                <div
                  key={ad.id}
                  onClick={() => navigate(ad.link_to)}
                  className={`absolute inset-0 cursor-pointer transition-opacity duration-1000 ease-in-out ${index === activeSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
                >
                  <img
                    src={ad.image_url}
                    className="w-full h-full object-cover"
                    alt={ad.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex flex-col justify-end p-6">
                    <h2 className="text-white text-xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                      {ad.title}
                    </h2>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. QUICK ACTIONS */}
        {!searchQuery && quickActions.length > 0 && (
          <div className="mt-5 px-4 md:px-0">
            <div className="bg-white p-5 overflow-x-auto no-scrollbar flex gap-6 rounded-xl border border-slate-100 shadow-sm">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => navigate(action.link_to)}
                  className="flex flex-col items-center gap-2 group shrink-0"
                >
                  <div
                    className={`${action.bg_color || "bg-teal-500"} w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110`}
                  >
                    {renderIcon(action.icon_name)}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center leading-none">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. PRODUK GRID */}
        <div className="mt-8 mb-8">
          <div className="flex items-center justify-between mb-4 px-5 md:px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Katalog Produk{" "}
              {selectedMarket?.name && `di ${selectedMarket.name}`}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-[1px] bg-slate-100 md:bg-transparent md:gap-4 border-y border-slate-100 md:border-none">
            {isLoading ? (
              <>
                {[...Array(10)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </>
            ) : (
              filteredProducts.map((product) => {
                const isHabis = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock < 5;

                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className={`flex flex-col h-full bg-white rounded-none md:rounded-xl md:border md:border-slate-100 md:shadow-sm overflow-hidden group transition-all ${isHabis ? "opacity-90" : ""}`}
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

                    <div className="p-3 flex flex-col flex-1">
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
                        <span className="text-[15px] font-black text-[#FF6600] tracking-tighter">
                          Rp {product.price.toLocaleString()}
                        </span>

                        {!isHabis && (
                          <div
                            className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded ${isLowStock ? "bg-red-50 text-red-600 border border-red-100" : "bg-teal-50 text-teal-600 border border-teal-100"}`}
                          >
                            <Package size={10} />
                            <span className="uppercase tracking-wide">
                              {isLowStock
                                ? `SISA ${product.stock}`
                                : `STOK ${product.stock}`}
                            </span>
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
                        className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${isHabis ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 text-white"}`}
                      >
                        {isHabis ? (
                          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <AlertCircle size={12} /> STOK HABIS
                          </span>
                        ) : (
                          <>
                            <ShoppingBasket size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              TAMBAH
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. PORTAL MITRA */}
        <div className="mt-8 mb-10 px-4 md:px-0 pb-20">
          <div className="bg-slate-900 p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden rounded-2xl shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="bg-white/10 p-2 rounded-lg text-orange-400">
                <Zap size={22} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-tight mb-1">
                  Gabung Mitra Pasarqu
                </h3>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Kelola toko atau jadi kurir sekarang
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/portal")}
              className="relative z-10 px-8 py-3 bg-teal-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-teal-600 transition-all"
            >
              Buka Portal <ArrowRight size={12} className="inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

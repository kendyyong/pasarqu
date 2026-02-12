import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MapPin,
  Search as SearchIcon,
  Loader2,
  ShoppingBasket,
  User,
  Zap,
  ArrowRight,
  Flame,
  Star,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useMarket } from "../contexts/MarketContext";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { Product } from "../types";

interface HomeProps {
  searchQuery: string;
}

export const Home: React.FC<HomeProps> = ({ searchQuery }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedMarket, addToCart } = useMarket();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]); // State untuk Tombol Cepat
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fungsi Ambil Data Produk
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*, merchants(name)")
        .eq("status", "APPROVED")
        .order("created_at", { ascending: false });

      if (selectedMarket?.id) {
        query = query.eq("market_id", selectedMarket.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error("Gagal mengambil produk:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fungsi Ambil Data Tombol Cepat (Quick Actions)
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
    fetchProducts();
    fetchQuickActions();
  }, [selectedMarket, searchQuery]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Helper untuk menentukan icon mana yang tampil
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
    <div className="w-full font-sans text-left bg-white min-h-screen pb-24">
      {/* 1. TOP HEADER */}
      <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <ShoppingBasket size={18} />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tighter uppercase leading-none">
            Pasarqu
          </span>
        </div>

        <div className="flex items-center gap-3">
          {selectedMarket && (
            <div className="flex items-center gap-1 text-[9px] font-black text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-full border border-teal-100">
              <MapPin size={10} /> {selectedMarket.name}
            </div>
          )}

          <button
            onClick={() => navigate("/portal")}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 ml-2 shadow-sm active:scale-95"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-teal-600 border border-slate-200">
              <User size={14} />
            </div>
            <div className="text-right leading-none">
              <span className="block text-[8px] font-bold text-slate-400 uppercase">
                Status
              </span>
              <span className="block text-[10px] font-black uppercase text-slate-800">
                {user ? "Dashboard" : "Tamu"}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* 2. TOMBOL CEPAT (Dinamis dari Super Admin) */}
      {!searchQuery && quickActions.length > 0 && (
        <div className="px-4 py-6 overflow-x-auto no-scrollbar flex gap-6 border-b border-slate-50">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.link_to)}
              className="flex flex-col items-center gap-2 group shrink-0"
            >
              <div
                className={`${action.bg_color || "bg-teal-500"} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                {renderIcon(action.icon_name)}
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center leading-none">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. PRODUK GRID */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <SearchIcon className="mx-auto text-slate-200 mb-2" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
              Produk belum tersedia
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-all group"
            >
              <div
                onClick={() => navigate(`/product/${product.id}`)}
                className="aspect-square m-2 rounded-[1.5rem] overflow-hidden relative bg-slate-50 cursor-pointer"
              >
                <img
                  src={
                    product.image_url ||
                    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={product.name}
                />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-teal-600 text-[8px] font-black px-2 py-1 rounded-lg">
                  FRESH
                </div>
              </div>
              <div className="p-4 pt-0 flex flex-col flex-1">
                <p className="text-[8px] font-black text-slate-300 uppercase truncate mb-1">
                  {product.merchants?.name || "Toko Pasarqu"}
                </p>
                <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 mb-4 leading-tight min-h-[32px]">
                  {product.name}
                </h4>
                <div className="mt-auto flex justify-between items-center">
                  <span className="text-sm font-black text-slate-900 tracking-tighter">
                    Rp {product.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      addToCart(product);
                      showToast("Masuk Keranjang", "success");
                    }}
                    className="w-10 h-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-teal-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. PORTAL PARTNER FOOTER */}
      <div className="px-4 mt-12">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="bg-white/10 p-1.5 rounded-lg text-orange-400">
                <Zap size={16} fill="currentColor" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Kesempatan Bermitra
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight">
              Gabung Jadi Mitra <br />{" "}
              <span className="text-teal-400 font-black">Pasar Digital</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-3 max-w-xs mx-auto md:mx-0 leading-relaxed">
              Dapatkan akses ke dashboard toko atau ambil pesanan sebagai kurir
              langsung lewat aplikasi.
            </p>
          </div>
          <button
            onClick={() => navigate("/portal")}
            className="relative z-10 px-8 py-4 bg-teal-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-teal-900 transition-all active:scale-95 shadow-lg shadow-teal-500/20"
          >
            Buka Portal Mitra <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 5. FOOTER COPYRIGHT */}
      <div className="mt-8 mb-24 px-6 py-12 border-t border-slate-50 text-center opacity-30">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em]">
          © 2026 Pasarqu Ecosystem • Digitalizing Traditional Markets
        </p>
      </div>
    </div>
  );
};

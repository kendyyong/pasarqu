import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Image,
  MapPin,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  Store,
  Bike,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useMarket } from "../contexts/MarketContext";
import { useToast } from "../contexts/ToastContext";
import { Product } from "../types";

interface HomeProps {
  searchQuery: string;
}

export const Home: React.FC<HomeProps> = ({ searchQuery }) => {
  const navigate = useNavigate();
  const { selectedMarket, addToCart } = useMarket();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedMarket?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, merchants(city)")
          .eq("market_id", selectedMarket.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setProducts(data);
      } catch (err) {
        console.error("Gagal mengambil produk:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedMarket]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-[1200px] mx-auto font-sans px-0 md:px-0">
      {/* JUDUL SECTION */}
      <div className="bg-white p-3 border-b border-slate-100 flex justify-between items-center sticky top-[54px] md:top-[70px] z-30 shadow-sm mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
            Semua Produk
          </h3>
        </div>
      </div>

      {/* GRID PRODUK */}
      <div className="bg-slate-50 px-2 pt-2 min-h-[300px]">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-64 animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 font-bold">
            Belum ada produk ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="relative aspect-square overflow-hidden cursor-pointer bg-slate-100"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Image size={24} />
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1 leading-tight min-h-[32px]">
                    {product.name}
                  </h3>
                  <div className="mt-auto pt-2 flex justify-between items-center border-t border-slate-50">
                    <span className="text-sm font-black text-teal-600">
                      Rp {product.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        addToCart(product);
                        showToast("Masuk Keranjang", "success");
                      }}
                      className="w-7 h-7 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center border border-teal-200"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- FOOTER PORTAL MITRA (SHOPEE STYLE - SPLIT CONTENT) --- */}
      <footer className="mt-12 mb-28 mx-2 lg:mx-0">
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* BAGIAN 1: KEUNGGULAN (KIRI) */}
          <div className="flex-1 p-8 text-left bg-slate-50/50">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-orange-500 fill-orange-500" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Kenapa Mitra Pasarqu?
              </h4>
            </div>
            <h2 className="text-xl font-black text-slate-800 leading-tight mb-6">
              Tingkatkan Omzet Pasar <br /> Lewat Genggaman Anda.
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-teal-600 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-slate-700">
                    Pendaftaran Tanpa Biaya
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">
                    Gratis & Cepat
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-teal-600 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-slate-700">
                    Sistem Kasir Otomatis
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">
                    Laporan Real-time
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-teal-600 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-slate-700">
                    Dukungan Kurir Lokal
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">
                    Pengiriman Instan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: AKSES PORTAL (KANAN) */}
          <div className="flex-[0.7] p-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-teal-600 rounded-[1.25rem] flex items-center justify-center text-white mb-4 shadow-xl shadow-teal-600/20">
              <LayoutDashboard size={28} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">
              Portal Utama Mitra
            </h3>
            <p className="text-[10px] text-slate-400 mb-6 leading-relaxed max-w-[200px]">
              Klik tombol di bawah untuk masuk ke dashboard Toko, Kurir, atau
              Admin.
            </p>
            <button
              onClick={() => navigate("/portal")}
              className="w-full max-w-[200px] py-4 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Buka Portal <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* BOTTOM BAR (COPYRIGHT) */}
        <div className="mt-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
          <div className="flex gap-6">
            <Store size={14} />
            <Bike size={14} />
            <ShieldCheck size={14} />
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            © 2026 PASARQU • DIGITALIZING TRADITIONAL MARKET
          </p>
        </div>
      </footer>
    </div>
  );
};

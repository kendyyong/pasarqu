import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  MapPin,
  Search as SearchIcon,
  Loader2,
  ShoppingBasket,
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

      if (!data || data.length === 0) {
        const { data: globalData } = await supabase
          .from("products")
          .select("*, merchants(name)")
          .eq("status", "APPROVED")
          .limit(20);
        setProducts(globalData || []);
      } else {
        setProducts(data || []);
      }
    } catch (err: any) {
      console.error("Gagal mengambil produk:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedMarket, searchQuery]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full font-sans text-left bg-white min-h-screen">
      {/* 1. TOP BAR (MOBILE) - SEKARANG BENAR-BENAR BERSIH */}
      <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg">
            <ShoppingBasket size={18} />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tighter uppercase">
            Pasarqu
          </span>
        </div>

        {/* Hanya info lokasi di kanan atas. Tombol profil/tamu SUDAH DIHAPUS TOTAL */}
        {selectedMarket && (
          <div className="flex items-center gap-1 text-[9px] font-black text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-full border border-teal-100">
            <MapPin size={10} /> {selectedMarket.name}
          </div>
        )}
      </header>

      {/* 2. AREA KONTEN (GRID PRODUK) */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <SearchIcon className="mx-auto text-slate-200 mb-2" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Produk belum tersedia
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-all"
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
                  className="w-full h-full object-cover"
                  alt={product.name}
                />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-teal-600 text-[8px] font-black px-2 py-1 rounded-lg shadow-sm uppercase">
                  Segar
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
                  <span className="text-sm font-black text-teal-700 tracking-tighter font-sans">
                    Rp {product.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      addToCart(product);
                      showToast("Masuk Keranjang", "success");
                    }}
                    className="w-10 h-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER SEDERHANA */}
      <div className="mt-10 mb-20 px-6 py-10 border-t border-slate-50 text-center opacity-30">
        <Zap size={24} className="mx-auto mb-2 text-slate-400" />
        <p className="text-[8px] font-black uppercase tracking-[0.4em]">
          © 2026 Pasarqu Ecosystem
        </p>
      </div>
    </div>
  );
};

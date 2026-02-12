import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Image, MapPin, Star } from "lucide-react";
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

  // --- FETCH DATA (VERSI LONGGAR / DEBUG) ---
  useEffect(() => {
    const fetchProducts = async () => {
      // 1. Cek apakah market sudah terpilih
      if (!selectedMarket?.id) {
        console.log("Belum ada market yang dipilih.");
        return;
      }

      console.log(
        "Sedang mengambil produk untuk Market ID:",
        selectedMarket.id,
      );
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, merchants(city)")
          .eq("market_id", selectedMarket.id) // HANYA Filter Market ID dulu
          // .eq("status", "approved")  <-- SAYA MATIKAN SEMENTARA
          // .eq("is_active", true)     <-- SAYA MATIKAN SEMENTARA
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error Database:", error);
          throw error;
        }

        console.log("Data Produk Ditemukan:", data); // Cek Console (F12)
        if (data) setProducts(data);
      } catch (err) {
        console.error("Gagal mengambil produk:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedMarket]);

  // FILTER PENCARIAN
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-[1200px] mx-auto px-0 md:px-0">
      {/* JUDUL */}
      <div className="bg-white p-3 border-b border-slate-100 flex justify-between items-center sticky top-[54px] md:top-[70px] z-30 shadow-sm mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-orange-500 rounded-full"></div>
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
            Semua Produk
          </h3>
        </div>
      </div>

      {/* GRID PRODUK */}
      <div className="pb-24 bg-slate-50 min-h-screen px-2 pt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl h-60 animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // JIKA KOSONG, TAMPILKAN PESAN INI
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-500 font-bold mb-2">
              Tidak ada produk ditemukan.
            </p>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Pastikan Anda memilih Pasar yang benar (ID: {selectedMarket?.id})
              dan sudah mengisi data di tabel 'products'.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full"
              >
                {/* 1. GAMBAR (Klik -> Detail Produk) */}
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
                  {/* Badge Diskon */}
                  {(product.discount || 0) > 0 && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg shadow-sm">
                      {product.discount}%
                    </div>
                  )}
                </div>

                {/* 2. INFO (Klik -> Detail Produk) */}
                <div
                  className="p-3 flex flex-col flex-1 cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <h3 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1 leading-tight min-h-[32px]">
                    {product.name}
                  </h3>

                  <div className="mt-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-slate-900">
                        Rp {product.price.toLocaleString()}
                      </span>
                      {/* TOMBOL TAMBAH (Klik -> Keranjang) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                          showToast("Masuk Keranjang", "success");
                        }}
                        className="w-7 h-7 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center border border-teal-200"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-2 pt-2 border-t border-slate-50">
                      <MapPin size={10} />
                      {/* @ts-ignore */}
                      {product.merchants?.city || "Kota"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

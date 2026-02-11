import React from "react";
import { ShoppingCart, Star, MapPin } from "lucide-react";
import { Product } from "../types";
import { useMarket } from "../contexts/MarketContext";
// 1. IMPORT HOOK NAVIGASI
import { useNavigate } from "react-router-dom";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
}) => {
  const { addToCart, selectedMarket } = useMarket();

  // 2. INISIALISASI NAVIGASI
  const navigate = useNavigate();

  // 3. FUNGSI PINDAH HALAMAN
  const handleProductClick = (merchantId: string) => {
    if (!merchantId) {
      console.error("ID Toko tidak ditemukan");
      return;
    }
    // Arahkan ke halaman ShopDetail yang baru kita buat
    navigate(`/shop/${merchantId}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 p-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div
            key={i}
            className="bg-white rounded-[4px] h-64 animate-pulse shadow-sm border border-slate-100"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-md border border-dashed border-slate-200 mx-2">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          Produk tidak ditemukan
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-2 p-1.5 md:p-0">
      {products.map((product) => (
        <div
          key={product.id}
          // 4. ONCLICK DI CONTAINER UTAMA
          // Kita gunakan fallback merchant_id || sellerId agar data dummy/db keduanya jalan
          onClick={() =>
            handleProductClick(product.merchant_id || (product as any).sellerId)
          }
          className="group bg-white rounded-[4px] overflow-hidden flex flex-col relative shadow-sm hover:shadow-md border border-transparent hover:border-orange-500/30 transition-all duration-300 cursor-pointer"
        >
          {/* Area Gambar (Square 1:1) */}
          <div className="aspect-square w-full bg-slate-50 overflow-hidden relative">
            <div className="absolute top-0 left-0 z-10">
              <div className="bg-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-br-sm shadow-sm leading-tight">
                STAR+
              </div>
            </div>

            <img
              src={
                product.image_url ||
                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400"
              }
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Detail Produk */}
          <div className="p-2 flex flex-col flex-1 text-left">
            <h3 className="text-[11px] md:text-xs font-medium text-slate-800 line-clamp-2 leading-snug mb-1 h-8 overflow-hidden uppercase">
              {product.name}
            </h3>

            <div className="flex flex-wrap gap-1 mb-1.5">
              <div className="text-[8px] border border-teal-500 text-teal-600 px-1 rounded-[2px] font-bold leading-tight flex items-center gap-0.5">
                🚚 Gratis Ongkir
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-[10px] font-bold text-orange-600">
                  Rp
                </span>
                <span className="text-sm md:text-base font-black text-orange-600 tracking-tighter">
                  {product.price.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 pb-2 mb-1">
                <div className="flex items-center gap-0.5">
                  <Star size={9} fill="#fbbf24" className="text-yellow-400" />
                  <span className="text-[9px] font-bold text-slate-500">
                    4.9
                  </span>
                </div>
                <div className="flex items-center gap-0.5 max-w-[60px]">
                  <MapPin size={9} />
                  <span className="text-[9px] truncate font-medium">
                    {selectedMarket?.name || "Area"}
                  </span>
                </div>
              </div>

              {/* TOMBOL TAMBAH (Stop Propagation agar tidak pindah halaman saat klik tombol ini) */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // PENTING: Mencegah klik "tembus" ke handleProductClick di kontainer
                  addToCart(product);
                }}
                className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-[4px] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <ShoppingCart size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Tambah
                </span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

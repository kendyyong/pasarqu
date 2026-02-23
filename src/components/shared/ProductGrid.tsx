import React from "react";
import { ShoppingCart, Star, MapPin, Timer } from "lucide-react"; // Tambah Timer
import { Product } from "../../types";
import { useMarket } from "../../contexts/MarketContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";

interface ProductGridProps {
  products: any[]; // Gunakan any[] agar field is_po terbaca jika interface Product belum update
  isLoading: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
}) => {
  const { addToCart, selectedMarket } = useMarket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // FUNGSI PINDAH KE DETAIL PRODUK (Bukan ke Toko)
  const handleProductClick = (productId: string) => {
    if (!productId) {
      console.error("ID Produk tidak ditemukan");
      return;
    }
    // Arahkan ke halaman Detail Produk
    navigate(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl h-64 animate-pulse shadow-sm border border-slate-100"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100 mx-2">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          Produk tidak ditemukan
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 p-2 md:p-0">
      {products.map((product) => (
        <div
          key={product.id}
          // ONCLICK SEKARANG KE DETAIL PRODUK
          onClick={() => handleProductClick(product.id)}
          className="group bg-white rounded-xl overflow-hidden flex flex-col relative shadow-sm hover:shadow-xl border border-transparent hover:border-teal-500/20 transition-all duration-500 cursor-pointer"
        >
          {/* Area Gambar */}
          <div className="aspect-square w-full bg-slate-50 overflow-hidden relative">
            {/* BADGE STAR+ */}
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-orange-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-lg uppercase">
                STAR+
              </div>
            </div>

            {/* BADGE PRE-ORDER (PO) - FITUR BARU */}
            {product.is_po && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-teal-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-lg flex items-center gap-1 uppercase animate-pulse">
                  <Timer size={8} /> PO
                </div>
              </div>
            )}

            <img
              src={product.image_url || "https://via.placeholder.com/400"}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>

          {/* Detail Produk */}
          <div className="p-3 flex flex-col flex-1 text-left">
            <h3 className="text-[10px] md:text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight mb-2 h-8 overflow-hidden uppercase">
              {product.name}
            </h3>

            <div className="mt-auto">
              <div className="flex items-baseline gap-0.5 mb-2">
                <span className="text-sm md:text-base font-black text-orange-600 tracking-tighter">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">
                  /{product.unit || "Pcs"}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 mb-3">
                <div className="flex items-center gap-0.5">
                  <Star size={10} fill="#fbbf24" className="text-yellow-400" />
                  <span className="text-[9px] font-black text-slate-500">
                    4.9
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <MapPin size={10} className="text-slate-300" />
                  <span className="text-[9px] font-bold truncate max-w-[50px] uppercase">
                    {selectedMarket?.name || "Area"}
                  </span>
                </div>
              </div>

              {/* TOMBOL KERANJANG */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Mencegah pindah ke halaman detail saat klik tombol ini
                  addToCart(product);
                  showToast("Masuk Keranjang", "success");
                }}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShoppingCart size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">
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

import React, { useState } from "react";
import {
  ShoppingBasket,
  Timer,
  Package,
  Store,
  Tag,
  Star,
  MapPin,
  Heart,
  Truck,
  CheckCircle2,
} from "lucide-react";

interface Props {
  product: any;
  onNavigate: (id: string) => void;
  onAddToCart: (p: any) => void;
}

export const ProductCard: React.FC<Props> = ({
  product,
  onNavigate,
  onAddToCart,
}) => {
  const [isWishlist, setIsWishlist] = useState(false);
  const isHabis = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // 🚀 LOGIKA PROMO SINKRONISASI DATABASE (Membaca final_price)
  const basePrice = product.price || 0;
  const currentPrice = product.final_price || product.price || 0;

  // Jika final_price LEBIH KECIL dari price, berarti ada promo aktif!
  const hasPromo = currentPrice < basePrice;

  // Hitung persentase diskon
  const discountPercent = hasPromo
    ? Math.round(((basePrice - currentPrice) / basePrice) * 100)
    : 0;

  // 🚀 LOGIKA ANGKA TERJUAL STABIL (5-20)
  const getStableSold = (id: string) => {
    if (!id) return 5;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 16) + 5;
  };

  const rating = product.rating || 4.8;
  const soldCount = product.sold_count || getStableSold(product.id);
  const location = product.merchants?.location || "Muara Jawa";

  return (
    <div
      onClick={() => onNavigate(product.id)}
      className={`flex flex-col h-full bg-white rounded-none md:rounded-xl md:border md:border-slate-100 md:shadow-sm overflow-hidden group transition-all cursor-pointer active:bg-slate-50 relative ${
        isHabis ? "opacity-90" : ""
      }`}
    >
      {/* --- AREA GAMBAR --- */}
      <div className="aspect-square w-full overflow-hidden bg-slate-50 relative">
        <img
          src={
            product.image_url ||
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
          }
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isHabis ? "grayscale" : ""
          }`}
          alt={product.name}
        />

        {/* 🚀 PRO: TOMBOL WISHLIST (HEART) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlist(!isWishlist);
          }}
          className="absolute top-2 right-2 z-30 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm active:scale-90 transition-all"
        >
          <Heart
            size={16}
            className={
              isWishlist ? "fill-red-500 text-red-500" : "text-slate-400"
            }
          />
        </button>

        {/* 🚀 BADGE DISKON MERAH (PERSENTASE) */}
        {hasPromo && !isHabis && (
          <div className="absolute top-0 left-0 z-20">
            <div className="bg-[#e1251b] text-white px-2.5 py-1 rounded-br-xl shadow-lg flex items-center gap-1 border-b border-r border-red-700/50">
              <span className="text-[12px] font-[1000] tracking-tighter">
                -{discountPercent}%
              </span>
            </div>
          </div>
        )}

        {/* 🚀 PRO: BADGE GRATIS ONGKIR */}
        {!isHabis && (
          <div className="absolute bottom-2 right-2 z-20">
            <div className="bg-[#008080] text-white p-1 rounded-md shadow-md flex items-center justify-center">
              <Truck size={14} fill="white" />
            </div>
          </div>
        )}

        {/* BADGE PRE-ORDER */}
        {(product.is_preorder || product.is_po) && (
          <div className="absolute bottom-2 left-2 bg-[#FF6600] text-white text-[8px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase">
            <Timer size={10} /> PO {product.preorder_days || product.po_days}{" "}
            HARI
          </div>
        )}
      </div>

      {/* --- DETAIL PRODUK --- */}
      <div className="p-3 flex flex-col flex-1 text-left">
        {/* MERCHANT DENGAN BADGE "PILIHAN" */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex items-center gap-0.5 bg-teal-50 text-teal-600 px-1 rounded-[2px] border border-teal-100 shrink-0">
            <CheckCircle2 size={8} fill="currentColor" className="text-white" />
            <span className="text-[7px] font-bold uppercase tracking-tighter">
              Pilihan
            </span>
          </div>
          <p className="text-[9px] font-medium text-slate-400 uppercase truncate">
            {product.merchants?.shop_name || "Toko Pasarqu"}
          </p>
        </div>

        {/* JUDUL PRODUK */}
        <h4
          className={`text-[12px] font-normal text-slate-700 line-clamp-2 leading-tight uppercase ${isHabis ? "line-through text-slate-400" : ""}`}
        >
          {product.name}
        </h4>

        {/* 🚀 INFO BERAT & SATUAN */}
        <div className="flex items-center gap-1 mt-1 mb-1.5">
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 uppercase tracking-tighter">
            {product.weight} {product.unit || "Pcs"}
          </span>
          <span className="text-[9px] text-slate-400 font-medium italic">
            / {product.unit || "Satuan"}
          </span>
        </div>

        {/* RATING & TERJUAL */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          <span className="text-[10px] font-bold text-slate-600">{rating}</span>
          <span className="text-[10px] text-slate-300">|</span>
          <span className="text-[10px] text-slate-500 font-normal">
            Terjual {soldCount}
          </span>
        </div>

        {/* 🚀 KOTAK HARGA (CORET & NORMAL) */}
        <div className="mt-auto">
          <div className="flex flex-col mb-2">
            {/* HARGA CORET MERAH (TAMPIL JIKA ADA PROMO) */}
            {hasPromo ? (
              <>
                <span className="text-[10px] text-slate-400 line-through decoration-red-500 font-medium mb-0.5">
                  Rp {basePrice.toLocaleString()}
                </span>
                <div className="flex items-center justify-between w-full">
                  {/* HARGA DISKON (ORANYE BESAR) */}
                  <span className="text-[14px] font-[1000] text-[#FF6600] tracking-tighter leading-none">
                    Rp {currentPrice.toLocaleString()}
                  </span>
                  {/* LABEL STOK */}
                  {!isHabis && (
                    <div
                      className={`text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${isLowStock ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100"}`}
                    >
                      {isLowStock
                        ? `SISA ${product.stock}`
                        : `STOK ${product.stock}`}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // JIKA TIDAK ADA PROMO (TAMPILAN NORMAL)
              <div className="flex items-center justify-between w-full mt-3">
                <span className="text-[14px] font-bold text-slate-800 tracking-tighter leading-none">
                  Rp {basePrice.toLocaleString()}
                </span>
                {/* LABEL STOK */}
                {!isHabis && (
                  <div
                    className={`text-[8px] font-bold px-1 py-0.5 rounded border shrink-0 ${isLowStock ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100"}`}
                  >
                    {isLowStock
                      ? `SISA ${product.stock}`
                      : `STOK ${product.stock}`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LOKASI */}
          <div className="flex items-center gap-1 mb-3 text-slate-400">
            <MapPin size={10} className="shrink-0" />
            <span className="text-[9px] font-normal uppercase tracking-wider truncate">
              {location}
            </span>
          </div>
        </div>

        {/* TOMBOL ADD TO CART */}
        <button
          disabled={isHabis}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm ${
            isHabis
              ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
              : "bg-[#008080] text-white hover:bg-teal-700"
          }`}
        >
          {isHabis ? (
            <span className="text-[9px] font-bold uppercase tracking-widest">
              HABIS
            </span>
          ) : (
            <>
              <ShoppingBasket size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                TAMBAH
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

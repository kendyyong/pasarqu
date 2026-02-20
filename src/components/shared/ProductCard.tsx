import React from "react";
import { ShoppingBasket, Timer, Package, Store, Tag } from "lucide-react";
// ✅ Jalur diperbaiki: Mundur 2 langkah ke src, lalu ke hooks
import { useMerchantProducts } from "../../hooks/useMerchantProducts";

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
  const isHabis = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 5;

  // LOGIC DISKON
  const hasDiscount =
    product.discount_type &&
    product.discount_type !== "none" &&
    product.discount_value > 0;

  const displayPrice = hasDiscount ? product.final_price : product.price;

  let discountBadgeText = "";
  if (hasDiscount) {
    if (product.discount_type === "percent") {
      discountBadgeText = `-${product.discount_value}%`;
    } else {
      const percent = Math.round(
        ((product.price - product.final_price) / product.price) * 100,
      );
      discountBadgeText = `-${percent}%`;
    }
  }

  return (
    <div
      onClick={() => onNavigate(product.id)}
      className={`flex flex-col h-full bg-white rounded-none md:rounded-xl md:border md:border-slate-100 md:shadow-sm overflow-hidden group transition-all ${
        isHabis ? "opacity-90" : ""
      }`}
    >
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

        {/* BADGE DISKON */}
        {hasDiscount && !isHabis && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm z-10 animate-pulse">
            {discountBadgeText}
          </div>
        )}

        {/* BADGE PO */}
        {product.is_po && (
          <div className="absolute bottom-2 left-2 bg-[#FF6600] text-white text-[8px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase">
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

        <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 mb-2 leading-tight min-h-[32px] text-left">
          {product.name}
        </h4>

        <div className="mt-auto mb-3">
          <div className="flex flex-col text-left">
            {hasDiscount && (
              <span className="text-[10px] text-slate-400 line-through font-medium mb-[-2px]">
                Rp {product.price.toLocaleString()}
              </span>
            )}

            <div className="flex items-center justify-between w-full">
              <span className="text-[15px] font-black text-[#FF6600] tracking-tighter">
                Rp {displayPrice?.toLocaleString()}
              </span>

              {!isHabis && (
                <div
                  className={`flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded ${
                    isLowStock
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-teal-50 text-teal-600 border border-teal-100"
                  }`}
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
          </div>
        </div>

        <button
          disabled={isHabis}
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${
            isHabis
              ? "bg-slate-100 text-slate-400"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {isHabis ? (
            "STOK HABIS"
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
};

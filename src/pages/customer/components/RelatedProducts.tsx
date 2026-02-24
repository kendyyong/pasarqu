import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { ShoppingBasket, Loader2 } from "lucide-react";
import { useMarket } from "../../../contexts/MarketContext";
import { useToast } from "../../../contexts/ToastContext";

export const RelatedProducts = ({
  categoryId,
  currentProductId,
}: {
  categoryId: string;
  currentProductId: string;
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useMarket();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchRelated = async () => {
      setIsLoading(true);
      if (!categoryId) {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase
        .from("products")
        .select("*, merchants:merchant_id(shop_name)")
        .eq("category_id", categoryId)
        .neq("id", currentProductId) // Jangan tampilkan produk yang sedang dibuka
        .eq("status", "APPROVED")
        .limit(6);

      if (data) setProducts(data);
      setIsLoading(false);
    };
    fetchRelated();
  }, [categoryId, currentProductId]);

  // JIKA SEDANG LOADING
  if (isLoading) {
    return (
      <div className="mt-2 py-6 flex flex-col items-center justify-center gap-2">
        <Loader2
          className="animate-spin text-slate-300"
          size={24}
          strokeWidth={3}
        />
        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
          Mencari Produk...
        </span>
      </div>
    );
  }

  // JIKA KOSONG (Agar tidak gaib / menghilang lagi)
  if (products.length === 0) {
    return (
      <div className="mt-2">
        <h3 className="text-[16px] font-[1000] text-slate-800 uppercase tracking-widest mb-4 px-1">
          Mungkin Anda Suka
        </h3>
        <div className="w-full p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center">
          <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest text-center">
            Belum ada produk lain di kategori ini
          </span>
        </div>
      </div>
    );
  }

  // JIKA ADA DATANYA
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[16px] font-[1000] text-slate-800 uppercase tracking-widest">
          Mungkin Anda Suka
        </h3>
        <button className="text-[12px] font-[1000] text-[#008080] uppercase tracking-widest hover:underline active:scale-95 transition-all">
          Lihat Semua
        </button>
      </div>

      {/* Slider Bergaya "Shopee Peek" */}
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {products.map((p) => {
          const isHabis = p.stock <= 0;
          return (
            <div
              key={p.id}
              onClick={() => {
                navigate(`/product/${p.id}`);
                window.scrollTo(0, 0); // Scroll ke atas saat ganti produk
              }}
              className="w-[140px] md:w-[160px] shrink-0 snap-start bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-all group hover:border-[#008080]/30 hover:shadow-md"
            >
              <div className="w-full aspect-square bg-slate-50 relative overflow-hidden">
                <img
                  src={
                    p.image_url ||
                    `https://ui-avatars.com/api/?name=${p.name}&background=f8fafc&color=94a3b8`
                  }
                  alt={p.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${isHabis ? "grayscale" : ""}`}
                />
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h4 className="text-[12px] font-bold text-slate-700 line-clamp-2 leading-tight mb-2 min-h-[36px]">
                  {p.name}
                </h4>
                <span className="text-[14px] font-black text-[#FF6600] mt-auto tracking-tighter">
                  Rp {p.price.toLocaleString()}
                </span>

                <button
                  disabled={isHabis}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isHabis) {
                      addToCart(p, 1);
                      showToast("Masuk Keranjang", "success");
                    }
                  }}
                  className={`w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${isHabis ? "bg-slate-100 text-slate-400" : "bg-[#008080] text-white hover:bg-teal-700"}`}
                >
                  <ShoppingBasket size={14} />
                  <span className="text-[12px] font-black uppercase tracking-widest">
                    {isHabis ? "HABIS" : "TAMBAH"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

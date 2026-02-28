import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { ProductForm } from "./ProductForm";
import {
  Loader2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Clock,
  CheckCircle2,
  Layers,
  Archive,
  ToggleRight,
  ToggleLeft,
  AlertCircle,
  Tag,
  Save,
  X,
  Megaphone,
} from "lucide-react";

interface Props {
  autoOpenTrigger?: number;
  merchantProfile: any;
  isPromoMode?: boolean;
}

export const MerchantProducts: React.FC<Props> = ({
  autoOpenTrigger = 0,
  merchantProfile,
  isPromoMode = false,
}) => {
  const { user } = useAuth() as any;
  const { showToast } = useToast();

  const [view, setView] = useState<"list" | "form">("list");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [promoProduct, setPromoProduct] = useState<any>(null);
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    if (autoOpenTrigger > 0 && !isPromoMode) {
      setSelectedProduct(null);
      setView("form");
    } else {
      setView("list");
    }
  }, [autoOpenTrigger, isPromoMode]);

  const fetchData = useCallback(
    async (isSilent = false) => {
      if (!user || !merchantProfile?.id) return;
      if (!isSilent) setLoading(true);
      try {
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .order("name");
        if (catData) setCategories(catData);

        const { data: prodData, error: prodErr } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("merchant_id", merchantProfile.id)
          .order("created_at", { ascending: false });

        if (prodErr) throw prodErr;
        if (prodData) setProducts(prodData);
      } catch (err: any) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    },
    [user, merchantProfile?.id, showToast],
  );

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`merchant_products_sync_${merchantProfile?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `merchant_id=eq.${merchantProfile?.id}`,
        },
        () => fetchData(true),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, merchantProfile?.id]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("HAPUS PRODUK INI SECARA PERMANEN?")) return;
    setIsProcessing(id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      showToast("PRODUK BERHASIL DIHAPUS", "success");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      showToast("Gagal menghapus produk", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleProductStatus = async (product: any) => {
    if (!product.is_verified) {
      showToast("Produk masih ditinjau Admin. Belum bisa diaktifkan.", "error");
      return;
    }
    setIsProcessing(product.id);
    const newStatus = !product.is_active;
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_active: newStatus })
        .eq("id", product.id);
      if (error) throw error;
      showToast(
        newStatus ? "PRODUK DIAKTIFKAN" : "PRODUK DISEMBUNYIKAN",
        "success",
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: newStatus } : p,
        ),
      );
    } catch (err) {
      showToast("Gagal mengubah status", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  // 🚀 FUNGSI SIMPAN PROMO CERDAS
  const handleSavePromoPrice = async () => {
    if (!promoProduct) return;
    setIsProcessing("promo_save");
    try {
      let parsedPrice = parseInt(newPrice.replace(/\D/g, ""), 10);
      let isCancelingPromo = false;

      // Jika input kosong atau harga disamakan/lebih mahal dari harga asli, artinya PROMO DIBATALKAN
      if (
        isNaN(parsedPrice) ||
        parsedPrice >= promoProduct.price ||
        parsedPrice <= 0
      ) {
        parsedPrice = promoProduct.price;
        isCancelingPromo = true;
      }

      // HANYA UPDATE final_price (Harga Jual), Biarkan price (Harga Asli) Tetap Utuh
      const { error } = await supabase
        .from("products")
        .update({
          final_price: parsedPrice,
        })
        .eq("id", promoProduct.id);

      if (error) throw error;

      if (isCancelingPromo) {
        showToast("PROMO DIBATALKAN. HARGA KEMBALI NORMAL.", "success");
      } else {
        showToast("HARGA PROMO BERHASIL AKTIF! ✅", "success");
      }

      setPromoProduct(null);
      setNewPrice("");
      fetchData(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    let matchTab = false;
    if (activeFilter === "ALL") matchTab = true;
    else if (activeFilter === "ACTIVE") matchTab = p.is_verified && p.is_active;
    else if (activeFilter === "PENDING") matchTab = !p.is_verified;
    else if (activeFilter === "EMPTY") matchTab = p.stock <= 0;

    const matchSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    ALL: products.length,
    ACTIVE: products.filter((p) => p.is_verified && p.is_active).length,
    PENDING: products.filter((p) => !p.is_verified).length,
    EMPTY: products.filter((p) => p.stock <= 0).length,
  };

  if (view === "list") {
    return (
      <div className="w-full animate-in fade-in duration-500 pb-24 text-left font-sans uppercase tracking-tighter">
        {/* BANNER MODE PROMO */}
        {isPromoMode && (
          <div className="bg-[#FF6600] text-white p-4 rounded-xl mb-4 flex items-center justify-between shadow-md animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <Megaphone size={24} className="animate-pulse" />
              <div>
                <h3 className="font-black text-[14px]">
                  MODE ATUR PROMO (HARGA INSTAN)
                </h3>
                <p className="text-[10px] font-bold opacity-90 tracking-widest normal-case">
                  Pilih produk dan ketuk ikon{" "}
                  <Tag size={12} className="inline" /> untuk memberikan diskon
                  harga tanpa persetujuan Admin.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-8 border-[#008080] mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-none flex items-center gap-2">
              <Package className="text-[#008080]" size={24} /> KATALOG PRODUK
            </h2>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-widest mt-1">
              MENGELOLA {products.length} ITEM DI ETALASE ANDA
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="bg-slate-900 hover:bg-[#008080] text-white px-6 py-3 md:py-3.5 rounded-xl font-black text-[11px] uppercase shadow-md transition-all flex items-center justify-center gap-2 tracking-widest active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> TAMBAH PRODUK BARU
          </button>
        </div>

        <div className="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-sm flex flex-col lg:flex-row gap-2 mb-6">
          <div className="relative w-full lg:w-1/3 shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="CARI NAMA BARANG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-3 md:py-3.5 text-[11px] font-black outline-none focus:ring-2 ring-[#008080] transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full">
            <TabButton
              label="SEMUA"
              count={counts.ALL}
              isActive={activeFilter === "ALL"}
              onClick={() => setActiveFilter("ALL")}
              color="bg-slate-900"
            />
            <TabButton
              label="AKTIF"
              count={counts.ACTIVE}
              isActive={activeFilter === "ACTIVE"}
              onClick={() => setActiveFilter("ACTIVE")}
              color="bg-[#008080]"
            />
            <TabButton
              label="DITINJAU"
              count={counts.PENDING}
              isActive={activeFilter === "PENDING"}
              onClick={() => setActiveFilter("PENDING")}
              color="bg-[#FF6600]"
            />
            <TabButton
              label="HABIS"
              count={counts.EMPTY}
              isActive={activeFilter === "EMPTY"}
              onClick={() => setActiveFilter("EMPTY")}
              color="bg-red-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 bg-white rounded-xl border-2 border-slate-100">
            <Loader2 className="animate-spin text-[#008080]" size={40} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              SINKRONISASI ETALASE...
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            <AlertCircle className="text-slate-300 mb-4" size={48} />
            <p className="text-[12px] font-black text-slate-400 tracking-widest">
              BELUM ADA BARANG
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product: any) => {
              const isEmpty = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;
              const isPending = !product.is_verified;

              // 🚀 KALKULATOR DISKON PERSENTASE
              const isPromoActive =
                product.final_price && product.final_price < product.price;
              const discountPercent = isPromoActive
                ? Math.round(
                    ((product.price - product.final_price) / product.price) *
                      100,
                  )
                : 0;

              return (
                <div
                  key={product.id}
                  className={`bg-white border-2 rounded-xl overflow-hidden shadow-sm transition-all flex flex-col group relative ${isPromoMode ? "border-[#FF6600]" : "border-slate-100 hover:border-[#008080] hover:shadow-md"}`}
                >
                  <div className="aspect-square relative bg-slate-50 border-b-2 border-slate-100 shrink-0 overflow-hidden">
                    <img
                      src={product.image_url || "/placeholder-product.png"}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!product.is_active || isEmpty || isPending ? "grayscale opacity-60" : ""}`}
                    />

                    {/* 🚀 BADGE MERAH PERSENTASE DISKON (SUDUT KIRI ATAS) */}
                    {isPromoActive && (
                      <div className="absolute top-0 left-0 bg-[#e1251b] text-white px-2.5 py-1 rounded-br-xl text-[11px] font-[1000] z-20 shadow-sm border-r border-b border-red-700/50">
                        -{discountPercent}%
                      </div>
                    )}

                    {/* Badge Kiri Atas (Status - Akan tergeser ke bawah jika ada promo agar tidak nabrak) */}
                    <div
                      className={`absolute ${isPromoActive ? "top-8" : "top-2"} left-2 flex flex-col gap-1 z-10 transition-all`}
                    >
                      {isPending ? (
                        <div className="bg-[#FF6600] text-white px-2 py-1 rounded-md text-[8px] font-black tracking-widest shadow-sm flex items-center gap-1">
                          <Clock size={10} /> DITINJAU
                        </div>
                      ) : product.is_active ? (
                        <div className="bg-[#008080] text-white px-2 py-1 rounded-md text-[8px] font-black tracking-widest shadow-sm flex items-center gap-1">
                          <CheckCircle2 size={10} /> AKTIF
                        </div>
                      ) : (
                        <div className="bg-slate-800 text-white px-2 py-1 rounded-md text-[8px] font-black tracking-widest shadow-sm flex items-center gap-1">
                          <ToggleLeft size={10} /> NONAKTIF
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 z-10">
                      {isEmpty ? (
                        <span className="bg-red-600 text-white text-[8px] px-2 py-1 rounded-md shadow-sm animate-pulse border border-red-400 font-black">
                          HABIS!
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-orange-500 text-white text-[8px] px-2 py-1 rounded-md shadow-sm font-black">
                          SISA {product.stock}
                        </span>
                      ) : null}
                    </div>

                    <div
                      className={`absolute inset-0 bg-slate-900/50 flex items-center justify-center gap-3 z-20 transition-opacity ${isPromoMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      {isPromoMode ? (
                        <button
                          onClick={() => {
                            setPromoProduct(product);
                            setNewPrice(
                              product.final_price?.toString() ||
                                product.price?.toString(),
                            );
                          }}
                          className="px-4 py-2 bg-[#FF6600] text-white font-black text-[10px] rounded-xl hover:scale-110 transition-transform shadow-xl border-2 border-white flex items-center gap-2"
                        >
                          <Tag size={16} /> ATUR HARGA PROMO
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setView("form");
                            }}
                            className="p-3 bg-white text-[#008080] rounded-xl hover:scale-110 transition-transform shadow-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={isProcessing === product.id}
                            className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                          >
                            {isProcessing === product.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex items-center gap-1 text-slate-400 text-[8px] tracking-widest font-bold mb-1.5">
                      <Layers size={10} /> {product.categories?.name || "UMUM"}
                    </div>
                    <h4 className="text-slate-800 text-[11px] font-black leading-tight line-clamp-2 mb-2 flex-1 group-hover:text-[#008080] transition-colors">
                      {product.name}
                    </h4>

                    {/* 🚀 TAMPILAN HARGA CORET (STRIKETHROUGH) */}
                    <div className="flex flex-col items-start mt-auto pb-2 border-b-2 border-slate-50 mb-2">
                      {isPromoActive ? (
                        <>
                          <span className="text-red-500 text-[10px] line-through font-bold mb-0.5">
                            RP {product.price?.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[#FF6600] font-black text-[14px] md:text-[16px] leading-none tracking-tighter">
                            RP {product.final_price?.toLocaleString("id-ID")}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#008080] font-black text-[14px] md:text-[16px] leading-none tracking-tighter mt-auto">
                          RP {product.price?.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>

                    {!isPromoMode && (
                      <button
                        disabled={isPending || isProcessing === product.id}
                        onClick={() => toggleProductStatus(product)}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-md font-black text-[9px] transition-all border ${product.is_active ? "bg-teal-50 border-teal-200 text-[#008080] hover:bg-teal-100" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"} disabled:opacity-50`}
                      >
                        {isProcessing === product.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : product.is_active ? (
                          <ToggleRight size={14} />
                        ) : (
                          <ToggleLeft size={14} />
                        )}{" "}
                        {product.is_active ? "ETALASE: ON" : "ETALASE: OFF"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 🚀 MODAL POPUP EDIT HARGA KILAT */}
        {promoProduct && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative">
              <button
                onClick={() => setPromoProduct(null)}
                className="absolute top-4 right-4 p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                  <Tag size={24} />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-800">
                    ATUR HARGA DISKON
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 normal-case">
                    Harga baru langsung tayang!
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[12px] font-black text-slate-800 truncate mb-1">
                  {promoProduct.name}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Harga Normal:
                  </span>
                  <span className="text-[11px] text-slate-400 font-black line-through decoration-red-500">
                    Rp {promoProduct.price?.toLocaleString()}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[14px]">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-4 pl-12 pr-4 font-black text-2xl text-[#FF6600] outline-none focus:border-orange-500 transition-colors"
                    placeholder="Ketik Harga Promo..."
                    autoFocus
                  />
                </div>
                <p className="text-[9px] text-orange-500 mt-2 font-bold italic normal-case">
                  *Kosongkan isi kotak ini atau samakan dengan harga asli jika
                  Anda ingin mencabut promo.
                </p>
              </div>

              <button
                onClick={handleSavePromoPrice}
                disabled={isProcessing === "promo_save"}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-[12px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isProcessing === "promo_save" ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} /> PASANG PROMO SEKARANG
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ProductForm
      onBack={() => {
        setView("list");
        fetchData();
      }}
      categories={categories}
      merchantData={merchantProfile}
      onSuccess={() => {
        setView("list");
        fetchData();
      }}
      showToast={showToast}
      initialData={selectedProduct}
    />
  );
};

const TabButton = ({ label, count, isActive, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 md:py-3.5 rounded-lg text-[10px] font-black transition-all border-2 ${isActive ? `${color} text-white border-transparent shadow-md` : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-slate-700"}`}
  >
    {label}
    {count !== undefined && (
      <span
        className={`px-2 py-0.5 rounded-md text-[9px] leading-none ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

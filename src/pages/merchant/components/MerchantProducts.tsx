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
} from "lucide-react";

interface Props {
  autoOpenTrigger?: number;
  merchantProfile: any;
}

export const MerchantProducts: React.FC<Props> = ({
  autoOpenTrigger = 0,
  merchantProfile,
}) => {
  const { user } = useAuth() as any;
  const { showToast } = useToast();

  const [view, setView] = useState<"list" | "form">("list");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 🚀 STATE BARU UNTUK FILTER & LOADING AKSI
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (autoOpenTrigger > 0) {
      setSelectedProduct(null);
      setView("form");
    } else {
      setView("list");
    }
  }, [autoOpenTrigger]);

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

    // 🔌 KABEL REAL-TIME: Otomatis sinkronisasi kalau ada perubahan stok / harga
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
        () => fetchData(true), // Silent refresh
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

  // 🚀 FUNGSI QUICK TOGGLE (ON/OFF)
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

  // 🚀 LOGIKA FILTERING
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

  // MENGHITUNG ANGKA BADGE
  const counts = {
    ALL: products.length,
    ACTIVE: products.filter((p) => p.is_verified && p.is_active).length,
    PENDING: products.filter((p) => !p.is_verified).length,
    EMPTY: products.filter((p) => p.stock <= 0).length,
  };

  if (view === "list") {
    return (
      <div className="w-full animate-in fade-in duration-500 pb-24 text-left font-sans font-black uppercase tracking-tighter">
        {/* 🟢 HEADER GAHAR */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-8 border-[#008080] mb-6">
          <div>
            <h2 className="text-2xl text-slate-900 leading-none flex items-center gap-2">
              <Package className="text-[#008080]" size={24} /> KATALOG PRODUK
            </h2>
            <p className="text-[10px] text-slate-400 tracking-widest mt-1">
              MENGELOLA {products.length} ITEM DI ETALASE ANDA
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="bg-slate-900 hover:bg-[#008080] text-white px-6 py-3.5 rounded-xl font-black text-[11px] uppercase shadow-md transition-all flex items-center justify-center gap-2 tracking-widest active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> TAMBAH PRODUK BARU
          </button>
        </div>

        {/* 🔍 SEARCH & TAB FILTERS */}
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
              className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-3.5 text-[11px] font-black outline-none focus:ring-2 ring-[#008080] transition-all placeholder:text-slate-300"
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
              label="STOK HABIS"
              count={counts.EMPTY}
              isActive={activeFilter === "EMPTY"}
              onClick={() => setActiveFilter("EMPTY")}
              color="bg-red-600"
            />
          </div>
        </div>

        {/* 📦 PRODUCT GRID */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 bg-white rounded-xl border-2 border-slate-100">
            <Loader2 className="animate-spin text-[#008080]" size={40} />
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              SINKRONISASI ETALASE...
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            <AlertCircle className="text-slate-300 mb-4" size={48} />
            <p className="text-[12px] font-black text-slate-400 tracking-widest">
              BELUM ADA BARANG DI KATEGORI INI
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product: any) => {
              const isEmpty = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;
              const isPending = !product.is_verified;

              return (
                <div
                  key={product.id}
                  className="bg-white border-2 border-slate-100 rounded-xl overflow-hidden hover:border-[#008080] shadow-sm hover:shadow-md transition-all flex flex-col group relative"
                >
                  {/* GAMBAR & BADGE PRO */}
                  <div className="aspect-square relative bg-slate-50 border-b-2 border-slate-100 shrink-0 overflow-hidden">
                    <img
                      src={product.image_url || "/placeholder-product.png"}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!product.is_active || isEmpty || isPending ? "grayscale opacity-60" : ""}`}
                    />

                    {/* Badge Kiri Atas (Status) */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
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

                    {/* Badge Kanan Atas (Alarm Stok) */}
                    <div className="absolute top-2 right-2 z-10">
                      {isEmpty ? (
                        <span className="bg-red-600 text-white text-[8px] px-2 py-1 rounded-md shadow-sm animate-pulse border border-red-400">
                          HABIS!
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-orange-500 text-white text-[8px] px-2 py-1 rounded-md shadow-sm">
                          SISA {product.stock}
                        </span>
                      ) : null}
                    </div>

                    {/* Overlay Action (Edit/Delete) Tampil saat di Hover (Desktop) */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView("form");
                        }}
                        className="p-3 bg-white text-[#008080] rounded-xl hover:scale-110 transition-transform shadow-lg"
                        title="Edit Produk"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={isProcessing === product.id}
                        className="p-3 bg-red-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg disabled:opacity-50"
                        title="Hapus Produk"
                      >
                        {isProcessing === product.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* INFO PRODUK */}
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex items-center gap-1 text-slate-400 text-[8px] tracking-widest mb-1.5">
                      <Layers size={10} /> {product.categories?.name || "UMUM"}
                    </div>
                    <h4 className="text-slate-800 text-[11px] leading-tight line-clamp-2 mb-2 flex-1 group-hover:text-[#008080] transition-colors">
                      {product.name}
                    </h4>

                    <div className="flex justify-between items-end mt-auto pb-2 border-b-2 border-slate-50 mb-2">
                      <p className="text-[#FF6600] text-[14px] leading-none tracking-tighter">
                        RP{" "}
                        {product.final_price?.toLocaleString("id-ID") ||
                          product.price?.toLocaleString("id-ID")}
                      </p>
                      <div
                        className={`flex items-center gap-1 text-[9px] ${isEmpty ? "text-red-500" : "text-slate-400"}`}
                      >
                        <Archive size={10} /> STOK: {product.stock}
                      </div>
                    </div>

                    {/* 🚀 SAKLAR ON/OFF CEPAT */}
                    <button
                      disabled={isPending || isProcessing === product.id}
                      onClick={() => toggleProductStatus(product)}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-md text-[9px] transition-all border ${
                        product.is_active
                          ? "bg-teal-50 border-teal-200 text-[#008080] hover:bg-teal-100"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                      } disabled:opacity-50`}
                    >
                      {isProcessing === product.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : product.is_active ? (
                        <ToggleRight size={14} />
                      ) : (
                        <ToggleLeft size={14} />
                      )}
                      {product.is_active ? "ETALASE: ON" : "ETALASE: OFF"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FLOATING ACTION BUTTON (MOBILE ONLY) */}
        <button
          onClick={() => {
            setSelectedProduct(null);
            setView("form");
          }}
          className="md:hidden fixed bottom-28 right-6 w-14 h-14 bg-[#008080] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-50 border-4 border-white"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
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

// --- SUB-COMPONENTS ---
const TabButton = ({ label, count, isActive, onClick, color }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg text-[10px] font-black transition-all border-2 ${
      isActive
        ? `${color} text-white border-transparent shadow-md`
        : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:text-slate-700"
    }`}
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

export default MerchantProducts;

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (autoOpenTrigger > 0) {
      setSelectedProduct(null);
      setView("form");
    } else {
      setView("list");
    }
  }, [autoOpenTrigger]);

  const fetchData = async () => {
    if (!user || !merchantProfile?.id) return;
    setLoading(true);
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
  };

  useEffect(() => {
    fetchData();
  }, [user, merchantProfile]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("HAPUS PRODUK INI DARI KATALOG?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      showToast("PRODUK BERHASIL DIHAPUS", "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (view === "list") {
    return (
      <div className="w-full animate-in fade-in duration-500 pb-24 text-left font-sans font-normal">
        {/* HEADER UTAMA - BOLD HANYA JUDUL */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-1">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tighter leading-none uppercase">
              Katalog Produk
            </h2>
            <p className="text-[10px] font-normal text-slate-400 tracking-[0.2em] mt-2 uppercase">
              Mengelola {products.length} item di etalase Anda
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="hidden md:flex bg-[#008080] text-white px-6 py-3.5 rounded-xl font-bold text-[12px] uppercase shadow-md hover:bg-teal-700 transition-all gap-2 tracking-widest active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Tambah Produk
          </button>
        </div>

        {/* SEARCH BAR CLEAN */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 mb-6 flex items-center gap-3 shadow-sm focus-within:border-[#008080] transition-colors mx-1">
          <div className="pl-4 text-slate-300">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="CARI NAMA BARANG ANDA..."
            className="flex-1 bg-transparent border-none outline-none py-3 text-[12px] font-normal text-slate-800 placeholder:text-slate-300 uppercase tracking-widest"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#008080]" size={36} />
            <span className="text-[10px] uppercase tracking-widest">
              Sinkronisasi Etalase...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 px-1">
            {products
              .filter((p: any) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((product: any) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#008080] hover:shadow-lg hover:shadow-teal-900/5 transition-all group relative flex flex-col"
                >
                  {/* BADGE STATUS PRO */}
                  <div className="absolute top-2 left-2 z-20">
                    {product.is_verified ? (
                      <div className="bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={10} /> Aktif
                      </div>
                    ) : (
                      <div className="bg-[#FF6600] text-white px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                        <Clock size={10} /> Ditinjau
                      </div>
                    )}
                  </div>

                  {/* AREA GAMBAR */}
                  <div className="aspect-square relative bg-slate-50 border-b border-slate-100 shrink-0 overflow-hidden">
                    <img
                      src={product.image_url}
                      className={`w-full h-full object-cover transition-transform duration-500 ${!product.is_verified ? "opacity-40 grayscale" : "group-hover:scale-110"}`}
                      alt={product.name}
                    />

                    {/* OVERLAY ACTION */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView("form");
                        }}
                        className="p-2 bg-white text-[#008080] shadow-md rounded-lg hover:bg-[#008080] hover:text-white transition-all active:scale-90"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-white text-red-500 shadow-md rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* DETAIL KARTU - FONT 12PX CLEAN */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <div className="flex items-center gap-1 text-slate-400 text-[8px] uppercase tracking-widest mb-1.5 font-normal">
                      <Layers size={10} /> {product.categories?.name || "UMUM"}
                    </div>

                    <h4 className="text-slate-700 text-[12px] font-normal uppercase line-clamp-2 leading-tight mb-2 min-h-[2rem]">
                      {product.name}
                    </h4>

                    <div className="mt-auto pt-2 border-t border-slate-50 flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <p className="text-[#FF6600] font-bold text-[14px] leading-none uppercase tracking-tight">
                          RP {product.final_price?.toLocaleString("id-ID")}
                        </p>
                        <div className="flex items-center gap-1 text-slate-400 text-[9px] font-normal uppercase">
                          <Archive size={10} /> {product.stock}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* KATALOG KOSONG */}
            {!loading && products.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-300 opacity-50">
                <Package size={64} strokeWidth={1} />
                <p className="text-[12px] font-normal tracking-[0.3em] mt-4 uppercase">
                  Belum ada produk terdaftar
                </p>
              </div>
            )}
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

export default MerchantProducts;

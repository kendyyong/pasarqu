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
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react";

// 🚀 BAGIAN INI YANG MEMPERBAIKI ERROR 2322
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

  // LOGIKA ANTI-MENTAL: Hanya buka form jika counter bertambah
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

      const { data: prodData } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("merchant_id", merchantProfile.id)
        .order("created_at", { ascending: false });
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
    if (!window.confirm("HAPUS PRODUK INI?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      showToast("PRODUK DIHAPUS", "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (view === "list") {
    return (
      <div className="w-full animate-in fade-in duration-500 pb-24 text-left font-bold uppercase text-[12px]">
        {/* HEADER KATALOG */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-1">
          <div>
            <h2 className="text-[18px] md:text-[20px] font-bold text-slate-800 tracking-tight leading-none uppercase">
              KATALOG PRODUK
            </h2>
            <p className="text-[10px] font-bold text-orange-500 tracking-[0.2em] mt-2 uppercase">
              TOTAL: {products.length} ITEM TERDAFTAR
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="hidden md:flex bg-[#008080] text-white px-6 py-4 rounded-xl font-bold text-[12px] uppercase shadow-lg hover:bg-teal-700 transition-all gap-2"
          >
            <Plus size={18} strokeWidth={3} /> TAMBAH PRODUK BARU
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 mb-6 flex items-center gap-3 shadow-sm focus-within:border-[#008080] transition-colors mx-1">
          <div className="pl-3 text-[#008080]">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="CARI NAMA BARANG..."
            className="flex-1 bg-transparent border-none outline-none py-3.5 text-[12px] font-bold text-slate-800 placeholder:text-slate-300 uppercase tracking-widest"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* GRID PRODUK */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#008080]" size={36} />
            <span className="text-[10px] font-bold uppercase">
              MENYIAPKAN KATALOG...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 px-1">
            {products
              .filter((p: any) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((product: any) => (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#008080] transition-all group relative flex flex-col shadow-sm"
                >
                  <div className="absolute top-2 left-2 z-20">
                    {product.is_verified ? (
                      <div className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-[8px] font-bold uppercase">
                        AKTIF
                      </div>
                    ) : (
                      <div className="bg-orange-500 text-white px-2 py-1 rounded-lg text-[8px] font-bold animate-pulse uppercase">
                        DITINJAU
                      </div>
                    )}
                  </div>
                  <div className="aspect-square relative bg-slate-50 border-b border-slate-100 shrink-0 overflow-hidden">
                    <img
                      src={product.image_url}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt=""
                    />
                    {!product.is_verified && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 text-center">
                        <p className="text-white text-[8px] font-bold uppercase">
                          VERIFIKASI ADMIN
                        </p>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView("form");
                        }}
                        className="p-2 bg-white shadow-md rounded-lg text-slate-800 hover:bg-[#008080] hover:text-white active:scale-90 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-red-500 text-white shadow-md rounded-lg hover:bg-red-600 active:scale-90 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase line-clamp-2 leading-tight mb-2 uppercase">
                      {product.name}
                    </h4>
                    <p className="text-[#FF6600] font-bold text-[15px] leading-none uppercase">
                      RP {product.final_price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

            {!loading && products.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 opacity-50 uppercase">
                <Package size={60} strokeWidth={1} />
                <p className="text-[10px] font-bold tracking-[0.3em] mt-4 uppercase">
                  KATALOG KOSONG
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // TAMPILAN FORM REGISTRASI
  return (
    <ProductForm
      onBack={() => setView("list")}
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

import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { ProductForm } from "./ProductForm"; // Import komponen Form yang baru dibuat
import { Loader2, Plus, Search, Edit2, Trash2 } from "lucide-react";

interface Props {
  autoOpenForm?: boolean;
}

export const MerchantProducts: React.FC<Props> = ({ autoOpenForm = false }) => {
  const { user } = useAuth() as any;
  const { showToast } = useToast();
  const [view, setView] = useState<"list" | "form">(
    autoOpenForm ? "form" : "list",
  );
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [merchantData, setMerchantData] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: mData } = await supabase
        .from("merchants")
        .select("id, market_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mData) setMerchantData(mData);

      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (catData) setCategories(catData);

      if (mData?.id) {
        const { data: prodData } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("merchant_id", mData.id)
          .order("created_at", { ascending: false });

        if (prodData) setProducts(prodData);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

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
      <div className="w-full animate-in fade-in duration-500 pb-20 text-left font-black uppercase text-[12px] not-italic">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[16px] font-[1000] text-slate-800 tracking-wider">
              KATALOG PRODUK
            </h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">
              TOTAL: {products.length} BARANG
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedProduct(null);
              setView("form");
            }}
            className="bg-[#008080] text-white px-6 py-4 rounded-md font-black text-[12px] uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2 shadow-md hover:bg-teal-700 transition-all"
          >
            <Plus size={18} /> TAMBAH BARU
          </button>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-md p-2 mb-6 flex items-center gap-3 shadow-sm focus-within:border-[#008080] transition-colors">
          <div className="pl-3 text-[#008080]">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="CARI NAMA BARANG..."
            className="flex-1 bg-transparent border-none outline-none py-3 text-[12px] font-black text-slate-800 placeholder:text-slate-300 uppercase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-[#008080]" size={36} />
            <span className="text-[10px] tracking-widest">MEMUAT DATA...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products
              .filter((p: any) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((product: any) => (
                <div
                  key={product.id}
                  className="bg-white border-2 border-slate-200 rounded-md overflow-hidden hover:border-[#008080] transition-colors group relative flex flex-col"
                >
                  <div className="aspect-square relative bg-slate-50 border-b-2 border-slate-100 shrink-0">
                    <img
                      src={product.image_url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setView("form");
                        }}
                        className="p-2 bg-white/90 rounded-md text-slate-800 shadow-md active:scale-90"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 bg-red-500/90 rounded-md text-white shadow-md active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <h4 className="font-[1000] text-slate-800 text-[11px] uppercase line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[#FF6600] font-sans font-[1000] text-[14px] mt-2 leading-none">
                      RP {product.final_price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  }

  // JIKA SEDANG VIEW FORM, PANGGIL FILE BARU TADI
  return (
    <ProductForm
      onBack={() => setView("list")}
      categories={categories}
      merchantData={merchantData}
      onSuccess={() => {
        setView("list");
        fetchData();
      }}
      showToast={showToast}
      initialData={selectedProduct}
    />
  );
};

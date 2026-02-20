import React, { useState, useEffect } from "react";
import {
  Loader2,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  Tag,
  X,
  Check,
  Percent,
  FileText,
} from "lucide-react";
import { useMerchantProducts } from "../../../hooks/useMerchantProducts";
import { ProductForm } from "./ProductForm";
import { supabase } from "../../../lib/supabaseClient";

interface MerchantProductsProps {
  merchantProfile: any;
  autoOpenForm?: boolean;
}

export const MerchantProducts: React.FC<MerchantProductsProps> = ({
  merchantProfile,
  autoOpenForm,
}) => {
  const { products, loading, categories, fetchProducts, showToast, user } =
    useMerchantProducts();
  const [isAdding, setIsAdding] = useState(autoOpenForm || false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [newPromoPrice, setNewPromoPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (autoOpenForm) setIsAdding(true);
  }, [autoOpenForm]);

  const handleUpdateDiscount = async () => {
    if (!editingDiscount) return;
    const normalPrice = editingDiscount.price;
    const promoPrice = newPromoPrice ? parseInt(newPromoPrice) : null;

    if (promoPrice !== null && promoPrice >= normalPrice) {
      showToast("Harga promo harus lebih murah!", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          promo_price: promoPrice,
          final_price: promoPrice || normalPrice,
        })
        .eq("id", editingDiscount.id);

      if (error) throw error;
      showToast("Diskon berhasil diperbarui!", "success");
      setEditingDiscount(null);
      setNewPromoPrice("");
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || "Gagal memperbarui diskon", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isAdding || editingProduct) {
    return (
      <ProductForm
        onBack={() => {
          setIsAdding(false);
          setEditingProduct(null);
        }}
        initialData={editingProduct}
        categories={categories}
        user={user}
        showToast={showToast}
        onSuccess={() => {
          setIsAdding(false);
          setEditingProduct(null);
          fetchProducts();
        }}
      />
    );
  }

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 text-left">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic text-teal-600">
            Etalase Toko
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Total {products.length} Produk Terdaftar
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-teal-600 transition-all shadow-xl active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Tambah Baru
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative group">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600"
          size={20}
        />
        <input
          type="text"
          placeholder="Cari produk Anda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold outline-none focus:border-teal-600 shadow-sm transition-all"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin text-teal-600 mx-auto" size={40} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem]">
          <p className="text-slate-400 font-black uppercase text-[11px] tracking-widest text-center">
            Belum ada barang di gudang
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p: any) => (
            <ProductMerchantCard
              key={p.id}
              product={p}
              onEdit={() => setEditingProduct(p)}
              onEditDiscount={(prod) => {
                setEditingDiscount(prod);
                setNewPromoPrice(prod.promo_price?.toString() || "");
              }}
            />
          ))}
        </div>
      )}

      {/* MODAL DISKON */}
      {editingDiscount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 border-t-[12px] border-orange-600 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-black text-slate-800 uppercase italic tracking-tighter text-xl">
                Setting Diskon
              </h2>
              <button
                onClick={() => setEditingDiscount(null)}
                className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5">
              <input
                type="number"
                autoFocus
                className="w-full px-6 py-5 bg-orange-50 border border-orange-100 rounded-2xl outline-none focus:border-orange-600 font-black text-orange-900"
                placeholder="Harga Promo Baru..."
                value={newPromoPrice}
                onChange={(e) => setNewPromoPrice(e.target.value)}
              />
              <button
                onClick={handleUpdateDiscount}
                disabled={isUpdating}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                {isUpdating ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Check size={20} strokeWidth={4} />
                )}
                Terapkan Diskon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CARD DENGAN INFO KETERANGAN ---
const ProductMerchantCard = ({
  product,
  onEdit,
  onEditDiscount,
}: {
  product: any;
  onEdit: () => void;
  onEditDiscount: (p: any) => void;
}) => {
  const hasDiscount = product.promo_price && product.promo_price > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500">
      <div className="aspect-video relative overflow-hidden bg-slate-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          <span
            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg text-white ${product.status === "APPROVED" ? "bg-teal-600" : "bg-orange-600"}`}
          >
            {product.status === "APPROVED" ? "Aktif" : "Verifikasi"}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] font-black text-slate-400 uppercase">
            {product.categories?.name || "UMUM"}
          </p>
          <div className="text-right">
            <p
              className={`text-sm font-black italic ${hasDiscount ? "text-orange-600" : "text-slate-800"}`}
            >
              Rp{" "}
              {product.final_price?.toLocaleString() ||
                product.price?.toLocaleString()}
            </p>
          </div>
        </div>

        <h3 className="text-base font-black text-slate-800 uppercase leading-none mb-2 line-clamp-1">
          {product.name}
        </h3>

        {/* INFO KETERANGAN / DESKRIPSI (BARU) */}
        <div className="bg-slate-50/50 p-3 rounded-xl mb-6 border border-slate-100">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText size={10} className="text-slate-400" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
              Keterangan Barang:
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic">
            {product.description || "Tidak ada deskripsi."}
          </p>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Tersedia
            </span>
            <span className="text-sm font-black text-slate-800">
              {product.stock} {product.unit}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onEditDiscount(product)}
              className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-md active:scale-90"
              title="Atur Diskon"
            >
              <Tag size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={onEdit}
              className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all shadow-md active:scale-90"
              title="Edit Produk"
            >
              <Edit3 size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";
import {
  CheckCircle,
  XCircle,
  Store,
  CheckCircle2,
  Loader2,
  Package,
  Tag,
  Info,
  Edit3,
  Percent, // Ikon untuk indikator diskon
} from "lucide-react";

interface Props {
  products: any[];
  onAction: () => void;
}

export const LocalProductsTab: React.FC<Props> = ({ products, onAction }) => {
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // --- FUNGSI EKSEKUSI VERIFIKASI (APPROVE/REJECT) ---
  const handleVerify = async (
    productId: string,
    action: "APPROVED" | "REJECTED",
  ) => {
    setProcessingId(productId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ status: action })
        .eq("id", productId);

      if (error) throw error;

      showToast(
        action === "APPROVED"
          ? "Produk disetujui dan kini tampil di pasar!"
          : "Produk ditolak.",
        action === "APPROVED" ? "success" : "error",
      );

      onAction();
    } catch (err: any) {
      showToast("Gagal memproses: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  // --- FUNGSI QUICK UPDATE (EDIT & LANGSUNG APPROVE) ---
  const handleQuickUpdate = async () => {
    if (!editingProduct) return;
    setProcessingId(editingProduct.id);
    try {
      // Pastikan final_price juga ikut terupdate jika harga normal diubah
      const newFinalPrice =
        editingProduct.discount_type === "none"
          ? editingProduct.price
          : editingProduct.final_price;

      const { error } = await supabase
        .from("products")
        .update({
          name: editingProduct.name,
          price: editingProduct.price,
          final_price: newFinalPrice,
          status: "APPROVED",
        })
        .eq("id", editingProduct.id);

      if (error) throw error;

      showToast("Produk diperbarui dan disetujui!", "success");
      setEditingProduct(null);
      onAction();
    } catch (err: any) {
      showToast("Gagal memperbarui: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-teal-600 animate-bounce" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
          Semua Beres!
        </h3>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
          Tidak ada produk yang menunggu antrean verifikasi saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex items-center gap-3 mb-6 ml-2 text-left">
        <Info size={16} className="text-orange-500" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Ditemukan{" "}
          <span className="text-orange-600">{products.length} produk</span>{" "}
          perlu validasi manual
        </p>
      </div>

      {products.map((product) => {
        // Logika tampilan harga untuk Admin
        const hasDiscount =
          product.discount_type && product.discount_type !== "none";
        const hasPromo =
          product.promo_price && product.promo_price < product.price;
        const isSale = hasDiscount || hasPromo;
        const finalPriceDisplay = hasDiscount
          ? product.final_price
          : hasPromo
            ? product.promo_price
            : product.price;

        return (
          <div
            key={product.id}
            className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center hover:shadow-xl hover:border-teal-100 transition-all group relative overflow-hidden"
          >
            {/* FOTO PRODUK */}
            <div className="relative shrink-0">
              <img
                src={product.image_url || "https://via.placeholder.com/200"}
                className="w-32 h-32 rounded-[2rem] object-cover bg-slate-50 shadow-inner border border-slate-50 group-hover:scale-105 transition-transform"
                alt="Product"
              />
              {isSale && (
                <div className="absolute -top-2 -left-2 bg-red-600 text-white p-2 rounded-xl shadow-lg animate-pulse">
                  <Percent size={12} strokeWidth={4} />
                </div>
              )}
            </div>

            {/* DETAIL PRODUK */}
            <div className="flex-1 text-left w-full">
              <div className="flex items-center gap-2 mb-2">
                <Store size={14} className="text-teal-600" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {product.merchants?.shop_name || "Merchant Pasarqu"}
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">
                {product.name}
              </h3>

              <div className="flex flex-col mb-4">
                {isSale && (
                  <span className="text-[10px] font-bold text-slate-400 line-through mb-[-4px]">
                    Rp {product.price.toLocaleString()}
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-black tracking-tighter ${isSale ? "text-red-600" : "text-teal-600"}`}
                  >
                    Rp {finalPriceDisplay?.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    / {product.unit || "Pcs"}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                  "{product.description || "Tidak ada deskripsi produk..."}"
                </p>
              </div>
            </div>

            {/* TOMBOL AKSI */}
            <div className="flex md:flex-col gap-3 w-full md:w-48 shrink-0">
              <button
                disabled={processingId === product.id}
                onClick={() => handleVerify(product.id, "APPROVED")}
                className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:bg-slate-300"
              >
                {processingId === product.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <CheckCircle size={18} /> Setujui
                  </>
                )}
              </button>

              <button
                onClick={() => setEditingProduct(product)}
                className="flex-1 px-6 py-4 bg-teal-50 text-teal-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-100 transition-all flex items-center justify-center gap-3 active:scale-95 border border-teal-100"
              >
                <Edit3 size={18} /> Koreksi
              </button>

              <button
                disabled={processingId === product.id}
                onClick={() => handleVerify(product.id, "REJECTED")}
                className="flex-1 px-6 py-4 bg-white text-red-500 border-2 border-red-50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <XCircle size={18} /> Tolak
              </button>
            </div>
          </div>
        );
      })}

      {/* MODAL QUICK EDIT */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEditingProduct(null)}
          ></div>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative z-10 shadow-2xl border border-white/20 text-left">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8 italic">
              Koreksi <span className="text-teal-600">Admin</span>
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-2 ring-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                  Harga Pokok (Rp)
                </label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-2 ring-teal-500 transition-all"
                />
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  disabled={processingId === editingProduct.id}
                  onClick={handleQuickUpdate}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {processingId === editingProduct.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Simpan & Approve"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

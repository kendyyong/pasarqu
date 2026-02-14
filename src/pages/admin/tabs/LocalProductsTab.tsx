import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useToast } from "../../../contexts/ToastContext";
import {
  CheckCircle,
  XCircle,
  Store,
  CheckCircle2,
  Loader2,
  Package,
  Tag,
  Info,
} from "lucide-react";

interface Props {
  products: any[];
  onAction: () => void; // Fungsi untuk refresh data di dashboard utama
}

export const LocalProductsTab: React.FC<Props> = ({ products, onAction }) => {
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- FUNGSI EKSEKUSI VERIFIKASI ---
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

      // Panggil fungsi refresh dari parent (LocalAdminDashboard)
      onAction();
    } catch (err: any) {
      showToast("Gagal memproses: " + err.message, "error");
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
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6 ml-2">
        <Info size={16} className="text-orange-500" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Ditemukan{" "}
          <span className="text-orange-600">{products.length} produk</span>{" "}
          perlu validasi manual
        </p>
      </div>

      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-center hover:shadow-xl hover:border-teal-100 transition-all group"
        >
          {/* FOTO PRODUK */}
          <div className="relative shrink-0">
            <img
              src={product.image_url || "https://via.placeholder.com/200"}
              className="w-32 h-32 rounded-[2rem] object-cover bg-slate-50 shadow-inner border border-slate-50 group-hover:scale-105 transition-transform"
              alt="Product"
            />
            <div className="absolute -bottom-2 -right-2 bg-white shadow-lg p-2 rounded-xl border border-slate-50">
              <Tag size={14} className="text-teal-600" />
            </div>
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

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-black text-teal-600 tracking-tighter">
                Rp {product.price.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                / {product.unit || "Pcs"}
              </span>
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
              disabled={processingId === product.id}
              onClick={() => handleVerify(product.id, "REJECTED")}
              className="flex-1 px-6 py-4 bg-white text-red-500 border-2 border-red-50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 hover:border-red-100 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <XCircle size={18} /> Tolak
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

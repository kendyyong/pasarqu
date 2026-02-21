import React, { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { useToast } from "../../../../contexts/ToastContext";
import {
  CheckCircle,
  XCircle,
  Store,
  Loader2,
  Package,
  Tag,
  Info,
  Edit3,
  Percent,
  Search,
  AlertCircle,
} from "lucide-react";

interface Props {
  products: any[];
  onAction: () => void;
}

export const LocalProductsTab: React.FC<Props> = ({ products, onAction }) => {
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.merchants?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        action === "APPROVED" ? "PRODUK VALID!" : "PRODUK DITOLAK!",
        action === "APPROVED" ? "success" : "error",
      );
      onAction();
    } catch (err: any) {
      showToast("GAGAL: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleQuickUpdate = async () => {
    if (!editingProduct) return;
    setProcessingId(editingProduct.id);
    try {
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
      showToast("PRODUK DIUPDATE & DISETUJUI!", "success");
      setEditingProduct(null);
      onAction();
    } catch (err: any) {
      showToast("GAGAL: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl p-20 text-center border-2 border-dashed border-slate-200 animate-in fade-in duration-700">
        <Package size={48} className="text-slate-200 mx-auto mb-4" />
        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">
          ANTREAN BERSIH / TIDAK ADA PRODUK BARU
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 font-black uppercase tracking-tighter text-left pb-20">
      {/* 🛠️ HEADER TOOLBAR */}
      <div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-[#008080] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white shadow-lg">
            <Package size={20} />
          </div>
          <div>
            <h2 className="text-white text-[12px] leading-none text-left">
              VALIDASI PRODUK MASUK
            </h2>
            <p className="text-[#008080] text-[10px] mt-1 tracking-widest text-left">
              TOTAL ANTRIAN: {products.length} UNIT
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={14}
          />
          <input
            type="text"
            placeholder="CARI NAMA PRODUK ATAU TOKO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border-none text-white text-[12px] py-3 pl-10 pr-4 rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]"
          />
        </div>
      </div>

      {/* 📦 DAFTAR PRODUK */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map((product) => {
          const hasDiscount =
            product.discount_type && product.discount_type !== "none";
          const finalPriceDisplay = hasDiscount
            ? product.final_price
            : product.price;

          return (
            <div
              key={product.id}
              className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden flex flex-col md:flex-row transition-all hover:border-[#008080] shadow-sm"
            >
              {/* IMAGE SECTION */}
              <div className="w-full md:w-56 h-56 md:h-auto relative bg-slate-100 border-r-2 border-slate-50 flex items-center justify-center">
                <img
                  src={product.image_url || "https://via.placeholder.com/200"}
                  className="w-full h-full object-cover"
                  alt="Product"
                />
                {hasDiscount && (
                  <div className="absolute top-3 left-3 bg-[#FF6600] text-white px-3 py-1 text-[10px] flex items-center gap-1 font-black shadow-md rounded-md">
                    <Percent size={12} strokeWidth={4} /> PROMO AKTIF
                  </div>
                )}
              </div>

              {/* INFO SECTION */}
              <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 bg-teal-50 w-fit px-3 py-1 rounded-full border border-teal-100">
                    <Store size={14} className="text-[#008080]" />
                    <span className="text-[10px] text-[#008080] tracking-widest font-black uppercase">
                      MITRA:{" "}
                      {product.merchants?.shop_name || "PROFIL TOKO TIDAK ADA"}
                    </span>
                  </div>
                  <h3 className="text-[18px] text-slate-900 leading-none mb-4 uppercase">
                    {product.name}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg">
                      <p className="text-[10px] text-slate-400 mb-1 uppercase">
                        HARGA SATUAN
                      </p>
                      <p
                        className={`text-[14px] font-black ${hasDiscount ? "text-[#FF6600]" : "text-slate-900"}`}
                      >
                        RP {finalPriceDisplay?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg">
                      <p className="text-[10px] text-slate-400 mb-1 uppercase">
                        SATUAN BERAT
                      </p>
                      <p className="text-[14px] text-slate-900 font-black">
                        {product.unit || "PCS"}
                      </p>
                    </div>
                    <div className="bg-[#008080]/10 p-3 border border-[#008080]/20 hidden md:block rounded-lg">
                      <p className="text-[10px] text-[#008080] mb-1 uppercase">
                        KOMISI
                      </p>
                      <p className="text-[14px] text-[#008080] font-black uppercase">
                        {product.service_fee_percent || 0}% SISTEM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-start gap-3">
                  <Info size={16} className="text-[#008080] shrink-0 mt-0.5" />
                  <p className="text-[12px] normal-case leading-snug text-slate-600 font-bold uppercase">
                    {product.description ||
                      "DESKRIPSI PRODUK BELUM DIISI OLEH MITRA TOKO."}
                  </p>
                </div>
              </div>

              {/* ACTION BAR */}
              <div className="w-full md:w-64 p-5 bg-slate-50 border-t-2 md:border-t-0 md:border-l-2 border-slate-100 flex flex-col gap-3 justify-center">
                <button
                  disabled={processingId === product.id}
                  onClick={() => handleVerify(product.id, "APPROVED")}
                  className="w-full py-4 bg-[#008080] text-white rounded-lg font-black text-[12px] tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:bg-slate-300 uppercase"
                >
                  {processingId === product.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  SETUJUI PRODUK
                </button>

                <button
                  onClick={() => setEditingProduct(product)}
                  className="w-full py-4 bg-white text-[#008080] border-2 border-[#008080] rounded-lg font-black text-[12px] tracking-widest hover:bg-teal-50 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase"
                >
                  <Edit3 size={18} /> KOREKSI DATA
                </button>

                <button
                  disabled={processingId === product.id}
                  onClick={() => handleVerify(product.id, "REJECTED")}
                  className="w-full py-4 bg-white text-[#FF6600] border-2 border-[#FF6600] rounded-lg font-black text-[12px] tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase"
                >
                  <XCircle size={18} /> TOLAK PRODUK
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚨 AUDIT ALERT FOOTER */}
      <div className="p-4 bg-[#FF6600] text-white rounded-xl flex items-center gap-4 shadow-lg">
        <AlertCircle size={24} className="shrink-0 animate-pulse" />
        <p className="text-[12px] leading-tight font-black uppercase">
          PERHATIAN: PERIKSA KEMBALI KESESUAIAN FOTO DAN HARGA. KESALAHAN
          VALIDASI DAPAT MENGGANGGU STABILITAS HARGA PASAR.
        </p>
      </div>

      {/* MODAL KOREKSI - TANPA ITALIC */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
            onClick={() => setEditingProduct(null)}
          ></div>
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative z-10 border-t-8 border-[#FF6600] overflow-hidden">
            <div className="p-6 bg-slate-50 border-b-2 border-slate-100">
              {/* DI SINI ITALIC SUDAH DIHAPUS */}
              <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest text-left">
                KOREKSI DATA PRODUK
              </h3>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                  NAMA ITEM
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
                  className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg p-4 text-[12px] font-black outline-none focus:border-[#008080] transition-all uppercase"
                />
              </div>
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">
                  HARGA JUAL (RP)
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
                  className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg p-4 text-[12px] font-black outline-none focus:border-[#008080] transition-all"
                />
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-lg text-[12px] font-black uppercase tracking-widest hover:bg-slate-300"
                >
                  BATAL
                </button>
                <button
                  disabled={processingId === editingProduct.id}
                  onClick={handleQuickUpdate}
                  className="flex-[2] py-4 bg-slate-900 text-white rounded-lg text-[12px] font-black uppercase tracking-widest hover:bg-[#008080] shadow-xl flex items-center justify-center gap-2"
                >
                  {processingId === editingProduct.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "SIMPAN & SETUJUI"
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

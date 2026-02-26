import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../contexts/ToastContext";
// 🚀 FIX: Jalur Import diperbaiki menjadi mundur 1 langkah (../)
import { ProductForm } from "../merchant/components/ProductForm";
import {
  CheckCircle,
  XCircle,
  Search,
  Package,
  Store,
  Loader2,
  Edit3,
  Scale,
  Clock,
  AlertTriangle,
  Tag,
  Box,
} from "lucide-react";

interface Props {
  products: any[];
  onAction: () => void;
}

export const AdminProductVerification: React.FC<Props> = ({
  products,
  onAction,
}) => {
  const { showToast } = useToast();

  // STATE UI
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // STATE MODAL PENOLAKAN
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [productToReject, setProductToReject] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState(
    "Foto produk buram atau tidak sesuai.",
  );
  const [customReason, setCustomReason] = useState("");

  const presetReasons = [
    "Foto produk buram atau tidak sesuai.",
    "Harga terindikasi tidak wajar / salah ketik.",
    "Berat barang (Gram) tidak masuk akal.",
    "Deskripsi tidak lengkap atau melanggar aturan.",
    "Lainnya (Tulis manual)",
  ];

  // Ambil Kategori untuk dilempar ke ProductForm jika Admin mau Edit
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from("categories").select("*");
      if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  const handleUpdateStatus = async (
    productId: string,
    newStatus: "APPROVED" | "REJECTED",
    reason?: string,
  ) => {
    setProcessingId(productId);
    try {
      const isVerified = newStatus === "APPROVED";
      const updateData: any = { status: newStatus, is_verified: isVerified };

      if (newStatus === "REJECTED") {
        updateData.rejection_reason = reason || "Ditolak oleh admin.";
      } else {
        updateData.rejection_reason = null;
      }

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (error) throw error;

      showToast(
        `Produk berhasil ${newStatus === "APPROVED" ? "Disetujui & Dirilis" : "Ditolak"}`,
        "success",
      );

      setRejectModalOpen(false);
      setProductToReject(null);
      onAction(); // Refresh data dashboard
    } catch (err: any) {
      showToast("Gagal update: " + err.message, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = () => {
    if (!productToReject) return;
    const finalReason =
      rejectReason === "Lainnya (Tulis manual)" ? customReason : rejectReason;
    if (!finalReason)
      return showToast("Alasan penolakan harus diisi!", "error");

    handleUpdateStatus(productToReject.id, "REJECTED", finalReason);
  };

  // Filter Data
  const filteredData = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.merchants?.shop_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // 🚀 TAMPILAN EDIT LANGSUNG (MEMANGGIL PRODUCT FORM)
  if (viewMode === "edit" && selectedProduct) {
    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <div className="mb-4 bg-teal-50 border border-teal-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-[#008080] shrink-0" size={20} />
          <div>
            <h3 className="font-black text-[#008080] text-[12px] uppercase tracking-widest">
              Mode Koreksi Admin
            </h3>
            <p className="text-[10px] text-teal-800 font-bold mt-1 leading-relaxed">
              Anda sedang mengedit produk milik{" "}
              <span className="uppercase text-[#FF6600]">
                "{selectedProduct.merchants?.shop_name}"
              </span>
              . Perbaiki kesalahan *typo*, kategori, atau berat barang, lalu
              Simpan. Produk akan otomatis terpublikasi.
            </p>
          </div>
        </div>

        <ProductForm
          initialData={selectedProduct}
          categories={categories}
          merchantData={{
            id: selectedProduct.merchant_id,
            managed_market_id: selectedProduct.market_id,
            market_id: selectedProduct.market_id,
          }}
          onBack={() => {
            setViewMode("list");
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setViewMode("list");
            setSelectedProduct(null);
            onAction();
          }}
          showToast={showToast}
        />
      </div>
    );
  }

  // 🚀 TAMPILAN UTAMA (LIST VERIFIKASI)
  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 bg-orange-100 text-[#FF6600] flex items-center justify-center rounded-xl border border-orange-200">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-[15px] font-black uppercase tracking-tight leading-none">
              Antrean Verifikasi
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
              {filteredData.length} Produk Menunggu
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008080]"
            size={18}
          />
          <input
            type="text"
            placeholder="CARI BARANG ATAU TOKO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-[#008080] focus:bg-white transition-all placeholder:text-slate-400 shadow-inner"
          />
        </div>
      </div>

      {/* GRID PRODUK PRO */}
      {filteredData.length === 0 ? (
        <div className="py-24 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
          <div className="w-20 h-20 bg-teal-50 mx-auto flex items-center justify-center text-[#008080] mb-4 rounded-full">
            <CheckCircle size={40} />
          </div>
          <p className="text-[#008080] font-black uppercase text-[12px] tracking-[0.2em]">
            Semua Produk Sudah Tervalidasi
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 hover:border-[#008080] hover:shadow-lg hover:shadow-teal-900/5 transition-all group rounded-2xl flex flex-col overflow-hidden"
            >
              {/* IMAGE AREA WITH PRO BADGES */}
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden border-b border-slate-100">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Status Badges Kiri Atas */}
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
                  <div className="bg-orange-500 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-md">
                    PENDING
                  </div>
                  {p.is_preorder && (
                    <div className="bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                      <Clock size={10} /> PO {p.preorder_days} Hr
                    </div>
                  )}
                  {p.condition === "BEKAS" && (
                    <div className="bg-slate-700 text-white px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-md">
                      BEKAS
                    </div>
                  )}
                </div>

                {/* Promo Badge Kanan Atas */}
                {p.promo_percentage > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                    <Tag size={10} /> -{p.promo_percentage}%
                  </div>
                )}

                {/* Info Toko Bawah */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent">
                  <p className="text-white text-[10px] font-black uppercase flex items-center gap-1.5 tracking-widest">
                    <Store size={12} className="text-[#FF6600]" />
                    {p.merchants?.shop_name || "Toko Tidak Diketahui"}
                  </p>
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[8px] font-black text-[#008080] uppercase bg-teal-50 border border-teal-100 px-2 py-1 rounded-md tracking-widest">
                      {p.categories?.name || "UMUM"}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                      <Box size={12} /> Stok: {p.stock} {p.unit}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-snug line-clamp-2 min-h-[2.5em]">
                    {p.name}
                  </h3>

                  {/* Harga Section */}
                  <div className="mt-3">
                    {p.promo_price > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-bold line-through">
                          Rp {p.price.toLocaleString()}
                        </span>
                        <span className="text-[15px] font-black text-[#FF6600]">
                          Rp {p.promo_price.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[15px] font-black text-[#008080]">
                        Rp {p.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Info Logistik (SKU & Berat) */}
                  <div className="mt-3 flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      <Scale size={12} className="text-slate-300" />{" "}
                      {p.weight || 0} Gr
                    </span>
                    {p.sku && <span>• SKU: {p.sku}</span>}
                  </div>
                </div>

                {/* ACTION BUTTONS PRO */}
                <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                  {/* Tombol Tolak */}
                  <button
                    disabled={processingId === p.id}
                    onClick={() => {
                      setProductToReject(p);
                      setRejectModalOpen(true);
                    }}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex flex-col items-center justify-center gap-1 border border-red-100 hover:border-red-500"
                  >
                    <XCircle size={16} /> Tolak
                  </button>

                  {/* 🚀 Tombol Edit Langsung */}
                  <button
                    disabled={processingId === p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      setViewMode("edit");
                    }}
                    className="flex-1 py-2.5 bg-slate-50 text-slate-600 hover:bg-slate-800 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex flex-col items-center justify-center gap-1 border border-slate-200 hover:border-slate-800"
                  >
                    <Edit3 size={16} /> Koreksi
                  </button>

                  {/* Tombol Setujui */}
                  <button
                    disabled={processingId === p.id}
                    onClick={() => handleUpdateStatus(p.id, "APPROVED")}
                    className="flex-1 py-2.5 bg-[#008080] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-colors flex flex-col items-center justify-center gap-1 shadow-md"
                  >
                    {processingId === p.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}{" "}
                    Setujui
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🚀 MODAL ALASAN PENOLAKAN */}
      {rejectModalOpen && productToReject && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-5 border-b border-red-100 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <div>
                <h3 className="font-black text-red-600 uppercase tracking-tight">
                  Tolak Produk
                </h3>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  Pilih alasan untuk "{productToReject.name}"
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {presetReasons.map((reason, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      name="reject_reason"
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-4 h-4 text-red-500 focus:ring-red-500"
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold ${rejectReason === reason ? "text-slate-800" : "text-slate-500 group-hover:text-slate-700"} transition-colors leading-relaxed`}
                  >
                    {reason}
                  </span>
                </label>
              ))}

              {rejectReason === "Lainnya (Tulis manual)" && (
                <div className="mt-3 pl-7 animate-in slide-in-from-top-2">
                  <textarea
                    autoFocus
                    placeholder="Tuliskan alasan penolakan secara detail..."
                    className="w-full p-3 rounded-lg border border-slate-200 focus:border-red-400 outline-none text-[11px] font-bold text-slate-700 min-h-[80px]"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setProductToReject(null);
                }}
                className="px-5 py-2.5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                disabled={processingId === productToReject.id}
                onClick={confirmReject}
                className="px-5 py-2.5 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-600 rounded-lg shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                {processingId === productToReject.id ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  "Konfirmasi Tolak"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

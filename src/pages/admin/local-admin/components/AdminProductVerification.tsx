import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
  Store,
  Tag,
  RefreshCw,
  AlertCircle,
  Edit3,
  Scale,
  Clock,
  Box,
  Search,
  Package,
} from "lucide-react";

import { useAdminProductApproval } from "../../../../hooks/useAdminProductApproval";
import { supabase } from "../../../../lib/supabaseClient";
// 🚀 Jalur Import ProductForm (Mundur 2 langkah dari folder components admin ke folder src/pages)
import { ProductForm } from "../../../merchant/components/ProductForm";

// 🚀 Menerima Props (Kabel Data) dari LocalAdminDashboard agar tidak error
interface Props {
  products?: any[];
  onAction?: () => void;
}

export const AdminProductVerification: React.FC<Props> = ({
  products: propsProducts,
  onAction,
}) => {
  const {
    loading,
    pendingProducts: hookProducts,
    processingId,
    fetchPendingProducts,
    handleProductAction,
  } = useAdminProductApproval();

  // 🚀 Menggabungkan data dari Dashboard dan Hook agar Anti-Error
  const displayProducts = propsProducts || hookProducts;
  const handleRefresh = onAction || fetchPendingProducts;

  // STATE UI & KOREKSI ADMIN
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // STATE MODAL PENOLAKAN
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    productId: "",
    reason: "Foto produk buram atau tidak sesuai.",
  });
  const [customReason, setCustomReason] = useState("");

  const presetReasons = [
    "Foto produk buram atau tidak sesuai.",
    "Harga terindikasi tidak wajar / salah ketik.",
    "Berat barang (Gram) tidak masuk akal.",
    "Deskripsi tidak lengkap atau melanggar aturan.",
    "Lainnya (Tulis manual)",
  ];

  // Ambil data Kategori untuk fitur "Koreksi"
  useEffect(() => {
    const fetchCats = async () => {
      const { data } = await supabase.from("categories").select("*");
      if (data) setCategories(data);
    };
    fetchCats();
  }, []);

  const confirmReject = () => {
    const finalReason =
      rejectModal.reason === "Lainnya (Tulis manual)"
        ? customReason
        : rejectModal.reason;
    if (!finalReason.trim()) return;

    handleProductAction(rejectModal.productId, "REJECTED", finalReason).then(
      () => {
        setRejectModal({ isOpen: false, productId: "", reason: "" });
        if (onAction) onAction(); // Update angka di sidebar
      },
    );
  };

  const confirmApprove = (id: string) => {
    handleProductAction(id, "APPROVED").then(() => {
      if (onAction) onAction(); // Update angka di sidebar
    });
  };

  // Fitur Cari
  const filteredData = displayProducts.filter((p: any) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.merchants?.shop_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // 🚀 TAMPILAN MODE KOREKSI (EDIT LANGSUNG)
  if (viewMode === "edit" && selectedProduct) {
    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <div className="mb-4 bg-teal-50 border border-teal-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-[#008080] shrink-0" size={20} />
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
            handleRefresh();
          }}
          showToast={() => {}} // Toast sudah ditangani di dalam ProductForm
        />
      </div>
    );
  }

  // 🚀 TAMPILAN UTAMA GRID PRO
  return (
    <div className="w-full animate-in fade-in duration-500 relative space-y-6">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 text-slate-800">
          <div className="w-12 h-12 bg-orange-100 text-[#FF6600] flex items-center justify-center rounded-xl border border-orange-200">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-[15px] font-black uppercase tracking-tight leading-none italic">
              Antrean Etalase
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
              {filteredData.length} Produk Menunggu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008080]"
              size={18}
            />
            <input
              type="text"
              placeholder="CARI BARANG / TOKO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-[#008080] focus:bg-white transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-orange-100 hover:text-[#FF6600] transition-colors active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* GRID PRODUK PRO */}
      {loading && displayProducts.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-24 text-center shadow-sm">
          <RefreshCw
            className="animate-spin text-orange-600 mx-auto mb-4"
            size={40}
          />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Menarik Data Etalase...
          </p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-24 text-center shadow-sm animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-teal-50 border-2 border-dashed border-teal-200 rounded-full flex items-center justify-center mx-auto mb-6 text-[#008080]">
            <CheckCircle size={48} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase italic">
            Etalase Bersih!
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">
            Semua produk di wilayah Anda telah diperiksa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((p: any) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 hover:border-[#008080] hover:shadow-xl hover:shadow-teal-900/5 transition-all group rounded-2xl flex flex-col overflow-hidden"
            >
              {/* IMAGE AREA DENGAN BADGE PRO */}
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden border-b border-slate-100 flex items-center justify-center">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}

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
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent">
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
                          Rp {p.price?.toLocaleString()}
                        </span>
                        <span className="text-[16px] font-black text-[#FF6600]">
                          Rp {p.promo_price?.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[16px] font-black text-[#008080]">
                        Rp {p.price?.toLocaleString()}
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
                  <button
                    disabled={processingId === p.id}
                    onClick={() =>
                      setRejectModal({
                        isOpen: true,
                        productId: p.id,
                        reason: presetReasons[0],
                      })
                    }
                    className="flex-1 py-2.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex flex-col items-center justify-center gap-1 border border-red-100 hover:border-red-500"
                  >
                    <X size={16} /> Tolak
                  </button>

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

                  <button
                    disabled={processingId === p.id}
                    onClick={() => confirmApprove(p.id)}
                    className="flex-1 py-2.5 bg-[#008080] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-teal-600 transition-colors flex flex-col items-center justify-center gap-1 shadow-md"
                  >
                    {processingId === p.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Check size={16} />
                    )}{" "}
                    Setujui
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL ALASAN PENOLAKAN --- */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6 text-red-600 border-b border-red-100 pb-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase text-lg italic leading-none">
                  Tolak Produk
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Pilih alasan untuk merchant
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {presetReasons.map((r, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <div className="mt-0.5">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={rejectModal.reason === r}
                      onChange={(e) =>
                        setRejectModal({
                          ...rejectModal,
                          reason: e.target.value,
                        })
                      }
                      className="w-4 h-4 text-red-500 focus:ring-red-500"
                    />
                  </div>
                  <span
                    className={`text-[12px] font-bold ${rejectModal.reason === r ? "text-slate-800" : "text-slate-500 group-hover:text-slate-700"} transition-colors leading-relaxed`}
                  >
                    {r}
                  </span>
                </label>
              ))}

              {rejectModal.reason === "Lainnya (Tulis manual)" && (
                <div className="mt-3 pl-7 animate-in slide-in-from-top-2">
                  <textarea
                    autoFocus
                    placeholder="Tuliskan alasan penolakan secara spesifik..."
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-red-400 outline-none text-[12px] font-bold text-slate-700 min-h-[80px]"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setRejectModal({ isOpen: false, productId: "", reason: "" })
                }
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={confirmReject}
                disabled={
                  processingId === rejectModal.productId ||
                  (rejectModal.reason === "Lainnya (Tulis manual)" &&
                    !customReason.trim())
                }
                className="flex-[2] py-3.5 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all shadow-md flex justify-center items-center gap-2"
              >
                {processingId === rejectModal.productId ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Kirim Penolakan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
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
} from "lucide-react";

import { useAdminProductApproval } from "../../../../hooks/useAdminProductApproval";

export const AdminProductVerification: React.FC = () => {
  const {
    loading,
    pendingProducts,
    processingId,
    fetchPendingProducts,
    handleProductAction,
  } = useAdminProductApproval();

  // State untuk mengontrol Modal Penolakan
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    productId: "",
    reason: "",
  });

  const confirmReject = () => {
    if (!rejectModal.reason.trim()) return;
    handleProductAction(rejectModal.productId, "REJECTED", rejectModal.reason);
    setRejectModal({ isOpen: false, productId: "", reason: "" });
  };

  return (
    <div className="w-full animate-in fade-in duration-500 relative">
      {/* HEADER KECIL */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase italic">
            Antrean Etalase
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {pendingProducts.length} Produk menunggu persetujuan
          </p>
        </div>
        <button
          onClick={fetchPendingProducts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Segarkan Data
        </button>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-24 text-center">
            <RefreshCw
              className="animate-spin text-orange-600 mx-auto mb-4"
              size={40}
            />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Menarik Data Etalase...
            </p>
          </div>
        ) : pendingProducts.length === 0 ? (
          <div className="p-24 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic text-slate-800">
              Etalase Bersih!
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">
              Semua produk di wilayah Anda telah diperiksa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Info Barang
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Harga & Stok
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Toko
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    Validasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingProducts.map((product: any) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="text-slate-300" size={24} />
                          )}
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Tag size={10} />{" "}
                            {product.categories?.name || "UMUM"}
                          </p>
                          <p className="text-sm font-black text-slate-800 uppercase leading-tight line-clamp-2">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-base font-black text-teal-600 italic">
                        Rp {product.price?.toLocaleString()}
                      </p>
                      <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[9px] font-bold uppercase mt-1 inline-block">
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <Store size={14} className="text-slate-400" />
                        <p className="text-[11px] font-bold text-slate-700 uppercase">
                          {product.merchants?.shop_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            handleProductAction(product.id, "APPROVED")
                          }
                          disabled={processingId === product.id}
                          className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                        >
                          {processingId === product.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Check size={20} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setRejectModal({
                              isOpen: true,
                              productId: product.id,
                              reason: "",
                            })
                          }
                          disabled={processingId === product.id}
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL ALASAN PENOLAKAN --- */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-4 mb-6 text-red-600">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase text-xl italic leading-none">
                  Alasan Ditolak
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Pemberitahuan Merchant
                </p>
              </div>
            </div>

            <textarea
              value={rejectModal.reason}
              onChange={(e) =>
                setRejectModal({ ...rejectModal, reason: e.target.value })
              }
              placeholder="Contoh: Foto buram atau harga tidak wajar..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-red-500 min-h-[120px] mb-6 resize-none"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setRejectModal({ isOpen: false, productId: "", reason: "" })
                }
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest"
              >
                Batal
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectModal.reason.trim()}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
